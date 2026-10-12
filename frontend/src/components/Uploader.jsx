import React, { useRef, useState, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, Sparkles, Clipboard } from "lucide-react";
import SampleImages from "./SampleImages";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"];
const MAX_MB = 25;

export default function Uploader({ onFile, disabled }) {
  const inputRef = useRef(null);
  const [isOver, setIsOver] = useState(false);
  const [error, setError] = useState("");

  const validateAndAccept = (file) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) {
      return setError("Please select a supported image (JPEG, PNG, WebP, BMP, or TIFF).");
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return setError(`File exceeds maximum size limit of ${MAX_MB} MB.`);
    }
    setError("");
    onFile(file);
  };

  // Global paste handler (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            validateAndAccept(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [disabled]);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          if (!disabled && e.dataTransfer.files?.length > 0) {
            validateAndAccept(e.dataTransfer.files[0]);
          }
        }}
        className={`group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
          isOver
            ? "border-indigo-400 bg-indigo-500/10 shadow-2xl shadow-indigo-500/20 scale-[1.01]"
            : "border-slate-800 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/70"
        }`}
      >
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Upload Icon */}
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-850 border border-slate-700/80 shadow-inner group-hover:scale-110 group-hover:border-indigo-500/60 transition-transform">
          <UploadCloud className="h-8 w-8 text-indigo-400 group-hover:text-indigo-300" />
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
        </div>

        {/* Main Text */}
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-indigo-200 transition">
          Drag & drop your photo here, or click to browse
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-md">
          Supports JPEG, PNG, WebP up to {MAX_MB} MB. Automatic orientation & alpha transparency handling.
        </p>

        {/* Badges / Helper Tips */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs text-slate-300 font-medium">
            <Clipboard className="h-3 w-3 text-indigo-400" />
            Paste with Ctrl+V
          </span>
          <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs text-slate-300 font-medium">
            Lossless Processing
          </span>
          <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs text-slate-300 font-medium">
            Up to 4× AI Scale
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={TYPES.join(",")}
          hidden
          onChange={(e) => {
            if (e.target.files?.length) {
              validateAndAccept(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs sm:text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Instant Demo Samples */}
      <SampleImages onSelect={validateAndAccept} disabled={disabled} />
    </div>
  );
}
