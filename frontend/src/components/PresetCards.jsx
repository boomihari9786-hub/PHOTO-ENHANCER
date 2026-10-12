import React from "react";
import { Wand2, UserCheck, MountainSnow, Moon, Sparkles, ZoomIn } from "lucide-react";

export const PRESET_CONFIGS = {
  "magic-fix": {
    name: "Magic Auto-Fix",
    badge: "Popular",
    desc: "Intelligent balance of dynamic range, noise reduction & clarity",
    icon: Wand2,
    color: "from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30",
    opts: {
      scale: 2,
      use_ai_upscale: true,
      face_enhance: false,
      denoise: 3,
      sharpen: 0.8,
      clarity: 0.5,
      brightness: 2,
      contrast: 5,
      shadows: 15,
      highlights: -10,
      auto_contrast: true,
      white_balance: true,
      saturation: 1.1,
      vibrance: 20,
    },
  },
  "portrait-pro": {
    name: "Portrait & Face Pro",
    badge: "AI Faces",
    desc: "Enhances eyes & facial contours while gently smoothing skin",
    icon: UserCheck,
    color: "from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30",
    opts: {
      scale: 2,
      use_ai_upscale: true,
      face_enhance: true,
      denoise: 2,
      sharpen: 0.4,
      clarity: 0.2,
      brightness: 4,
      contrast: 2,
      shadows: 10,
      highlights: -5,
      auto_contrast: false,
      white_balance: false,
      saturation: 1.05,
      vibrance: 12,
    },
  },
  "vivid-landscape": {
    name: "Vivid Landscape",
    badge: "High Dynamic",
    desc: "Deep atmospheric dehazing, rich sky colors & razor textures",
    icon: MountainSnow,
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    opts: {
      scale: 2,
      use_ai_upscale: true,
      face_enhance: false,
      denoise: 1,
      sharpen: 1.2,
      clarity: 0.9,
      brightness: 0,
      contrast: 8,
      shadows: 20,
      highlights: -15,
      auto_contrast: true,
      white_balance: true,
      saturation: 1.15,
      vibrance: 35,
    },
  },
  "night-boost": {
    name: "Night & Low-Light",
    badge: "Shadow Lift",
    desc: "Recovers dark shadows & cleans heavy high-ISO sensor grain",
    icon: Moon,
    color: "from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30",
    opts: {
      scale: 2,
      use_ai_upscale: true,
      face_enhance: false,
      denoise: 6,
      sharpen: 0.6,
      clarity: 0.4,
      brightness: 12,
      contrast: 4,
      shadows: 40,
      highlights: -20,
      auto_contrast: true,
      white_balance: true,
      saturation: 1.05,
      vibrance: 15,
    },
  },
  "old-photo": {
    name: "Old Photo Restorer",
    badge: "Repair",
    desc: "Restores faded vintage photos, removes speckles & rebuilds contrast",
    icon: Sparkles,
    color: "from-orange-500/20 to-stone-500/20 text-orange-400 border-orange-500/30",
    opts: {
      scale: 2,
      use_ai_upscale: true,
      face_enhance: true,
      denoise: 5,
      sharpen: 1.0,
      clarity: 0.6,
      brightness: 5,
      contrast: 15,
      shadows: 15,
      highlights: -10,
      auto_contrast: true,
      white_balance: true,
      saturation: 1.0,
      vibrance: 10,
    },
  },
  "super-res-4x": {
    name: "Ultra 4x Super-Res",
    badge: "Print & 4K",
    desc: "Quadruple image resolution with maximum edge definition",
    icon: ZoomIn,
    color: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30",
    opts: {
      scale: 4,
      use_ai_upscale: true,
      face_enhance: true,
      denoise: 2,
      sharpen: 0.8,
      clarity: 0.4,
      brightness: 0,
      contrast: 2,
      shadows: 0,
      highlights: 0,
      auto_contrast: false,
      white_balance: false,
      saturation: 1.0,
      vibrance: 0,
    },
  },
};

export default function PresetCards({ currentPreset, onSelect, disabled }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {Object.entries(PRESET_CONFIGS).map(([id, p]) => {
        const Icon = p.icon;
        const isSelected = currentPreset === id;

        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(id, p.opts)}
            className={`group relative flex items-start gap-3 rounded-xl border p-3 text-left transition ${
              isSelected
                ? "border-indigo-400 bg-indigo-500/15 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/50"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-slate-950 ${
                isSelected ? "border-indigo-400 text-indigo-300" : "border-slate-800 text-slate-400 group-hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-xs font-semibold truncate ${isSelected ? "text-indigo-200" : "text-slate-200"}`}>
                  {p.name}
                </span>
                {p.badge && (
                  <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-300">
                    {p.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {p.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
