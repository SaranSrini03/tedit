"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ColorPanelProps {
  strokeColor: string;
  brightness: number;
  onColorChange: (color: string) => void;
  onBrightnessChange: (brightness: number) => void;
}

export function ColorPanel({
  strokeColor,
  brightness,
  onColorChange,
  onBrightnessChange,
}: ColorPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-slate-400">
        <span>Color</span>
        <div className="flex gap-3 text-slate-500">
          {["Swatches", "Gradients"].map((tab) => (
            <button
              key={tab}
              className="text-[9px] uppercase tracking-[0.4em] hover:text-slate-200"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div
          className="h-20 w-20 rounded-2xl border border-white/15 shadow-inner"
          style={{
            background: `linear-gradient(135deg, ${strokeColor}, #ffffff)`,
          }}
        />
        <div className="flex flex-col gap-2 text-xs text-slate-400">
          <span className="uppercase tracking-[0.35em] text-slate-500">
            Foreground
          </span>
          <span className="text-sm font-semibold text-white tracking-wide">
            {strokeColor.toUpperCase()}
          </span>
          <Button
            variant="outline"
            className="h-8 w-32 rounded-full border-white/20 text-[10px] tracking-[0.3em] text-white hover:bg-white/10"
          >
            Save swatch
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5">
        <Slider
          label={`Brightness ${brightness}%`}
          min={0}
          max={100}
          value={brightness}
          onChange={(event) => onBrightnessChange(Number(event.target.value))}
        />
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-slate-300">
          <span className="tracking-[0.3em] text-slate-500">Pick</span>
          <input
            type="color"
            value={strokeColor}
            onChange={(event) => onColorChange(event.target.value)}
            className="h-9 w-14 rounded border border-white/30 bg-transparent p-0"
            aria-label="Choose color"
          />
        </div>
      </div>
    </div>
  );
}

