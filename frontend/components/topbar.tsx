"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { menuItems } from "@/lib/constants";

interface TopBarProps {
  onNewDocument: () => void;
  onExport: (format: "png" | "jpg") => void;
  onToggleGrid: () => void;
  isGridVisible: boolean;
}

export function TopBar({ onNewDocument, onExport, onToggleGrid, isGridVisible }: TopBarProps) {
  const fileMenuRef = useRef<HTMLDivElement | null>(null);
  const viewMenuRef = useRef<HTMLDivElement | null>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-file-trigger='true']")) {
        return;
      }
      if (!fileMenuRef.current?.contains(target)) {
        setIsFileMenuOpen(false);
      }
      if (!viewMenuRef.current?.contains(target)) {
        setIsViewMenuOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleFileToggle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsFileMenuOpen((open) => !open);
  }, []);

  const handleViewToggle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsViewMenuOpen((open) => !open);
  }, []);

  const handleNewDocumentClick = () => {
    onNewDocument();
    setIsFileMenuOpen(false);
  };

  const handleExportClick = (format: "png" | "jpg") => {
    onExport(format);
    setIsFileMenuOpen(false);
  };

  const handleToggleGridClick = () => {
    onToggleGrid();
    setIsViewMenuOpen(false);
  };

  return (
    <header className="relative z-[9998] flex h-16 items-center gap-8 border-b border-white/10 bg-black/70 px-8 text-[11px] uppercase tracking-[0.3em] text-slate-400 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5">
          <img src="/logo.png" alt="Tedit logo" className="h-7 w-7" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Editor</p>
          <p className="text-lg font-semibold text-white tracking-[0.2em]">TEDIT</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] tracking-[0.35em]">
        <div className="relative" ref={fileMenuRef}>
          <Button
            variant="ghost"
            data-file-trigger="true"
            className="rounded-full px-4 py-2 text-slate-200 hover:bg-white/10"
            onClick={handleFileToggle}
          >
            File
          </Button>
          {isFileMenuOpen && (
            <div className="absolute left-0 top-12 z-[9999] w-56 rounded-2xl border border-white/10 bg-black/90 p-3 shadow-2xl shadow-black/80 backdrop-blur">
              <Button
                variant="ghost"
                className="w-full justify-between rounded-xl px-4 text-slate-200 hover:bg-white/5"
                onClick={handleNewDocumentClick}
              >
                New document
                <span className="text-[9px] text-slate-500">N</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between rounded-xl px-4 text-slate-200 hover:bg-white/5"
              >
                Open…
                <span className="text-[9px] text-slate-500">⌘O</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between rounded-xl px-4 text-slate-200 hover:bg-white/5"
              >
                Save as
                <span className="text-[9px] text-slate-500">⇧S</span>
              </Button>
              <div className="mt-3 rounded-xl bg-white/5 p-2 text-[10px] uppercase text-slate-500">
                Export
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-xl px-4 text-slate-100 hover:bg-white/5"
                onClick={() => handleExportClick("png")}
              >
                PNG
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-xl px-4 text-slate-100 hover:bg-white/5"
                onClick={() => handleExportClick("jpg")}
              >
                JPG
              </Button>
            </div>
          )}
        </div>
        <div className="relative" ref={viewMenuRef}>
          <Button
            variant="ghost"
            className="rounded-full px-4 py-2 text-slate-200 hover:bg-white/10"
            onClick={handleViewToggle}
          >
            View
          </Button>
          {isViewMenuOpen && (
            <div className="absolute left-0 top-12 z-[9999] w-44 rounded-2xl border border-white/10 bg-black/90 p-3 shadow-2xl shadow-black/80 backdrop-blur">
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between rounded-xl px-4 text-slate-100 hover:bg-white/5"
                onClick={handleToggleGridClick}
              >
                Grid
                <span className="text-[10px] uppercase text-slate-500">
                  {isGridVisible ? "On" : "Off"}
                </span>
              </Button>
            </div>
          )}
        </div>
        {menuItems
          .filter((item) => item !== "View")
          .map((item) => (
            <Button
              key={item}
              variant="ghost"
              className="rounded-full px-3 py-2 text-slate-500 hover:text-white"
            >
              {item}
            </Button>
          ))}
      </div>
      <div className="ml-auto flex items-center gap-4 text-[11px] tracking-[0.2em] text-slate-400">
        <span className="text-slate-300">Untitled · 100%</span>
        <span className="text-slate-500">RGB/8</span>
        <Button variant="ghost" className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-slate-200 hover:bg-white/10">
          Search
        </Button>
        <Button className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-black hover:bg-slate-100">
          <Sparkles className="h-3 w-3 text-black" />
          Share
        </Button>
      </div>
    </header>
  );
}

