"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface DocumentSetupProps {
  onCreate: (width: number, height: number) => void;
  onCancel: () => void;
}

const presets = [
  { name: "Web", width: 1920, height: 1080 },
  { name: "Mobile", width: 375, height: 667 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Social Media", width: 1080, height: 1080 },
  { name: "Print A4", width: 2480, height: 3508 },
  { name: "Custom", width: 0, height: 0 },
];

export function DocumentSetup({ onCreate, onCancel }: DocumentSetupProps) {
  const [width, setWidth] = useState(2560);
  const [height, setHeight] = useState(1440);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (preset: typeof presets[0]) => {
    if (preset.name === "Custom") {
      setSelectedPreset("Custom");
      setWidth(2560);
      setHeight(1440);
    } else {
      setSelectedPreset(preset.name);
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  const handleCreate = () => {
    if (width > 0 && height > 0) {
      onCreate(width, height);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-slate-100">
      <div className="flex w-full max-w-5xl flex-col gap-10 rounded-3xl border border-white/5 bg-white/5 px-10 py-12 shadow-[0_40px_120px_rgba(0,0,0,0.85)] backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/5">
              <img src="/logo.png" alt="Tedit logo" className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Canvas setup
              </p>
              <h1 className="text-3xl font-semibold text-white">TEDIT</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 hover:bg-white/10"
            onClick={onCancel}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                Presets
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={selectedPreset === preset.name ? "default" : "outline"}
                    className={`h-auto flex-col rounded-2xl border-white/10 px-4 py-3 text-left text-white transition-colors ${
                      selectedPreset === preset.name
                        ? "bg-white/10 text-white"
                        : "border-white/10 text-slate-200 hover:bg-white/5"
                    }`}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <span className="text-sm font-semibold">{preset.name}</span>
                    {preset.name !== "Custom" && (
                      <span className="text-xs text-slate-400">
                        {preset.width} × {preset.height}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/40 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                Custom size
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-slate-300">
                  <span>Width (px)</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={width}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setWidth(value);
                      setSelectedPreset(null);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-2 text-white placeholder:text-slate-500 focus:border-white focus:outline-none"
                    placeholder="Width"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  <span>Height (px)</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={height}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setHeight(value);
                      setSelectedPreset(null);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-2 text-white placeholder:text-slate-500 focus:border-white focus:outline-none"
                    placeholder="Height"
                  />
                </label>
              </div>
              <div className="mt-4 text-sm text-slate-400">
                Dimensions: {width} × {height} px
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-inner">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Preview
            </p>
            <div className="mt-6 flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-black/60 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <div className="text-center">
                <p className="text-lg font-semibold text-white">{presetLabel(width, height)}</p>
                <p className="text-sm text-slate-400">
                  {width} × {height} px
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="h-11 rounded-full border-white/30 px-6 text-sm text-white hover:bg-white/10"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                className="h-11 rounded-full bg-white px-8 text-sm font-semibold uppercase tracking-[0.15em] text-black hover:bg-slate-100"
                onClick={handleCreate}
                disabled={width <= 0 || height <= 0}
              >
                Create Canvas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function presetLabel(width: number, height: number) {
  if (width === 1920 && height === 1080) return "Web Project";
  if (width === 375 && height === 667) return "Mobile Artboard";
  if (width === 768 && height === 1024) return "Tablet Layout";
  if (width === 1080 && height === 1080) return "Social Square";
  if (width === 2480 && height === 3508) return "Print A4";
  return "Custom Canvas";
}

