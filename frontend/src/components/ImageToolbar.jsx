import React from "react";
import {
  Columns2,
  Split,
  Eye,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  FlipHorizontal,
  Copy,
  Check,
} from "lucide-react";

export default function ImageToolbar({
  viewMode,
  setViewMode,
  zoom,
  setZoom,
  onResetZoom,
  isFullscreen,
  onToggleFullscreen,
  onRotate,
  onFlip,
  onCopyClipboard,
  copied,
  isHoldOriginal,
  setIsHoldOriginal,
  disabled,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-xs backdrop-blur-md">
      {/* Left: View Modes */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-950/80 p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => setViewMode("slider")}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
            viewMode === "slider" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
          }`}
          title="Split Drag Slider"
        >
          <Split className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Slider</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("side-by-side")}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
            viewMode === "side-by-side" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
          }`}
          title="Side-by-side comparison"
        >
          <Columns2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Side-by-Side</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("loupe")}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
            viewMode === "loupe" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
          }`}
          title="2.5x Magnifier Loupe"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Magnifier</span>
        </button>
      </div>

      {/* Middle: Hold to Compare Quick A/B button */}
      <button
        type="button"
        onMouseDown={() => setIsHoldOriginal(true)}
        onMouseUp={() => setIsHoldOriginal(false)}
        onTouchStart={() => setIsHoldOriginal(true)}
        onTouchEnd={() => setIsHoldOriginal(false)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition select-none ${
          isHoldOriginal
            ? "border-amber-400 bg-amber-500/20 text-amber-200"
            : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:text-white"
        }`}
        title="Hold mouse down or press Spacebar to view Original"
      >
        <Eye className="h-3.5 w-3.5 text-indigo-400" />
        <span className="font-medium">
          {isHoldOriginal ? "Showing Original" : "Hold for Original"}
        </span>
      </button>

      {/* Right: Zoom & Utilities */}
      <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
        {/* Zoom controls */}
        <div className="flex items-center rounded-lg bg-slate-950/80 p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            disabled={disabled || zoom <= 0.5}
            className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-40"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="px-2 py-0.5 font-mono text-[11px] text-slate-300 hover:text-white"
            title="Click to reset to Fit"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3.0, +(z + 0.25).toFixed(2)))}
            disabled={disabled || zoom >= 3.0}
            className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-40"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick Transform: Rotate */}
        <button
          type="button"
          onClick={onRotate}
          disabled={disabled}
          className="rounded-lg border border-slate-800 bg-slate-950/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white transition disabled:opacity-40"
          title="Rotate 90° Clockwise"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>

        {/* Quick Transform: Flip */}
        <button
          type="button"
          onClick={onFlip}
          disabled={disabled}
          className="rounded-lg border border-slate-800 bg-slate-950/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white transition disabled:opacity-40"
          title="Flip Horizontal"
        >
          <FlipHorizontal className="h-3.5 w-3.5" />
        </button>

        {/* Copy to Clipboard */}
        <button
          type="button"
          onClick={onCopyClipboard}
          disabled={disabled}
          className="rounded-lg border border-slate-800 bg-slate-950/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white transition disabled:opacity-40"
          title="Copy Enhanced image to clipboard"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="rounded-lg border border-slate-800 bg-slate-950/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white transition"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
