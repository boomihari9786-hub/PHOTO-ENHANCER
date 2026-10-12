"""Classical and modern image-processing operations built on OpenCV and NumPy.

Includes multi-pass enhancement, background removal via GrabCut, and
photographic-grade filters for a deeply enhanced output.
"""
from __future__ import annotations

import logging
import time

import cv2
import numpy as np

log = logging.getLogger("enhancer.processing")


# ---------------------------------------------------------------------------
# Background Removal (GrabCut + edge refinement)
# ---------------------------------------------------------------------------

def remove_background(img: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Remove the background using OpenCV GrabCut with edge-aware refinement.

    Returns (rgba_image, alpha_mask) where rgba_image is a 4-channel BGRA
    image and alpha_mask is 0-255 single-channel.
    """
    h, w = img.shape[:2]

    # Shrink for speed if large
    max_dim = 1024
    scale = 1.0
    work = img
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        work = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

    wh, ww = work.shape[:2]

    # --- Initial GrabCut with a generous rectangle ---
    margin_x = max(4, int(ww * 0.02))
    margin_y = max(4, int(wh * 0.02))
    rect = (margin_x, margin_y, ww - 2 * margin_x, wh - 2 * margin_y)

    mask = np.zeros((wh, ww), np.uint8)
    bg_model = np.zeros((1, 65), np.float64)
    fg_model = np.zeros((1, 65), np.float64)

    # First pass with rect
    cv2.grabCut(work, mask, rect, bg_model, fg_model, 5, cv2.GC_INIT_WITH_RECT)

    # Second pass for refinement
    cv2.grabCut(work, mask, rect, bg_model, fg_model, 3, cv2.GC_EVAL)

    # Build alpha from mask
    alpha_small = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # Edge refinement: smooth alpha boundary with guided filter-like approach
    alpha_small = cv2.GaussianBlur(alpha_small, (5, 5), 0)
    _, alpha_small = cv2.threshold(alpha_small, 127, 255, cv2.THRESH_BINARY)

    # Morphological cleanup: remove small holes and noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    alpha_small = cv2.morphologyEx(alpha_small, cv2.MORPH_CLOSE, kernel, iterations=2)
    alpha_small = cv2.morphologyEx(alpha_small, cv2.MORPH_OPEN, kernel, iterations=1)

    # Feather the edges for natural look
    alpha_small = cv2.GaussianBlur(alpha_small, (7, 7), 1.5)

    # Scale alpha back to original size
    if scale != 1.0:
        alpha = cv2.resize(alpha_small, (w, h), interpolation=cv2.INTER_LINEAR)
    else:
        alpha = alpha_small

    # Build BGRA output
    bgra = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    bgra[:, :, 3] = alpha

    return bgra, alpha


def remove_background_rembg(img: np.ndarray) -> tuple[np.ndarray, np.ndarray] | None:
    """Try to remove background using rembg (U2Net neural network).
    Returns None if rembg is not installed.
    """
    try:
        from rembg import remove as rembg_remove
        from PIL import Image
        import io

        # Convert BGR to RGB for PIL
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)

        # rembg returns RGBA PIL image
        result_pil = rembg_remove(pil_img)
        result_arr = np.array(result_pil)

        # Convert RGBA back to BGRA for OpenCV
        bgra = cv2.cvtColor(result_arr, cv2.COLOR_RGBA2BGRA)
        alpha = bgra[:, :, 3]

        return bgra, alpha
    except ImportError:
        log.info("rembg not installed, falling back to GrabCut")
        return None
    except Exception as exc:
        log.warning("rembg failed: %s, falling back to GrabCut", exc)
        return None


# ---------------------------------------------------------------------------
# Multi-pass deep enhancement
# ---------------------------------------------------------------------------

def multi_pass_denoise(img: np.ndarray, strength: int = 3, passes: int = 3) -> np.ndarray:
    """Multi-pass edge-preserving denoising for deep noise reduction.
    Each pass uses bilateral filtering followed by a detail-recovery blend.
    """
    if strength <= 0:
        return img

    out = img.copy()
    for p in range(passes):
        # Progressively reduce strength per pass to avoid over-smoothing
        pass_strength = max(1, strength - p)

        d = 5 + int(pass_strength * 0.6)
        sigma_color = float(pass_strength * 10.0)
        sigma_space = float(pass_strength * 8.0)

        filtered = cv2.bilateralFilter(out, d=d, sigmaColor=sigma_color, sigmaSpace=sigma_space)

        # Blend back some original detail to avoid plastic look
        blend = 0.85 - (p * 0.05)
        out = cv2.addWeighted(filtered, blend, out, 1.0 - blend, 0)

    # Final NLM pass for chroma noise on reasonable-sized images
    if strength > 3 and img.shape[0] * img.shape[1] <= 4_000_000:
        nlm_h = float(strength * 0.5)
        out = cv2.fastNlMeansDenoisingColored(out, None, nlm_h, nlm_h, 5, 15)

    return out


def deep_sharpen(img: np.ndarray, amount: float = 1.0, passes: int = 2) -> np.ndarray:
    """Multi-scale sharpening: coarse detail + fine detail passes."""
    if amount <= 0:
        return img

    out = img.copy()
    for p in range(passes):
        sigma = 1.2 + p * 0.8  # Increasing radius per pass
        pass_amount = amount * (0.7 if p > 0 else 1.0)  # Reduce in later passes
        blur = cv2.GaussianBlur(out, (0, 0), sigma)
        out = cv2.addWeighted(out, 1.0 + pass_amount, blur, -pass_amount, 0)

    return out


def auto_tone_curve(img: np.ndarray) -> np.ndarray:
    """Apply an S-curve tone mapping for richer contrast and depth."""
    lut = np.zeros(256, dtype=np.uint8)
    for i in range(256):
        x = i / 255.0
        # S-curve: push shadows darker and highlights brighter
        y = x * x * (3.0 - 2.0 * x)
        # Subtle blend: 30% S-curve + 70% linear
        blended = 0.7 * x + 0.3 * y
        lut[i] = int(np.clip(blended * 255.0, 0, 255))

    return cv2.LUT(img, lut)


def film_grain(img: np.ndarray, intensity: float = 0.03) -> np.ndarray:
    """Add subtle photographic film grain for a cinematic look."""
    if intensity <= 0:
        return img
    noise = np.random.normal(0, intensity * 255, img.shape).astype(np.float32)
    out = img.astype(np.float32) + noise
    return np.clip(out, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------------------
# Original processing functions (kept & improved)
# ---------------------------------------------------------------------------

def denoise(img: np.ndarray, strength: int = 3) -> np.ndarray:
    """Edge-preserving denoising. strength in [0, 10]."""
    if strength <= 0:
        return img
    return multi_pass_denoise(img, strength, passes=3)


def adjust_brightness_contrast(
    img: np.ndarray, brightness: int = 0, contrast: int = 0
) -> np.ndarray:
    """brightness / contrast in [-100, 100]."""
    if brightness == 0 and contrast == 0:
        return img
    alpha = 1.0 + contrast / 100.0
    beta = brightness * 2.55
    return cv2.convertScaleAbs(img, alpha=alpha, beta=beta)


def enhance_contrast_clahe(img: np.ndarray, clip_limit: float = 2.0) -> np.ndarray:
    """Adaptive histogram equalisation on the luminance channel (LAB color space)."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    l = clahe.apply(l)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)


def adjust_shadows_highlights(img: np.ndarray, shadows: int = 0, highlights: int = 0) -> np.ndarray:
    """Adjust dark and bright zones without blowing out mids."""
    if shadows == 0 and highlights == 0:
        return img

    f = img.astype(np.float32) / 255.0

    if shadows != 0:
        shadow_factor = shadows / 100.0
        shadow_mask = 1.0 - f
        f = f + shadow_factor * shadow_mask * 0.35

    if highlights != 0:
        hl_factor = highlights / 100.0
        hl_mask = f
        f = f + hl_factor * hl_mask * 0.25

    return np.clip(f * 255.0, 0, 255).astype(np.uint8)


def clarity(img: np.ndarray, amount: float = 0.5) -> np.ndarray:
    """Mid-tone local contrast (Clarity/Dehaze). amount: 0.0 to 2.0."""
    if amount <= 0:
        return img

    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    l_channel = lab[..., 0]

    radius = max(5, int(min(img.shape[:2]) * 0.03))
    if radius % 2 == 0:
        radius += 1
    blurred_l = cv2.GaussianBlur(l_channel, (radius, radius), 0)

    high_pass = l_channel - blurred_l
    enhanced_l = l_channel + high_pass * (amount * 0.8)
    lab[..., 0] = np.clip(enhanced_l, 0, 255)

    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)


def sharpen(img: np.ndarray, amount: float = 1.0, sigma: float = 1.2) -> np.ndarray:
    """Multi-pass unsharp mask. amount: 0 (off) .. ~3 (strong)."""
    if amount <= 0:
        return img
    return deep_sharpen(img, amount, passes=2)


def color_correct(
    img: np.ndarray,
    saturation: float = 1.0,
    white_balance: bool = False,
    vibrance: float = 0.0,
) -> np.ndarray:
    """Grey-world white balance, smart saturation, and intelligent vibrance."""
    out = img
    if white_balance:
        f = out.astype(np.float32)
        means = f.reshape(-1, 3).mean(axis=0)
        gray = means.mean()
        scale = gray / np.maximum(means, 1e-4)
        scale = np.clip(scale, 0.7, 1.4)
        f *= scale
        out = np.clip(f, 0, 255).astype(np.uint8)

    if abs(vibrance) > 1e-3 or abs(saturation - 1.0) > 1e-3:
        hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
        s = hsv[..., 1] / 255.0

        if abs(vibrance) > 1e-3:
            weight = (1.0 - s) * (vibrance / 100.0)
            s = np.clip(s + weight, 0.0, 1.0)

        if abs(saturation - 1.0) > 1e-3:
            s = np.clip(s * saturation, 0.0, 1.0)

        hsv[..., 1] = s * 255.0
        out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    return out


def apply_transformations(
    img: np.ndarray,
    rotate: int = 0,
    flip_h: bool = False,
    flip_v: bool = False,
) -> np.ndarray:
    """Apply 90-degree rotations and horizontal/vertical flips."""
    out = img
    if rotate == 90:
        out = cv2.rotate(out, cv2.ROTATE_90_CLOCKWISE)
    elif rotate == 180:
        out = cv2.rotate(out, cv2.ROTATE_180)
    elif rotate == 270:
        out = cv2.rotate(out, cv2.ROTATE_90_COUNTERCLOCKWISE)

    if flip_h:
        out = cv2.flip(out, 1)
    if flip_v:
        out = cv2.flip(out, 0)

    return out


def classical_upscale(img: np.ndarray, scale: int) -> np.ndarray:
    """Fallback high-quality upscaler (Lanczos)."""
    if scale == 1:
        return img
    h, w = img.shape[:2]
    return cv2.resize(img, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)
