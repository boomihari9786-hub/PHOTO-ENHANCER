"""Orchestrates the enhancement steps selected by the user."""
from __future__ import annotations

import time
from dataclasses import dataclass, field

import numpy as np

from . import ai_models, metrics, processing

MAX_OUTPUT_PIXELS = 36_000_000  # guard against out-of-memory on huge upscales


@dataclass
class Options:
    scale: int = 1  # 1, 2 or 4
    use_ai_upscale: bool = True
    face_enhance: bool = False
    denoise: int = 0  # 0..10
    sharpen: float = 0.0  # 0..3
    clarity: float = 0.0  # 0..2
    brightness: int = 0  # -100..100
    contrast: int = 0  # -100..100
    shadows: int = 0  # -100..100
    highlights: int = 0  # -100..100
    auto_contrast: bool = False  # CLAHE
    saturation: float = 1.0  # 0..2
    vibrance: float = 0.0  # -100..100
    white_balance: bool = False
    rotate: int = 0  # 0, 90, 180, 270
    flip_h: bool = False
    flip_v: bool = False


@dataclass
class Result:
    image: np.ndarray
    seconds: float
    steps: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)


def run(img: np.ndarray, opt: Options) -> Result:
    t0 = time.perf_counter()
    steps: list[str] = []
    warnings: list[str] = []
    out = img

    # 0. User transformations (rotation, flips) first if requested
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
            f"{MAX_OUTPUT_PIXELS // 1_000_000} MP limit. Use a smaller image or scale."
        )

    # 1. Noise reduction first, so the upscaler does not amplify noise.
    if opt.denoise > 0:
        out = processing.denoise(out, opt.denoise)
        steps.append(f"Denoise (level {opt.denoise})")

    # 2. Face restoration at native resolution.
    if opt.face_enhance:
        res = ai_models.restore_faces(out)
        if res is None:
            warnings.append(
                "Face restoration skipped: GFPGAN is not installed or its weights could not be loaded."
            )
        else:
            out, n = res
            steps.append(f"GFPGAN face restoration ({n} face{'s' if n != 1 else ''} enhanced)")

    # 3. Upscaling.
    if opt.scale > 1:
        up = ai_models.ai_upscale(out, opt.scale) if opt.use_ai_upscale else None
        if up is None:
            if opt.use_ai_upscale:
                warnings.append("Real-ESRGAN unavailable; used Lanczos high-fidelity upscaling instead.")
            out = processing.classical_upscale(out, opt.scale)
            steps.append(f"Lanczos upscale x{opt.scale}")
        else:
            out = up
            steps.append(f"Real-ESRGAN upscale x{opt.scale}")

    # 4. Tone, dynamic range and colour.
    if opt.auto_contrast:
        out = processing.enhance_contrast_clahe(out)
        steps.append("Adaptive dynamic range (CLAHE)")
        
    if opt.shadows != 0 or opt.highlights != 0:
        out = processing.adjust_shadows_highlights(out, opt.shadows, opt.highlights)
        steps.append(f"Shadows {opt.shadows:+d}, highlights {opt.highlights:+d}")

    if opt.brightness != 0 or opt.contrast != 0:
        out = processing.adjust_brightness_contrast(out, opt.brightness, opt.contrast)
        steps.append(f"Brightness {opt.brightness:+d}, contrast {opt.contrast:+d}")

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
            c_details.append(f"Sat {opt.saturation:.2f}x")
        if abs(opt.vibrance) > 1e-3:
            c_details.append(f"Vibrance {opt.vibrance:+0.0f}%")
        steps.append(f"Color ({', '.join(c_details)})")

    # 5. Clarity & Sharpening last.
    if opt.clarity > 0:
        out = processing.clarity(out, opt.clarity)
        steps.append(f"Clarity & Dehaze ({opt.clarity:.1f})")

    if opt.sharpen > 0:
        out = processing.sharpen(out, opt.sharpen)
        steps.append(f"Sharpening ({opt.sharpen:.1f})")

    seconds = time.perf_counter() - t0
    m = metrics.compare(img if (opt.rotate == 0 and not opt.flip_h and not opt.flip_v) else out, out)
    m["seconds"] = round(seconds, 2)
    return Result(image=out, seconds=seconds, steps=steps, warnings=warnings, metrics=m)
