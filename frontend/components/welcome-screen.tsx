"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onCreateNew: () => void;
  onOpen: () => void;
}

export function WelcomeScreen({ onCreateNew, onOpen }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-slate-100">
      <div className="flex flex-col items-center gap-10 rounded-3xl  px-10 py-12 shadow-[0_40px_120px_rgba(0,0,0,0.85)] backdrop-blur">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center  bg-white/5">
              <img src="/logo.png" alt="Tedit logo" className="h-8 w-8" />
            </span>
            <h1 className="text-4xl font-semibold text-white tracking-tight">
              TEDIT
            </h1>
          </div>
          <p className="max-w-xl text-center text-sm uppercase tracking-[0.25em] text-slate-400">
            LIGHTWEIGHT LAYOUT · CANVAS · EXPORT
          </p>
        </div>

        <p className="max-w-xl text-center text-base text-slate-200">
          Design thumbnails, mockups, and assets in a focused canvas workspace.
          No chrome, no clutter; just your page in the center.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-full border-transparent bg-white px-8 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-slate-100"
            style={{ color: "#000" }}
            onClick={onCreateNew}
          >
            <Sparkles className="h-4 w-4 text-black" />
            Start New Canvas
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full border-slate-500 px-8 text-sm font-medium text-slate-100 hover:bg-white/5"
            onClick={onOpen}
          >
            Open Existing
          </Button>
        </div>

        <div className="mt-2 flex gap-6 text-[11px] text-slate-500">
          <span>Ctrl + Wheel · Zoom</span>
          <span>Space · Hand Tool</span>
          <span>View → Grid</span>
        </div>
      </div>
    </div>
  );
}

