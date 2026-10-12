"""FastAPI application for the AI-Based Photo Enhancement System."""
from __future__ import annotations

import io
import os
import tempfile
import time
import uuid
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from . import ai_models, pipeline

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
FILE_TTL_SECONDS = 60 * 60

# Safe cross-platform cache/store directory
DEFAULT_STORE = Path(tempfile.gettempdir()) / "photo_enhancer_store"
STORE = Path(os.environ.get("STORE_DIR", str(DEFAULT_STORE)))
STORE.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="AI Photo Enhancement API",
    description="Professional image upscaling, face restoration and photographic polishing engine.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cleanup() -> None:
    now = time.time()
    for p in STORE.glob("*"):
        try:
            if now - p.stat().st_mtime > FILE_TTL_SECONDS:
                p.unlink()
        except OSError:
            pass


def _load_image_from_bytes(data: bytes) -> np.ndarray:
    """Decode bytes with automatic EXIF orientation normalization and alpha channel preservation."""
    try:
        pil_img = Image.open(io.BytesIO(data))
        pil_img = ImageOps.exif_transpose(pil_img)
        if pil_img.mode == "RGBA":
            # Flatten RGBA onto a white canvas for clean output
            bg = Image.new("RGBA", pil_img.size, (255, 255, 255, 255))
            bg.alpha_composite(pil_img)
            pil_img = bg.convert("RGB")
        elif pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
        arr = np.array(pil_img)
        # Convert RGB to OpenCV BGR
        return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    except Exception:
        # Fallback to cv2.imdecode
        img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        return img


def _encode(img: np.ndarray, fmt: str, quality: int = 95) -> bytes:
    if fmt == "png":
        params = [cv2.IMWRITE_PNG_COMPRESSION, 3]
        ext = ".png"
    elif fmt == "jpeg":
        params = [cv2.IMWRITE_JPEG_QUALITY, max(10, min(100, quality))]
        ext = ".jpg"
    elif fmt == "webp":
        params = [cv2.IMWRITE_WEBP_QUALITY, max(10, min(100, quality))]
        ext = ".webp"
    else:
        raise HTTPException(422, f"Unsupported format: {fmt}")

    ok, buf = cv2.imencode(ext, img, params)
    if not ok:
        raise HTTPException(500, "Could not encode image")
    return buf.tobytes()


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "models": ai_models.status(),
        "store": str(STORE),
        "version": "2.0.0",
    }


@app.post("/api/enhance")
async def enhance(
    file: UploadFile = File(...),
    scale: int = Form(1),
    use_ai_upscale: bool = Form(True),
    face_enhance: bool = Form(False),
    denoise: int = Form(0),
    sharpen: float = Form(0.0),
    clarity: float = Form(0.0),
    brightness: int = Form(0),
    contrast: int = Form(0),
    shadows: int = Form(0),
    highlights: int = Form(0),
    auto_contrast: bool = Form(False),
    saturation: float = Form(1.0),
    vibrance: float = Form(0.0),
    white_balance: bool = Form(False),
    rotate: int = Form(0),
    flip_h: bool = Form(False),
    flip_v: bool = Form(False),
):
    # Validation
    if file.content_type and file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, "Unsupported file format. Please upload JPEG, PNG, or WebP.")
    
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"File is too large (max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB).")

    img = _load_image_from_bytes(data)
    if img is None:
        raise HTTPException(400, "Could not decode uploaded file as an image.")

    if scale not in (1, 2, 4):
        raise HTTPException(422, "Scale must be 1, 2 or 4.")

    opt = pipeline.Options(
        scale=scale,
        use_ai_upscale=use_ai_upscale,
        face_enhance=face_enhance,
        denoise=max(0, min(10, denoise)),
        sharpen=max(0.0, min(3.0, sharpen)),
        clarity=max(0.0, min(2.0, clarity)),
        brightness=max(-100, min(100, brightness)),
        contrast=max(-100, min(100, contrast)),
        shadows=max(-100, min(100, shadows)),
        highlights=max(-100, min(100, highlights)),
        auto_contrast=auto_contrast,
        saturation=max(0.0, min(2.0, saturation)),
        vibrance=max(-100.0, min(100.0, vibrance)),
        white_balance=white_balance,
        rotate=rotate if rotate in (0, 90, 180, 270) else 0,
        flip_h=flip_h,
        flip_v=flip_v,
    )

    try:
        result = await run_in_threadpool(pipeline.run, img, opt)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

    _cleanup()
    job = uuid.uuid4().hex
    
    # Store PNG versions for lossless preview and on-demand conversion
    (STORE / f"{job}_original.png").write_bytes(_encode(img, "png"))
    (STORE / f"{job}_enhanced.png").write_bytes(_encode(result.image, "png"))

    oh, ow = img.shape[:2]
    eh, ew = result.image.shape[:2]
    orig_bytes = len(data)
    enhanced_bytes = (STORE / f"{job}_enhanced.png").stat().st_size

    return {
        "id": job,
        "filename": Path(file.filename or "photo").stem,
        "original_url": f"/api/files/{job}/original",
        "enhanced_url": f"/api/files/{job}/enhanced",
        "original_size": {"width": ow, "height": oh, "bytes": orig_bytes},
        "enhanced_size": {"width": ew, "height": eh, "bytes": enhanced_bytes},
        "steps": result.steps,
        "warnings": result.warnings,
        "metrics": result.metrics,
    }


@app.get("/api/files/{job}/{kind}")
def get_file(
    job: str,
    kind: str,
    format: str = "png",
    quality: int = Query(95, ge=10, le=100),
    download: bool = False,
    filename: str = "enhanced",
):
    if kind not in ("original", "enhanced") or not job.isalnum():
        raise HTTPException(404, "Not found")
    
    format_clean = "jpeg" if format in ("jpg", "jpeg") else format.lower()
    if format_clean not in ("png", "jpeg", "webp"):
        raise HTTPException(422, "format must be png, jpeg, or webp")

    path = STORE / f"{job}_{kind}.png"
    if not path.exists():
        raise HTTPException(404, "File expired or not found")

    content_types = {
        "png": "image/png",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
    }

    if format_clean == "png":
        content = path.read_bytes()
    else:
        img = cv2.imread(str(path))
        if img is None:
            raise HTTPException(500, "Failed reading stored image")
        content = _encode(img, format_clean, quality=quality)

    headers = {}
    if download:
        ext = "jpg" if format_clean == "jpeg" else format_clean
        safe_name = "".join(c for c in filename if c.isalnum() or c in ("-", "_")).strip() or "enhanced"
        headers["Content-Disposition"] = f'attachment; filename="{safe_name}.{ext}"'

    return Response(content, media_type=content_types[format_clean], headers=headers)
