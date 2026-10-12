import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Sparkles,
  Download,
  RotateCcw,
  Plus,
  HelpCircle,
  X,
  FileImage,
  Layers,
  Clock,
  Gauge,
  Sliders,
  Check,
} from "lucide-react";
import { enhanceImage, downloadUrl, fetchHealth } from "./api";
import Header from "./components/Header.jsx";
import Uploader from "./components/Uploader.jsx";
import OptionsPanel, { DEFAULTS } from "./components/OptionsPanel.jsx";
import CompareSlider from "./components/CompareSlider.jsx";
import ImageToolbar from "./components/ImageToolbar.jsx";
import HistoryBar from "./components/HistoryBar.jsx";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [opts, setOpts] = useState(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [busyStep, setBusyStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState(null);

  // Viewer modes & controls
  const [viewMode, setViewMode] = useState("slider"); // slider | side-by-side | loupe
  const [zoom, setZoom] = useState(1);
  const [isHoldOriginal, setIsHoldOriginal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Download settings
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(95);

  // Help modal
  const [showHelp, setShowHelp] = useState(false);

  const mainContainerRef = useRef(null);

  // Fetch backend health on mount
  useEffect(() => {
    fetchHealth().then((h) => setHealth(h));
  }, []);

  // Create preview for selected file
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is inside an input
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.code === "Space" && result) {
        e.preventDefault();
        setIsHoldOriginal(true);
      } else if (e.key === "f" || e.key === "F") {
        setIsFullscreen((v) => !v);
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
      } else if (e.key === "-" || e.key === "_") {
        setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
      } else if (e.key === "0") {
        setZoom(1);
      } else if (e.key === "?" || e.key === "h") {
        setShowHelp((v) => !v);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        setIsHoldOriginal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [result]);

  const handlePickFile = (newFile) => {
    setFile(newFile);
    setResult(null);
    setError("");
    setZoom(1);
    setOpts(DEFAULTS);
  };

  const runEnhance = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError("");

    // Simulated progress steps for responsive feedback
    const steps = [
      "Analyzing color histogram...",
      opts.denoise > 0 ? "Applying edge-preserving denoising..." : "Preparing pixel buffers...",
      opts.scale > 1 ? `Upscaling image (${opts.scale}× super-resolution)...` : "Balancing tone curves...",
      opts.face_enhance ? "Detecting facial landmarks & reconstructing..." : "Applying unsharp mask & clarity...",
      "Finalizing high-definition render...",
    ];

    let stepIdx = 0;
    setBusyStep(steps[0]);
    const stepTimer = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setBusyStep(steps[stepIdx]);
      }
    }, 700);

    try {
      const res = await enhanceImage(file, opts);
      setResult(res);

      // Add to session history
      setHistory((prev) => [
        {
          ...res,
          opts: { ...opts },
          presetName: `${opts.scale}× Enhanced`,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 7), // keep latest 8
      ]);
    } catch (e) {
      setError(e.message || "Failed to process image. Please check backend connection.");
    } finally {
      clearInterval(stepTimer);
      setBusy(false);
      setBusyStep("");
    }
  };

  const handleCopyClipboard = async () => {
    if (!result?.enhanced_url) return;
    try {
      const res = await fetch(result.enhanced_url);
      const blob = await res.blob();
      // Ensure PNG blob for clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }
  };

  const handleRotate = () => {
    setOpts((o) => ({ ...o, rotate: (o.rotate + 90) % 360 }));
  };

  const handleFlip = () => {
    setOpts((o) => ({ ...o, flip_h: !o.flip_h }));
  };

  const handleSelectHistoryItem = (item) => {
    setResult(item);
    if (item.opts) {
      setOpts(item.opts);
    }
  };

  return (
    <div className={`min-h-screen bg-[#07090e] text-slate-100 ${isFullscreen ? "fixed inset-0 z-50 overflow-y-auto" : ""}`}>
      {/* Top Header */}
      {!isFullscreen && (
        <Header health={health} onShowHelp={() => setShowHelp(true)} />
      )}

      {/* Main Studio Body */}
      <div className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${isFullscreen ? "p-4" : ""}`}>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px]">
          {/* Main Visual Stage */}
          <main className="min-w-0 space-y-4" ref={mainContainerRef}>
            {!file ? (
              <div className="glass-card rounded-3xl p-6 sm:p-10 shadow-2xl">
                <Uploader onFile={handlePickFile} disabled={busy} />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Viewport */}
                {result ? (
                  <div className="space-y-3">
                    {/* View Controls Toolbar */}
                    <ImageToolbar
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      zoom={zoom}
                      setZoom={setZoom}
                      onResetZoom={() => setZoom(1)}
                      isFullscreen={isFullscreen}
                      onToggleFullscreen={() => setIsFullscreen((v) => !v)}
                      onRotate={handleRotate}
                      onFlip={handleFlip}
                      onCopyClipboard={handleCopyClipboard}
                      copied={copied}
                      isHoldOriginal={isHoldOriginal}
                      setIsHoldOriginal={setIsHoldOriginal}
                      disabled={busy}
                    />

                    {/* Interactive Comparison Viewport */}
                    <CompareSlider
                      before={result.original_url}
                      after={result.enhanced_url}
                      aspect={`${result.enhanced_size.width} / ${result.enhanced_size.height}`}
                      viewMode={viewMode}
                      zoom={zoom}
                      isHoldOriginal={isHoldOriginal}
                      scaleBadge={`${opts.scale}×`}
                    />
                  </div>
                ) : (
                  <div className="relative flex min-h-[420px] max-h-[70vh] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <img
                      src={preview}
                      alt="Selected preview"
                      className="max-h-[65vh] w-full object-contain rounded-lg"
                    />
                    <div className="absolute top-4 left-4 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-semibold text-slate-300 border border-white/10">
                      Original Photo Ready
                    </div>
                  </div>
                )}

                {/* Primary Action Bar */}
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
                  {/* Enhance / Run Button */}
                  <button
                    onClick={runEnhance}
                    disabled={busy}
                    className={`relative overflow-hidden flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition active:scale-98 ${
                      busy
                        ? "bg-indigo-600/60 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30"
                    }`}
                  >
                    {busy && (
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    )}
                    <Sparkles className={`h-4 w-4 ${busy ? "animate-spin text-indigo-300" : ""}`} />
                    <span>
                      {busy ? busyStep || "Enhancing image…" : result ? "Re-Enhance with Settings" : "Enhance Photo Now"}
                    </span>
                  </button>

                  {/* Pick New Image Button */}
                  <button
                    onClick={() => handlePickFile(null)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Image</span>
                  </button>

                  {/* Export / Download Section */}
                  {result && (
                    <div className="ml-auto flex items-center gap-2">
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Download format"
                      >
                        <option value="png">PNG (Lossless)</option>
                        <option value="jpeg">JPEG (High Quality)</option>
                        <option value="webp">WebP (Optimized)</option>
                      </select>

                      {format !== "png" && (
                        <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs">
                          <span className="text-[11px] text-slate-400">Q:</span>
                          <input
                            type="range"
                            min={80}
                            max={100}
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            className="w-16 accent-indigo-500"
                            title={`Quality: ${quality}%`}
                          />
                          <span className="font-mono text-[10px] text-slate-300">{quality}%</span>
                        </div>
                      )}

                      <a
                        href={downloadUrl(result.id, format, quality, `${result.filename || "enhanced"}_${opts.scale}x`)}
                        download
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition shadow-lg shadow-emerald-500/20 active:scale-98"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs sm:text-sm text-rose-300">
                    {error}
                  </div>
                )}

                {/* Detailed Results & Performance Report */}
                {result && <Report result={result} />}

                {/* Session History Carousel */}
                <HistoryBar
                  history={history}
                  currentId={result?.id}
                  onSelect={handleSelectHistoryItem}
                  onClear={() => setHistory([])}
                />
              </div>
            )}
          </main>

          {/* Right Control Inspector Panel */}
          <aside className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-xl lg:sticky lg:top-18 lg:self-start shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">Enhancement Controls</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpts(DEFAULTS)}
                className="text-[11px] text-slate-400 hover:text-white transition flex items-center gap-1"
                title="Reset all settings to default"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            <OptionsPanel opts={opts} setOpts={setOpts} disabled={busy} />
          </aside>
        </div>
      </div>

      {/* Help & Keyboard Shortcuts Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-white">Pro Studio Guide & Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Hold Spacebar</span>
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-indigo-300">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Toggle Fullscreen</span>
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-indigo-300">F</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Zoom In / Out</span>
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-indigo-300">+ / -</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Reset Zoom (Fit)</span>
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-indigo-300">0</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Paste Image Anywhere</span>
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-indigo-300">Ctrl + V</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Nudge Slider</span>
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-indigo-300">← / →</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-1.5">Inspection Modes</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-xs">
                  <li><strong className="text-slate-200">Slider:</strong> Drag the central divider to inspect before and after.</li>
                  <li><strong className="text-slate-200">Side-by-Side:</strong> View original and enhanced photos simultaneously.</li>
                  <li><strong className="text-slate-200">Magnifier (2.5× Loupe):</strong> Hover over any part of the image to magnify micro details side-by-side.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-indigo-600/30"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Report({ result }) {
  const { metrics, steps, warnings, original_size: o, enhanced_size: e } = result;

  const origPixels = o.width * o.height;
  const enhPixels = e.width * e.height;
  const pixelGrowthPct = Math.round(((enhPixels - origPixels) / origPixels) * 100);

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 backdrop-blur-md">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
        <Gauge className="h-4 w-4 text-indigo-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
          Enhancement Analytics & Metrics
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Resolution"
          value={`${o.width}×${o.height} → ${e.width}×${e.height}`}
          sub={pixelGrowthPct > 0 ? `+${pixelGrowthPct}% more pixels` : "Native size"}
          icon={Layers}
        />
        <StatCard
          label="File Size"
          value={`${formatBytes(o.bytes)} → ${formatBytes(e.bytes)}`}
          sub="Lossless PNG preview"
          icon={FileImage}
        />
        <StatCard
          label="PSNR / SSIM"
          value={`${metrics.psnr} dB`}
          sub={`SSIM: ${metrics.ssim}`}
          icon={Gauge}
        />
        <StatCard
          label="Process Time"
          value={`${metrics.seconds}s`}
          sub="High-speed pipeline"
          icon={Clock}
        />
      </div>

      {/* Applied Pipeline Steps */}
      {steps && steps.length > 0 && (
        <div className="pt-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Applied Pipeline Sequence:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {steps.map((st, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950/80 px-2 py-0.5 text-xs text-indigo-300 font-medium"
              >
                <Check className="h-3 w-3 text-emerald-400" />
                {st}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="space-y-1 pt-1">
          {warnings.map((w, idx) => (
            <p key={idx} className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              <span>⚠</span>
              <span>{w}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
      <div className="flex items-center justify-between text-slate-500 mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-indigo-400" />}
      </div>
      <div className="text-sm font-bold text-white truncate tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}
