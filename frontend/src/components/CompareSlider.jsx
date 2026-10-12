import React, { useRef, useState, useCallback, useEffect } from "react";

export default function CompareSlider({
  before,
  after,
  aspect,
  viewMode = "slider",
  zoom = 1,
  isHoldOriginal = false,
  scaleBadge = "2×",
}) {
  const containerRef = useRef(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Pan offset when zoomed in
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Loupe (magnifier) state
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0, visible: false, imgX: 0, imgY: 0 });

  // Reset pan when zoom resets to 1
  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Handle slider drag
  const handleSliderMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPos(clamped);
  }, []);

  const onSliderPointerDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSlider(true);
    handleSliderMove(e.clientX);
  };

  const onSliderPointerMove = (e) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    }
  };

  const onSliderPointerUp = (e) => {
    setIsDraggingSlider(false);
  };

  // Pan handlers when zoomed in
  const onContainerPointerDown = (e) => {
    if (zoom > 1 && !isDraggingSlider && viewMode !== "loupe") {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onContainerPointerMove = (e) => {
    if (isPanning && zoom > 1) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }

    // Update loupe position if in loupe mode
    if (viewMode === "loupe" && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setLoupePos({
          x,
          y,
          visible: true,
          pctX: (x / rect.width) * 100,
          pctY: (y / rect.height) * 100,
        });
      } else {
        setLoupePos((p) => ({ ...p, visible: false }));
      }
    }
  };

  const onContainerPointerUp = () => {
    setIsPanning(false);
  };

  // Keyboard navigation for slider
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") setSliderPos((p) => Math.max(0, p - 2));
    if (e.key === "ArrowRight") setSliderPos((p) => Math.min(100, p + 2));
  };

  const transformStyle = {
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
    transformOrigin: "center center",
    transition: isPanning ? "none" : "transform 0.15s ease-out",
  };

  // 1. Side-by-Side Mode
  if (viewMode === "side-by-side") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center min-h-[380px] max-h-[70vh]">
          <span className="absolute top-3 left-3 z-10 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-medium text-slate-300 border border-white/10">
            Original
          </span>
          <div className="w-full h-full flex items-center justify-center p-2" style={transformStyle}>
            <img src={before} alt="Original" className="max-h-[65vh] w-full object-contain select-none" draggable={false} />
          </div>
        </div>

        {/* Enhanced */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-950 flex flex-col items-center justify-center min-h-[380px] max-h-[70vh]">
          <span className="absolute top-3 left-3 z-10 rounded-full bg-indigo-600/80 backdrop-blur-md px-3 py-1 text-xs font-medium text-white border border-indigo-400/30">
            Enhanced ({scaleBadge})
          </span>
          <div className="w-full h-full flex items-center justify-center p-2" style={transformStyle}>
            <img src={after} alt="Enhanced" className="max-h-[65vh] w-full object-contain select-none" draggable={false} />
          </div>
        </div>
      </div>
    );
  }

  // 2. Slider & Loupe Modes
  return (
    <div
      ref={containerRef}
      onPointerDown={onContainerPointerDown}
      onPointerMove={onContainerPointerMove}
      onPointerUp={onContainerPointerUp}
      onMouseLeave={() => setLoupePos((p) => ({ ...p, visible: false }))}
      className={`relative w-full max-h-[72vh] min-h-[380px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 select-none touch-none ${
        zoom > 1 ? "cursor-grab active:cursor-grabbing" : viewMode === "loupe" ? "cursor-crosshair" : "cursor-ew-resize"
      }`}
      style={{ aspectRatio: aspect }}
    >
      {/* Background/Base Image Container */}
      <div className="w-full h-full flex items-center justify-center" style={transformStyle}>
        {/* If hold original is active, show only original */}
        {isHoldOriginal ? (
          <img src={before} alt="Original (Hold)" className="w-full h-full object-contain" draggable={false} />
        ) : (
          <>
            {/* Enhanced Image (Underneath) */}
            <img src={after} alt="Enhanced" className="absolute inset-0 w-full h-full object-contain" draggable={false} />

            {/* Original Image (Clipped by slider position) */}
            {viewMode === "slider" && (
              <img
                src={before}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                draggable={false}
              />
            )}
          </>
        )}
      </div>

      {/* Floating Badges */}
      {!isHoldOriginal && viewMode === "slider" && (
        <>
          <div className="absolute top-3 left-3 z-10 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-medium text-slate-300 border border-white/10 pointer-events-none">
            Original
          </div>
          <div className="absolute top-3 right-3 z-10 rounded-full bg-indigo-600/80 backdrop-blur-md px-3 py-1 text-xs font-medium text-white border border-indigo-400/30 pointer-events-none">
            Enhanced ({scaleBadge})
          </div>
        </>
      )}

      {isHoldOriginal && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-amber-500/90 backdrop-blur-md px-4 py-1 text-xs font-semibold text-slate-950 border border-amber-300 shadow-lg pointer-events-none animate-pulse">
          Showing Original (Blink Test)
        </div>
      )}

      {/* Interactive Divider Line & Handle (Slider Mode) */}
      {!isHoldOriginal && viewMode === "slider" && (
        <div
          className="absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.7)] z-20"
          style={{ left: `${sliderPos}%` }}
        >
          <button
            role="slider"
            aria-label="Comparison slider position"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sliderPos)}
            onPointerDown={onSliderPointerDown}
            onPointerMove={onSliderPointerMove}
            onPointerUp={onSliderPointerUp}
            onKeyDown={onKeyDown}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white text-slate-900 shadow-xl grid place-items-center text-sm font-bold border-2 border-indigo-500 hover:scale-110 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-indigo-500/40"
          >
            <span className="text-xs">⇄</span>
          </button>
        </div>
      )}

      {/* 2.5x Magnifier Loupe Lens */}
      {viewMode === "loupe" && loupePos.visible && !isHoldOriginal && (
        <div
          className="pointer-events-none absolute z-30 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-indigo-400 bg-slate-950 shadow-2xl overflow-hidden ring-4 ring-black/40"
          style={{ left: `${loupePos.x}px`, top: `${loupePos.y}px` }}
        >
          {/* Enhanced zoomed section */}
          <div
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: `url(${after})`,
              backgroundPosition: `${loupePos.pctX}% ${loupePos.pctY}%`,
              backgroundSize: "400%",
            }}
          />
          {/* Half-clip with original zoomed section */}
          <div
            className="absolute inset-0 bg-no-repeat border-r-2 border-white/80"
            style={{
              backgroundImage: `url(${before})`,
              backgroundPosition: `${loupePos.pctX}% ${loupePos.pctY}%`,
              backgroundSize: "400%",
              clipPath: "inset(0 50% 0 0)",
            }}
          />
          <span className="absolute bottom-2 left-3 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
            ORIG
          </span>
          <span className="absolute bottom-2 right-3 rounded bg-indigo-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
            2.5× HD
          </span>
        </div>
      )}
    </div>
  );
}
