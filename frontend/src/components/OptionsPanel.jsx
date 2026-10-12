import React, { useState } from "react";
import {
  Wand2,
  Sliders,
  RotateCw,
  Sun,
  Palette,
  Sparkles,
  Zap,
  RotateCcw,
  Check,
} from "lucide-react";
import PresetCards, { PRESET_CONFIGS } from "./PresetCards";

export const DEFAULTS = {
  scale: 2,
  use_ai_upscale: true,
  face_enhance: false,
  denoise: 0,
  sharpen: 0,
  clarity: 0,
  brightness: 0,
  contrast: 0,
  shadows: 0,
  highlights: 0,
  auto_contrast: false,
  saturation: 1.0,
  vibrance: 0,
  white_balance: false,
  rotate: 0,
  flip_h: false,
  flip_v: false,
};

function Slider({ label, value, min, max, step = 1, onChange, fmt = (v) => v, defaultVal = 0 }) {
  const isModified = Math.abs(value - defaultVal) > 1e-4;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300 font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono tabular-nums text-slate-400 text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            {fmt(value)}
          </span>
          {isModified && (
            <button
              type="button"
              onClick={() => onChange(defaultVal)}
              className="text-[10px] text-slate-500 hover:text-indigo-300 transition"
              title="Reset slider"
            >
              reset
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500 cursor-pointer"
      />
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="group flex items-start gap-3 text-xs cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
      />
      <div className="min-w-0">
        <span className="font-medium text-slate-200 group-hover:text-white transition">
          {label}
        </span>
        {hint && <span className="block text-[11px] text-slate-400 mt-0.5">{hint}</span>}
      </div>
    </label>
  );
}

export default function OptionsPanel({ opts, setOpts, disabled }) {
  const [activeTab, setActiveTab] = useState("presets");
  const [currentPreset, setCurrentPreset] = useState("magic-fix");

  const set = (k) => (v) => {
    setCurrentPreset(null);
    setOpts((o) => ({ ...o, [k]: v }));
  };

  const handleApplyPreset = (presetId, presetOpts) => {
    setCurrentPreset(presetId);
    setOpts({ ...DEFAULTS, ...presetOpts });
  };

  const handleReset = () => {
    setCurrentPreset(null);
    setOpts(DEFAULTS);
  };

  return (
    <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
      {/* Navigation Tabs */}
      <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
            activeTab === "presets"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Wand2 className="h-3.5 w-3.5" />
          <span>Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tuning")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
            activeTab === "tuning"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Fine-Tune</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transform")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
            activeTab === "transform"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Transform</span>
        </button>
      </div>

      {/* Tab 1: Presets */}
      {activeTab === "presets" && (
        <div className="space-y-4">
          <PresetCards
            currentPreset={currentPreset}
            onSelect={handleApplyPreset}
            disabled={disabled}
          />

          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              Want fine manual control? Switch to Fine-Tune.
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Fine-Tuning */}
      {activeTab === "tuning" && (
        <div className="space-y-5">
          {/* Upscaling Section */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              <span>Upscaling & AI Super Resolution</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("scale")(s)}
                  className={`rounded-lg border py-2 text-xs font-semibold transition ${
                    opts.scale === s
                      ? "border-indigo-400 bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/50"
                      : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {s === 1 ? "1× (Native)" : `${s}× (${s === 2 ? "HD" : "Ultra 4K"})`}
                </button>
              ))}
            </div>

            {opts.scale > 1 && (
              <Toggle
                label="Deep Learning Upscaler (Real-ESRGAN)"
                hint="Deep neural enhancement (falls back to Lanczos if weights disabled)"
                checked={opts.use_ai_upscale}
                onChange={set("use_ai_upscale")}
              />
            )}

            <Toggle
              label="Face Enhancement (GFPGAN)"
              hint="Restores blurred eyes, skin texture and facial features"
              checked={opts.face_enhance}
              onChange={set("face_enhance")}
            />
          </div>

          {/* Tone & Exposure Section */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span>Tone, Exposure & Dynamic Range</span>
            </div>

            <Toggle
              label="Adaptive Contrast (CLAHE)"
              hint="Equalizes luminance across local shadow/highlight tiles"
              checked={opts.auto_contrast}
              onChange={set("auto_contrast")}
            />

            <Slider
              label="Exposure / Brightness"
              value={opts.brightness}
              min={-100}
              max={100}
              onChange={set("brightness")}
              fmt={(v) => `${v > 0 ? "+" : ""}${v}`}
            />

            <Slider
              label="Contrast"
              value={opts.contrast}
              min={-100}
              max={100}
              onChange={set("contrast")}
              fmt={(v) => `${v > 0 ? "+" : ""}${v}`}
            />

            <Slider
              label="Shadows Lift"
              value={opts.shadows}
              min={-100}
              max={100}
              onChange={set("shadows")}
              fmt={(v) => `${v > 0 ? "+" : ""}${v}`}
            />

            <Slider
              label="Highlights Tame"
              value={opts.highlights}
              min={-100}
              max={100}
              onChange={set("highlights")}
              fmt={(v) => `${v > 0 ? "+" : ""}${v}`}
            />
          </div>

          {/* Color & Vibrance */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Palette className="h-3.5 w-3.5 text-rose-400" />
              <span>Color & Balance</span>
            </div>

            <Toggle
              label="Auto White Balance"
              hint="Neutralizes unnatural color casts via grey-world normalization"
              checked={opts.white_balance}
              onChange={set("white_balance")}
            />

            <Slider
              label="Color Saturation"
              value={opts.saturation}
              min={0}
              max={2}
              step={0.05}
              onChange={set("saturation")}
              fmt={(v) => `${v.toFixed(2)}×`}
              defaultVal={1.0}
            />

            <Slider
              label="Smart Vibrance"
              value={opts.vibrance}
              min={-100}
              max={100}
              onChange={set("vibrance")}
              fmt={(v) => `${v > 0 ? "+" : ""}${v}%`}
            />
          </div>

          {/* Clarity & Details */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Clarity, Sharpening & Noise</span>
            </div>

            <Slider
              label="Clarity & Dehaze"
              value={opts.clarity}
              min={0}
              max={2}
              step={0.1}
              onChange={set("clarity")}
              fmt={(v) => v.toFixed(1)}
            />

            <Slider
              label="High-Pass Sharpening"
              value={opts.sharpen}
              min={0}
              max={3}
              step={0.1}
              onChange={set("sharpen")}
              fmt={(v) => v.toFixed(1)}
            />

            <Slider
              label="Edge-Preserving Denoising"
              value={opts.denoise}
              min={0}
              max={10}
              onChange={set("denoise")}
              fmt={(v) => `${v}/10`}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset all sliders</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Transform */}
      {activeTab === "transform" && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-4">
          <div>
            <span className="block text-xs font-bold text-slate-200 mb-2">Orientation</span>
            <div className="grid grid-cols-4 gap-2">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => set("rotate")(deg)}
                  className={`rounded-lg border py-2 text-xs font-medium transition ${
                    opts.rotate === deg
                      ? "border-indigo-400 bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/50"
                      : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {deg === 0 ? "0°" : `${deg}°`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <Toggle
              label="Flip Horizontally"
              hint="Mirror image left-to-right"
              checked={opts.flip_h}
              onChange={set("flip_h")}
            />
            <Toggle
              label="Flip Vertically"
              hint="Mirror image top-to-bottom"
              checked={opts.flip_v}
              onChange={set("flip_v")}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
