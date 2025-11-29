"use client";

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Copy, Layers as LayersIcon, Lock, PencilLine, Trash2 } from "lucide-react";
import type { Layer } from "@/lib/types";

interface LayerContextMenuProps {
  layer: Layer;
  layers: Layer[];
  position: { x: number; y: number };
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
  onClose: () => void;
}

export function LayerContextMenu({
  layer,
  layers,
  position,
  onRename,
  onDuplicate,
  onDelete,
  onToggleLock,
  onToggleVisibility,
  onClose,
}: LayerContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Use click instead of mousedown to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Can only delete if there's more than one layer
  const canDelete = layers.length > 1;

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[180px] rounded-lg border border-white/20 bg-black/95 p-2 shadow-2xl backdrop-blur"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          onClick={() => {
            onRename();
            onClose();
          }}
          className="h-9 w-full justify-start gap-3 rounded-md px-3 text-sm text-white hover:bg-white/10"
        >
          <PencilLine className="h-4 w-4" />
          <span>Rename</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="h-9 w-full justify-start gap-3 rounded-md px-3 text-sm text-white hover:bg-white/10"
        >
          <Copy className="h-4 w-4" />
          <span>Duplicate</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onToggleVisibility();
            onClose();
          }}
          className="h-9 w-full justify-start gap-3 rounded-md px-3 text-sm text-white hover:bg-white/10"
        >
          <LayersIcon className={`h-4 w-4 ${layer.visible ? "text-sky-400" : "text-slate-500"}`} />
          <span>{layer.visible ? "Hide" : "Show"}</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onToggleLock();
            onClose();
          }}
          className="h-9 w-full justify-start gap-3 rounded-md px-3 text-sm text-white hover:bg-white/10"
        >
          <Lock className={`h-4 w-4 ${layer.locked ? "text-yellow-400" : ""}`} />
          <span>{layer.locked ? "Unlock" : "Lock"}</span>
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="h-9 w-full justify-start gap-3 rounded-md px-3 text-sm text-red-400 hover:bg-red-400/10"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        )}
      </div>
    </div>
  );

  // Use portal to render outside parent container to avoid overflow clipping
  if (typeof window === "undefined") return null;
  return createPortal(menuContent, document.body);
}

