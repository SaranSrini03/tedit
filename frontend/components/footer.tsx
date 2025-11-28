"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FooterProps {
  zoom: number;
  onZoomChange: (delta: number) => void;
}

export function Footer({ zoom, onZoomChange }: FooterProps) {
  return (
    <footer className="flex items-center justify-between border-t border-[#232323] bg-[#202020] px-6 py-2 text-xs text-slate-400">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="h-6 w-6 p-0 text-slate-300"
          onClick={() => onZoomChange(-5)}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span>{zoom}%</span>
        <Button
          variant="ghost"
          className="h-6 w-6 p-0 text-slate-300"
          onClick={() => onZoomChange(5)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span>Doc: 8.2M / 12.4M</span>
      </div>
      <div className="flex items-center gap-3">
        <span>Scratch: 65%</span>
        <span>GPU: On</span>
        <span>
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </footer>
  );
}

