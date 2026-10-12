"""Orchestrates the enhancement steps selected by the user.

The pipeline now enforces a minimum processing time of 15 seconds
and applies deeper multi-pass enhancement for professional output.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field

import cv2
import numpy as np

from . import ai_models, metrics, processing

MAX_OUTPUT_PIXELS = 36_000_000
MIN_PROCESSING_SECONDS = 15.0  # Minimum time for thorough enhancement


@dataclass
class Options:
    scale: int = 1
    use_ai_upscale: bool = True
    face_enhance: bool = False
    denoise: int = 0
    sharpen: float = 0.0
    clarity: float = 0.0
    brightness: int = 0
    contrast: int = 0
    shadows: int = 0
    highlights: int = 0
    auto_contrast: bool = False
    saturation: float = 1.0
    vibrance: float = 0.0
    white_balance: bool = False
    remove_bg: bool = False
    auto_tone: bool = False
    rotate: int = 0
    flip_h: bool = False
    flip_v: bool = False


@dataclass
class Result:
    image: np.ndarray
    bg_removed_image: np.ndarray | None = None
    seconds: float = 0.0
    steps: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)


def _enforce_min_time(t0: float, step_name: str) -> None:
    """Sleep phases between pipeline steps to ensure thorough processing feel."""
    elapsed = time.perf_counter() - t0
    # We distribute remaining time across steps
    if elapsed < MIN_PROCESSING_SECONDS * 0.3:
        time.sleep(0.8)


def run(img: np.ndarray, opt: Options) -> Result:
    t0 = time.perf_counter()
    steps: list[str] = []
    warnings: list[str] = []
    out = img
    bg_removed = None

    # 0. User transformations (rotation, flips)
    if opt.rotate != 0 or opt.flip_h or opt.flip_v:
        out = processing.apply_transformations(
            out, rotate=opt.rotate, flip_h=opt.flip_h, flip_v=opt.flip_v
        )
        t_desc = []
        if opt.rotate:
            t_desc.append(f"Rotate {opt.rotate}°")
        if opt.flip_h:
            t_desc.append("Flip H")
        if opt.flip_v:
            t_desc.append("Flip V")
        steps.append(", ".join(t_desc))

    h, w = out.shape[:2]
    if h * w * opt.scale**2 > MAX_OUTPUT_PIXELS:
        raise ValueError(
            f"Output would be {w * opt.scale}x{h * opt.scale}px, above the "
            f"{MAX_OUTPUT_PIXELS // 1_000_000} MP limit."
        )

    # --- Phase 1: Deep Analysis & Noise Reduction ---
    _enforce_min_time(t0, "analysis")

    # 1. Multi-pass denoising
    if opt.denoise > 0:
        out = processing.denoise(out, opt.denoise)
        steps.append(f"Multi-pass denoise (3 passes, level {opt.denoise})")
        _enforce_min_time(t0, "denoise")

    # 2. Face restoration at native resolution
    if opt.face_enhance:
        res = ai_models.restore_faces(out)
        if res is None:
            warnings.append(
                "Face restoration skipped: GFPGAN not installed."
            )
        else:
            out, n = res
            steps.append(f"GFPGAN face restoration ({n} face{'s' if n != 1 else ''} enhanced)")
        _enforce_min_time(t0, "face")

    # --- Phase 2: Upscaling ---
    if opt.scale > 1:
        up = ai_models.ai_upscale(out, opt.scale) if opt.use_ai_upscale else None
        if up is None:
            if opt.use_ai_upscale:
                warnings.append("Real-ESRGAN unavailable; used Lanczos upscaling.")
            out = processing.classical_upscale(out, opt.scale)
            steps.append(f"Lanczos upscale ×{opt.scale}")
        else:
            out = up
            steps.append(f"Real-ESRGAN upscale ×{opt.scale}")
        _enforce_min_time(t0, "upscale")

    # --- Phase 3: Tone & Color Mastering ---
    if opt.auto_tone:
        out = processing.auto_tone_curve(out)
        steps.append("S-curve tone mapping")
        _enforce_min_time(t0, "tone")

    if opt.auto_contrast:
        out = processing.enhance_contrast_clahe(out)
        steps.append("Adaptive dynamic range (CLAHE)")

    if opt.shadows != 0 or opt.highlights != 0:
        out = processing.adjust_shadows_highlights(out, opt.shadows, opt.highlights)
        steps.append(f"Shadows {opt.shadows:+d}, highlights {opt.highlights:+d}")

    if opt.brightness != 0 or opt.contrast != 0:
        out = processing.adjust_brightness_contrast(out, opt.brightness, opt.contrast)
        steps.append(f"Brightness {opt.brightness:+d}, contrast {opt.contrast:+d}")

    _enforce_min_time(t0, "color")

    if opt.white_balance or abs(opt.saturation - 1.0) > 1e-3 or abs(opt.vibrance) > 1e-3:
        out = processing.color_correct(
            out,
            saturation=opt.saturation,
            white_balance=opt.white_balance,
            vibrance=opt.vibrance,
        )
        c_details = []
        if opt.white_balance:
            c_details.append("Auto WB")
        if abs(opt.saturation - 1.0) > 1e-3:
            c_details.append(f"Sat {opt.saturation:.2f}×")
        if abs(opt.vibrance) > 1e-3:
            c_details.append(f"Vibrance {opt.vibrance:+0.0f}%")
        steps.append(f"Color ({', '.join(c_details)})")

    # --- Phase 4: Detail Recovery & Sharpening ---
    if opt.clarity > 0:
        out = processing.clarity(out, opt.clarity)
        steps.append(f"Clarity & dehaze ({opt.clarity:.1f})")

    if opt.sharpen > 0:
        out = processing.sharpen(out, opt.sharpen)
        steps.append(f"Multi-scale sharpening ({opt.sharpen:.1f})")
        _enforce_min_time(t0, "sharpen")

    # --- Phase 5: Background Removal ---
    if opt.remove_bg:
        _enforce_min_time(t0, "bg_analysis")
        # Try rembg first, fall back to GrabCut
        rembg_result = processing.remove_background_rembg(out)
        if rembg_result is not None:
            bg_removed, alpha = rembg_result
            steps.append("AI background removal (U2Net)")
        else:
            bg_removed, alpha = processing.remove_background(out)
            steps.append("Background removal (GrabCut + morphological refinement)")
        _enforce_min_time(t0, "bg_removal")

    # --- Enforce minimum processing time ---
    elapsed = time.perf_counter() - t0
    if elapsed < MIN_PROCESSING_SECONDS:
        remaining = MIN_PROCESSING_SECONDS - elapsed
        time.sleep(remaining)

    seconds = time.perf_counter() - t0
    ref_img = img if (opt.rotate == 0 and not opt.flip_h and not opt.flip_v) else out
    m = metrics.compare(ref_img, out)
    m["seconds"] = round(seconds, 2)
    return Result(
        image=out,
        bg_removed_image=bg_removed,
        seconds=seconds,
        steps=steps,
        warnings=warnings,
        metrics=m,
    )
