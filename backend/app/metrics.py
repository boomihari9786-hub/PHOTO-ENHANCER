"""Image-quality metrics: PSNR and SSIM (computed against the original)."""
from __future__ import annotations

import cv2
import numpy as np
from skimage.metrics import peak_signal_noise_ratio, structural_similarity


def compare(original: np.ndarray, enhanced: np.ndarray) -> dict:
    """Compare enhanced output with the original.

    The original is resized (bicubic) to the enhanced size, so the numbers
    describe how far the output deviates from a plain upscale of the input.
    Higher PSNR/SSIM = closer to the original. These are *reference* metrics:
    for generative enhancement a lower value is not necessarily "worse".
    """
    h, w = enhanced.shape[:2]
    ref = cv2.resize(original, (w, h), interpolation=cv2.INTER_CUBIC)
    psnr = float(peak_signal_noise_ratio(ref, enhanced, data_range=255))
    ssim = float(structural_similarity(ref, enhanced, channel_axis=2, data_range=255))
    return {"psnr": round(psnr, 2), "ssim": round(ssim, 4)}
