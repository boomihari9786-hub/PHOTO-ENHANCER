import React from "react";
import { User, Mountain, History, Building2 } from "lucide-react";

// Helper to generate a realistic test photo on HTML5 canvas and return a File
function generateSamplePhoto(type) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 640;
  canvas.height = 480;

  if (type === "portrait") {
    // Warm portrait background with bokeh
    const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 350);
    grad.addColorStop(0, "#4a2828");
    grad.addColorStop(0.5, "#2d161a");
    grad.addColorStop(1, "#120a0d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    // Bokeh lights
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(40 + (i * 35) % 580, 50 + (i * 65) % 380, 20 + (i % 5) * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${220 + (i % 3) * 15}, ${150 + (i % 4) * 20}, 100, 0.15)`;
      ctx.fill();
    }

    // Shoulders
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.ellipse(320, 490, 210, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = "#c58f70";
    ctx.fillRect(290, 300, 60, 90);

    // Face Oval
    ctx.fillStyle = "#d8a483";
    ctx.beginPath();
    ctx.ellipse(320, 230, 95, 125, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#261710";
    ctx.beginPath();
    ctx.arc(320, 200, 110, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(210, 200, 35, 140);
    ctx.fillRect(395, 200, 35, 140);

    // Eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(280, 225, 16, 9, 0, 0, Math.PI * 2);
    ctx.ellipse(360, 225, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3b2219";
    ctx.beginPath();
    ctx.arc(280, 225, 6, 0, Math.PI * 2);
    ctx.arc(360, 225, 6, 0, Math.PI * 2);
    ctx.fill();

    // Nose & Lips
    ctx.strokeStyle = "#a76c4f";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(320, 220);
    ctx.lineTo(315, 260);
    ctx.lineTo(326, 265);
    ctx.stroke();

    ctx.fillStyle = "#ab4e58";
    ctx.beginPath();
    ctx.ellipse(320, 290, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === "landscape") {
    // Sunset gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, "#0f172a");
    sky.addColorStop(0.3, "#431407");
    sky.addColorStop(0.7, "#c2410c");
    sky.addColorStop(1, "#fbbf24");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 300);

    // Sun
    const sun = ctx.createRadialGradient(420, 220, 10, 420, 220, 80);
    sun.addColorStop(0, "rgba(255, 255, 240, 0.95)");
    sun.addColorStop(0.5, "rgba(251, 191, 36, 0.4)");
    sun.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = sun;
    ctx.fillRect(320, 120, 200, 200);

    // Distant Mountain
    ctx.fillStyle = "#31182a";
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(160, 180);
    ctx.lineTo(290, 250);
    ctx.lineTo(430, 160);
    ctx.lineTo(550, 240);
    ctx.lineTo(640, 200);
    ctx.lineTo(640, 480);
    ctx.lineTo(0, 480);
    ctx.fill();

    // Foreground Mountains & Lake
    ctx.fillStyle = "#16242c";
    ctx.beginPath();
    ctx.moveTo(0, 330);
    ctx.lineTo(190, 240);
    ctx.lineTo(380, 330);
    ctx.lineTo(640, 270);
    ctx.lineTo(640, 480);
    ctx.lineTo(0, 480);
    ctx.fill();

    // Lake reflection
    const water = ctx.createLinearGradient(0, 350, 0, 480);
    water.addColorStop(0, "#082f49");
    water.addColorStop(1, "#020617");
    ctx.fillStyle = water;
    ctx.fillRect(0, 350, 640, 130);

  } else if (type === "architecture") {
    // Modern Architecture Sky
    const sky = ctx.createLinearGradient(0, 0, 640, 480);
    sky.addColorStop(0, "#1e3a8a");
    sky.addColorStop(1, "#0369a1");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 480);

    // Modern glass skyscrapers
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(50, 120, 140, 360);
    ctx.fillRect(220, 60, 180, 420);
    ctx.fillRect(430, 150, 160, 330);

    // Windows Grid
    ctx.fillStyle = "#38bdf8";
    for (let r = 70; r < 470; r += 20) {
      for (let c = 230; c < 390; c += 22) {
        if ((r + c) % 3 !== 0) {
          ctx.fillRect(c, r, 12, 10);
        }
      }
    }
  } else {
    // Vintage Sepia Street
    const sepia = ctx.createLinearGradient(0, 0, 0, 480);
    sepia.addColorStop(0, "#453229");
    sepia.addColorStop(1, "#1c140f");
    ctx.fillStyle = sepia;
    ctx.fillRect(0, 0, 640, 480);

    // Old buildings
    ctx.fillStyle = "#5c4335";
    ctx.fillRect(40, 140, 220, 340);
    ctx.fillRect(340, 180, 260, 300);

    // Street Cobblestone
    ctx.fillStyle = "#2e2119";
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(260, 340);
    ctx.lineTo(340, 340);
    ctx.lineTo(640, 480);
    ctx.fill();

    // Streetlamp
    ctx.strokeStyle = "#8c6b54";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(300, 360);
    ctx.lineTo(300, 220);
    ctx.stroke();
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(300, 215, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Add realistic camera grain / noise to make it a great test image for denoising & upscaling
  const imgData = ctx.getImageData(0, 0, 640, 480);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 36;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], `${type}-sample.png`, { type: "image/png" });
      resolve(file);
    }, "image/png");
  });
}

const SAMPLES = [
  {
    id: "portrait",
    title: "Portrait & Faces",
    desc: "Low-light skin, facial contours & noise",
    icon: User,
    color: "from-rose-500/20 to-orange-500/20 text-rose-400 border-rose-500/30",
  },
  {
    id: "landscape",
    title: "Sunset Landscape",
    desc: "Dynamic range, shadows & vivid skies",
    icon: Mountain,
    color: "from-amber-500/20 to-red-500/20 text-amber-400 border-amber-500/30",
  },
  {
    id: "architecture",
    title: "City Architecture",
    desc: "Fine lines, window grids & sharp edges",
    icon: Building2,
    color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "vintage",
    title: "Vintage Memory",
    desc: "Grainy textures & muted sepia tones",
    icon: History,
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
];

export default function SampleImages({ onSelect, disabled }) {
  const handleClick = async (id) => {
    if (disabled) return;
    const file = await generateSamplePhoto(id);
    onSelect(file);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Or try with sample photos:
        </span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SAMPLES.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => handleClick(s.id)}
              disabled={disabled}
              className={`group flex flex-col items-start rounded-xl border p-3 text-left transition hover:scale-[1.02] bg-gradient-to-br ${s.color} hover:border-indigo-400/50 hover:bg-slate-850`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 mb-2 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                {s.title}
              </span>
              <span className="text-[11px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                {s.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
