"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Layers as LayersIcon, Monitor, PencilLine, Trash2 } from "lucide-react";
import type { Layer, HistoryEntry } from "@/lib/types";

interface LayersPanelProps {
  layers: Layer[];
  history: HistoryEntry[];
  onToggleLayerVisibility: (id: string) => void;
  onAddLayer: () => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
}

export function LayersPanel({
  layers,
  history,
  onToggleLayerVisibility,
  onAddLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onRenameLayer,
}: LayersPanelProps) {
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRenameLayer = (layer: Layer) => {
    setRenamingLayerId(layer.id);
    setRenameValue(layer.name);
  };

  const commitRenameLayer = () => {
    if (!renamingLayerId) return;
    onRenameLayer(renamingLayerId, renameValue.trim());
    setRenamingLayerId(null);
    setRenameValue("");
  };

  const cancelRenameLayer = () => {
    setRenamingLayerId(null);
    setRenameValue("");
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-[10px] uppercase tracking-[0.35em] text-slate-500">
          {["Layers", "Channels", "Paths"].map((tab, index) => (
            <span key={tab} className={index === 0 ? "text-white" : "text-slate-500"}>
              {tab}
            </span>
          ))}
        </div>
        <Button
          variant="outline"
          className="rounded-full border-white/20 px-4 py-1 text-[10px] tracking-[0.3em] text-white hover:bg-white/10"
          onClick={onAddLayer}
        >
          New
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {layers.map((layer) => (
          <div
            key={layer.id}
            onClick={() => onToggleLayerVisibility(layer.id)}
            className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm text-white transition hover:bg-white/5"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggleLayerVisibility(layer.id);
              }
            }}
          >
            <div className="flex flex-col">
              {renamingLayerId === layer.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={commitRenameLayer}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitRenameLayer();
                    if (event.key === "Escape") cancelRenameLayer();
                    event.stopPropagation();
                  }}
                  onClick={(event) => event.stopPropagation()}
                  className="rounded-lg border border-white/20 bg-transparent px-2 py-1 text-sm text-white outline-none"
                />
              ) : (
                <p className="font-semibold tracking-wide">{layer.name}</p>
              )}
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                {layer.type}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <LayerIconButton
                label="Rename layer"
                onClick={(event) => {
                  event.stopPropagation();
                  startRenameLayer(layer);
                }}
              >
                <PencilLine className="h-4 w-4" />
              </LayerIconButton>
              <LayerIconButton
                label="Duplicate layer"
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicateLayer(layer.id);
                }}
              >
                <Copy className="h-4 w-4" />
              </LayerIconButton>
              <LayerIconButton
                label="Delete layer"
                className="text-red-400"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteLayer(layer.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </LayerIconButton>
              <LayersIcon
                className={`h-4 w-4 ${layer.visible ? "text-sky-400" : "text-slate-500"}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">
          History
        </p>
        <div className="mt-3 space-y-2">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <div>
                <p className="text-slate-100">{entry.label}</p>
                <p className="text-xs text-slate-500">{entry.timestamp}</p>
              </div>
              <Monitor className="h-4 w-4 text-slate-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LayerIconButton({
  children,
  label,
  onClick,
  className,
}: {
  children: ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      className={`h-7 w-7 rounded-full border border-white/10 p-0 text-slate-300 hover:bg-white/10 ${className ?? ""}`}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

