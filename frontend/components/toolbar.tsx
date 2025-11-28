"use client";

import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToolId } from "@/lib/types";

interface ToolbarProps {
  activeTool: ToolId;
  brushSize: number;
  userZoomPercent: number;
  isHandToolActive: boolean;
  onBrushSizeChange: (delta: number) => void;
  onHandToolToggle: () => void;
}

export function Toolbar({
  activeTool,
  brushSize,
  userZoomPercent,
  isHandToolActive,
  onBrushSizeChange,
  onHandToolToggle,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-white/10 bg-black/60 px-8 py-4 text-[10px] uppercase tracking-[0.25em] text-slate-300 backdrop-blur">
      <div className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-slate-100">
        <Button variant="ghost" className="h-7 w-7 rounded-full border border-white/20 bg-white/5 p-0 text-white hover:bg-white/10" aria-label="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" className="h-7 w-7 rounded-full border border-white/20 bg-white/5 p-0 text-white hover:bg-white/10" aria-label="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-white">
        <span className="text-[9px] tracking-[0.4em] text-slate-400">Tool</span>
        <span className="text-sm capitalize tracking-normal">{activeTool}</span>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-white/15 px-4 py-2">
        <span className="text-[9px] tracking-[0.4em] text-slate-400">Brush</span>
        <Button
          variant="ghost"
          className="h-7 w-7 rounded-full border border-white/20 bg-white/5 p-0 text-white hover:bg-white/10"
          onClick={() => onBrushSizeChange(-2)}
        >
          -
        </Button>
        <span className="w-12 text-center text-xs font-semibold text-white">{brushSize}px</span>
        <Button
          variant="ghost"
          className="h-7 w-7 rounded-full border border-white/20 bg-white/5 p-0 text-white hover:bg-white/10"
          onClick={() => onBrushSizeChange(2)}
        >
          +
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-white/15 px-4 py-2">
        <span className="text-[9px] tracking-[0.4em] text-slate-400">Mode</span>
        <Button variant="ghost" className="rounded-full border border-white/20 px-4 py-1 text-[10px] tracking-[0.3em] text-white hover:bg-white/10">
          Normal
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-white/15 px-4 py-2">
        <span className="text-[9px] tracking-[0.4em] text-slate-400">Opacity</span>
        <span className="text-xs font-semibold text-white">100%</span>
        <span className="ml-4 text-[9px] tracking-[0.4em] text-slate-400">Flow</span>
        <span className="text-xs font-semibold text-white">100%</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button
          variant="ghost"
          className={`rounded-full border px-4 py-1 text-[10px] tracking-[0.25em] ${isHandToolActive ? "border-white bg-white text-black" : "border-white/25 text-white hover:bg-white/10"}`}
          onClick={onHandToolToggle}
        >
          Hand
        </Button>
        <span className="text-xs font-semibold text-white">{Math.round(userZoomPercent)}%</span>
      </div>
    </div>
  );
}

