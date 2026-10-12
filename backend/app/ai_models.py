"""Lazy loaders for Real-ESRGAN (upscaling) and GFPGAN (face restoration).

The heavy deep-learning dependencies are optional. If they (or the weight
files) are missing, the API still works: upscaling falls back to Lanczos and
face restoration is skipped, and the response says so in `warnings`.
"""
from __future__ import annotations

import logging
import os
import threading
import urllib.request
from pathlib import Path

import numpy as np

log = logging.getLogger("enhancer.ai")

WEIGHTS_DIR = Path(os.environ.get("WEIGHTS_DIR", Path(__file__).resolve().parent.parent / "weights"))
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

ESRGAN_X4_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
GFPGAN_URL = "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth"

_lock = threading.Lock()
_upsampler = None
_face_enhancer = None
_errors: dict[str, str] = {}


def _download(url: str, dest: Path) -> Path:
    if dest.exists():
        return dest
    log.info("Downloading %s", url)
    urllib.request.urlretrieve(url, dest)  # noqa: S310 (fixed https URLs)
    return dest


def _device() -> str:
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:  # torch not installed
        return "cpu"


def get_upsampler():
    """Return a RealESRGANer (x4 model) or None if unavailable."""
    global _upsampler
    if _upsampler is not None:
        return _upsampler
    if "esrgan" in _errors:
        return None
    with _lock:
        if _upsampler is not None:
            return _upsampler
        try:
            from basicsr.archs.rrdbnet_arch import RRDBNet
            from realesrgan import RealESRGANer

            path = _download(ESRGAN_X4_URL, WEIGHTS_DIR / "RealESRGAN_x4plus.pth")
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            use_cuda = _device() == "cuda"
            _upsampler = RealESRGANer(
                scale=4,
                model_path=str(path),
                model=model,
                tile=0 if use_cuda else 256,  # tile on CPU to bound memory
                tile_pad=10,
                pre_pad=0,
                half=use_cuda,
            )
        except Exception as exc:  # noqa: BLE001
            _errors["esrgan"] = str(exc)
            log.warning("Real-ESRGAN unavailable: %s", exc)
            return None
    return _upsampler


def get_face_enhancer():
    """Return a GFPGANer or None if unavailable."""
    global _face_enhancer
    if _face_enhancer is not None:
        return _face_enhancer
    if "gfpgan" in _errors:
        return None
    with _lock:
        if _face_enhancer is not None:
            return _face_enhancer
        try:
            from gfpgan import GFPGANer

            path = _download(GFPGAN_URL, WEIGHTS_DIR / "GFPGANv1.4.pth")
            _face_enhancer = GFPGANer(
                model_path=str(path),
                upscale=1,  # we handle scaling separately
                arch="clean",
                channel_multiplier=2,
                bg_upsampler=None,
            )
        except Exception as exc:  # noqa: BLE001
            _errors["gfpgan"] = str(exc)
            log.warning("GFPGAN unavailable: %s", exc)
            return None
    return _face_enhancer


def status() -> dict:
    return {
        "device": _device(),
        "realesrgan_loaded": _upsampler is not None,
        "gfpgan_loaded": _face_enhancer is not None,
        "errors": dict(_errors),
    }


def ai_upscale(img: np.ndarray, scale: int) -> np.ndarray | None:
    """Upscale with Real-ESRGAN. `scale` is 2 or 4. Returns None if unavailable."""
    up = get_upsampler()
    if up is None:
        return None
    out, _ = up.enhance(img, outscale=scale)
    return out


def restore_faces(img: np.ndarray) -> tuple[np.ndarray, int] | None:
    """Restore faces in a BGR image. Returns (image, faces_found) or None."""
    fe = get_face_enhancer()
    if fe is None:
        return None
    cropped, _restored, out = fe.enhance(
        img, has_aligned=False, only_center_face=False, paste_back=True
    )
    return out, len(cropped)
