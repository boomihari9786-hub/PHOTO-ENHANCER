import React, { useState } from "react";
import { Sparkles, Cpu, HelpCircle, X, Zap } from "lucide-react";

export default function Header({ health, onShowHelp }) {
  const [showStatusModal, setShowStatusModal] = useState(false);

  const isRealEsrgan = health?.models?.realesrgan_loaded;
  const isGfpgan = health?.models?.gfpgan_loaded;
  const device = health?.models?.device || "cpu";

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                AuraEnhance
              </span>
              <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                AI Studio 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent upscaling, facial restoration & photographic mastery
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Engine Status Pill */}
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 transition"
            title="Click to view processing engine status"
          >
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline font-medium">Engine:</span>
            <span className="font-semibold text-slate-200">
              {isRealEsrgan ? "Real-ESRGAN + OpenCV" : "Lanczos Turbo + OpenCV"}
            </span>
            <span className={`inline-block h-2 w-2 rounded-full ${health ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
          </button>

          {/* Help & Shortcuts Button */}
          <button
            onClick={onShowHelp}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition"
            aria-label="Keyboard shortcuts & guide"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>
      </div>

      {/* Engine Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-400" />
                <h3 className="font-semibold text-white">System & Engine Status</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Processing Mode</span>
                <span className="font-medium text-emerald-400">
                  {isRealEsrgan ? "Deep Learning (PyTorch)" : "Lanczos High-Fidelity (Active)"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Face Restoration (GFPGAN)</span>
                <span className="font-medium text-slate-300">
                  {isGfpgan ? "Loaded" : "Available when PyTorch weights enabled"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Compute Device</span>
                <span className="font-mono text-slate-200 uppercase">{device}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">OpenCV Acceleration</span>
                <span className="font-medium text-emerald-400">Enabled (SIMD/Multithreaded)</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Backend API</span>
                <span className="font-medium text-slate-200">FastAPI 2.0.0</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400 leading-relaxed">
              Lanczos upscaling runs at lightning speed on any machine without requiring massive GPU downloads. Real-ESRGAN and GFPGAN weights can be toggled in backend requirements.
            </p>

            <button
              onClick={() => setShowStatusModal(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-medium text-white transition shadow-lg shadow-indigo-600/30"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
