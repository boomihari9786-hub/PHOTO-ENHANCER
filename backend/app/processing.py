"""Classical and modern image-processing operations built on OpenCV and NumPy."""
from __future__ import annotations

import cv2
import numpy as np


def denoise(img: np.ndarray, strength: int = 3) -> np.ndarray:
    """Edge-preserving denoising.
    strength in [0, 10].
    For fast, high-quality denoising that protects fine details, we use
    adaptive bilateral filtering for responsive performance, with multi-scale
    non-local means for heavier passes.
    """
    if strength <= 0:
        return img
    
    # Bilateral filter is edge-preserving and doesn't destroy textures like plain blur
    d = 5 + int(strength * 0.8)
    sigma_color = float(strength * 12.0)
    sigma_space = float(strength * 10.0)
    
    filtered = cv2.bilateralFilter(img, d=d, sigmaColor=sigma_color, sigmaSpace=sigma_space)
    
    # For higher strength (>5), blend subtle NLM if image is not giant to remove remaining chroma noise
    if strength > 5 and img.shape[0] * img.shape[1] <= 4_000_000:
        nlm_h = float(strength * 0.7)
        filtered = cv2.fastNlMeansDenoisingColored(filtered, None, nlm_h, nlm_h, 5, 15)
        
    return filtered


def adjust_brightness_contrast(
    img: np.ndarray, brightness: int = 0, contrast: int = 0
) -> np.ndarray:
    """brightness / contrast in [-100, 100]."""
    if brightness == 0 and contrast == 0:
        return img
    alpha = 1.0 + contrast / 100.0  # gain
    beta = brightness * 2.55  # bias
    return cv2.convertScaleAbs(img, alpha=alpha, beta=beta)


def enhance_contrast_clahe(img: np.ndarray, clip_limit: float = 2.0) -> np.ndarray:
    """Adaptive histogram equalisation on the luminance channel (LAB color space)."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    l = clahe.apply(l)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)


def adjust_shadows_highlights(img: np.ndarray, shadows: int = 0, highlights: int = 0) -> np.ndarray:
    """Adjust dark and bright zones without blowing out mids.
    shadows in [-100, 100]: > 0 lifts shadows.
    highlights in [-100, 100]: < 0 reduces blown highlights.
    """
    if shadows == 0 and highlights == 0:
        return img
    
    f = img.astype(np.float32) / 255.0
    
    # Lift shadows via inverse mask
    if shadows != 0:
        shadow_factor = shadows / 100.0
        # Mask where image is dark: (1 - f)
        shadow_mask = 1.0 - f
        f = f + shadow_factor * shadow_mask * 0.35
        
    # Tame highlights
    if highlights != 0:
        hl_factor = highlights / 100.0
        # Mask where image is bright: f
        hl_mask = f
        f = f + hl_factor * hl_mask * 0.25
        
    f = np.clip(f * 255.0, 0, 255).astype(np.uint8)
    return f


def clarity(img: np.ndarray, amount: float = 0.5) -> np.ndarray:
    """Mid-tone local contrast (Clarity/Dehaze).
    amount: 0.0 to 2.0.
    """
    if amount <= 0:
        return img
    
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    l_channel = lab[..., 0]
    
    # Large radius blur for local contrast
    radius = max(5, int(min(img.shape[:2]) * 0.03))
    if radius % 2 == 0:
        radius += 1
    blurred_l = cv2.GaussianBlur(l_channel, (radius, radius), 0)
    
    # Unsharp high-pass on luminance
    high_pass = l_channel - blurred_l
    enhanced_l = l_channel + high_pass * (amount * 0.8)
    lab[..., 0] = np.clip(enhanced_l, 0, 255)
    
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)


def sharpen(img: np.ndarray, amount: float = 1.0, sigma: float = 1.2) -> np.ndarray:
    """Unsharp mask. amount: 0 (off) .. ~3 (strong)."""
    if amount <= 0:
        return img
    blur = cv2.GaussianBlur(img, (0, 0), sigma)
    return cv2.addWeighted(img, 1.0 + amount, blur, -amount, 0)


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
        # Prevent division by near-zero
        scale = gray / np.maximum(means, 1e-4)
        # Limit WB exaggeration
        scale = np.clip(scale, 0.7, 1.4)
        f *= scale
        out = np.clip(f, 0, 255).astype(np.uint8)
        
    # Vibrance adjusts lower-saturated pixels more than high-saturation pixels
    if abs(vibrance) > 1e-3 or abs(saturation - 1.0) > 1e-3:
        hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
        s = hsv[..., 1] / 255.0
        
        if abs(vibrance) > 1e-3:
            # Vibrance weight: higher boost for lower saturation
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
    """Fallback high-quality upscaler (Lanczos) used when Real-ESRGAN is unavailable."""
    if scale == 1:
        return img
    h, w = img.shape[:2]
    return cv2.resize(img, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)
