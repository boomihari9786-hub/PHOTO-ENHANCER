import React from "react";
import { History, Sparkles } from "lucide-react";

export default function HistoryBar({ history, currentId, onSelect, onClear }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Session Versions ({history.length})
          </h3>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] text-slate-500 hover:text-slate-300 transition"
        >
          Clear
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
        {history.map((item, idx) => {
          const isSelected = item.id === currentId;
          const label = item.presetName || `Version ${idx + 1}`;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`group flex shrink-0 items-center gap-2.5 rounded-xl border p-2 text-left transition ${
                isSelected
                  ? "border-indigo-400 bg-indigo-500/15 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/50"
                  : "border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/60"
              }`}
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-900 border border-slate-850">
                <img
                  src={item.enhanced_url}
                  alt={label}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-1 py-0.2 text-[9px] font-bold text-indigo-300">
                  {item.opts?.scale || 1}×
                </span>
              </div>

              <div className="pr-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium truncate max-w-[110px] ${isSelected ? "text-indigo-200" : "text-slate-300"}`}>
                    {label}
                  </span>
                  {isSelected && <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{item.metrics?.seconds || 0}s</span>
                  <span>•</span>
                  <span>{item.enhanced_size?.width}×{item.enhanced_size?.height}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
