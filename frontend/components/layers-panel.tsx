"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Eye, EyeOff, Lock, Monitor } from "lucide-react";
import { LayerContextMenu } from "@/components/layer-context-menu";
import type { Layer, HistoryEntry } from "@/lib/types";

interface LayersPanelProps {
  layers: Layer[];
  history: HistoryEntry[];
  activeLayerId?: string | null;
  onToggleLayerVisibility: (id: string) => void;
  onSetActiveLayer: (id: string) => void;
  onAddLayer: () => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onReorderLayer: (layerId: string, newOrder: number) => void;
  onSetLayerOpacity: (layerId: string, opacity: number) => void;
  onToggleLayerLock?: (layerId: string) => void;
  getLayerCanvas?: (layerId: string) => HTMLCanvasElement | undefined;
}

export function LayersPanel({
  layers,
  history,
  activeLayerId,
  onToggleLayerVisibility,
  onSetActiveLayer,
  onAddLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onRenameLayer,
  onReorderLayer,
  onSetLayerOpacity,
  onToggleLayerLock,
  getLayerCanvas,
}: LayersPanelProps) {
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [dragDropPosition, setDragDropPosition] = useState<"above" | "below" | null>(null);
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null);
  const [layerThumbnails, setLayerThumbnails] = useState<Map<string, string>>(new Map());
  const [contextMenuLayerId, setContextMenuLayerId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Generate thumbnails for layers
  useEffect(() => {
    if (!getLayerCanvas) return;

    const newThumbnails = new Map<string, string>();
    
    layers.forEach((layer) => {
      const canvas = getLayerCanvas(layer.id);
      if (canvas) {
        try {
          // Create thumbnail (small size for preview)
          const thumbnailSize = 48;
          const thumbnailCanvas = document.createElement("canvas");
          thumbnailCanvas.width = thumbnailSize;
          thumbnailCanvas.height = thumbnailSize;
          const thumbnailCtx = thumbnailCanvas.getContext("2d");
          
          if (thumbnailCtx) {
            // Draw checkerboard background for transparency
            const checkSize = 4;
            for (let y = 0; y < thumbnailSize; y += checkSize) {
              for (let x = 0; x < thumbnailSize; x += checkSize) {
                const isEven = Math.floor(x / checkSize) % 2 === Math.floor(y / checkSize) % 2;
                thumbnailCtx.fillStyle = isEven ? "#2a2a2a" : "#1a1a1a";
                thumbnailCtx.fillRect(x, y, checkSize, checkSize);
              }
            }
            
            // Draw layer content scaled down
            thumbnailCtx.drawImage(canvas, 0, 0, thumbnailSize, thumbnailSize);
            newThumbnails.set(layer.id, thumbnailCanvas.toDataURL("image/png"));
          }
        } catch (error) {
          console.warn("Failed to generate thumbnail for layer", layer.id, error);
        }
      } else if (layer.canvasData) {
        // Use stored canvas data if available
        newThumbnails.set(layer.id, layer.canvasData);
      }
    });
    
    setLayerThumbnails(newThumbnails);
  }, [layers, getLayerCanvas]);

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

  const sortedLayers = [...layers].sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

  const handleDragStart = (layerId: string, event: React.DragEvent) => {
    setDraggedLayerId(layerId);
    // Set drag image to a transparent image for better UX
    const dragImage = document.createElement("div");
    dragImage.style.opacity = "0";
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (event: React.DragEvent, layerId: string) => {
    event.preventDefault();
    if (!draggedLayerId || draggedLayerId === layerId) {
      setDragOverLayerId(null);
      setDragDropPosition(null);
      return;
    }
    
    setDragOverLayerId(layerId);
    
    // Determine if drop should be above or below based on mouse position
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseY = event.clientY - rect.top;
    const isAbove = mouseY < rect.height / 2;
    
    setDragDropPosition(isAbove ? "above" : "below");
  };

  const handleDragLeave = () => {
    setDragOverLayerId(null);
    setDragDropPosition(null);
  };

  const handleDrop = (event: React.DragEvent, targetLayerId: string) => {
    event.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetLayerId) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      setDragDropPosition(null);
      return;
    }

    const targetLayer = layers.find((l) => l.id === targetLayerId);
    const draggedLayer = layers.find((l) => l.id === draggedLayerId);
    
    if (!targetLayer || !draggedLayer) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      setDragDropPosition(null);
      return;
    }

    // Use the stored drop position (above or below)
    const dropAbove = dragDropPosition === "above";
    
    // Get all layers sorted by order
    const sortedLayers = [...layers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const draggedIndex = sortedLayers.findIndex((l) => l.id === draggedLayerId);
    const targetIndex = sortedLayers.findIndex((l) => l.id === targetLayerId);
    
    // Can't reorder to same position
    if (draggedIndex === targetIndex) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      setDragDropPosition(null);
      return;
    }
    
    // Remove dragged layer from its current position
    const [dragged] = sortedLayers.splice(draggedIndex, 1);
    
    // Calculate new insertion index
    let insertIndex: number;
    if (dropAbove) {
      // Insert above target (at target's index)
      insertIndex = sortedLayers.findIndex((l) => l.id === targetLayerId);
    } else {
      // Insert below target (at target's index + 1)
      insertIndex = sortedLayers.findIndex((l) => l.id === targetLayerId) + 1;
    }
    
    // Insert dragged layer at new position
    sortedLayers.splice(insertIndex, 0, dragged);
    
    // Calculate the final order position for the dragged layer
    const finalOrder = insertIndex;
    
    // Reorder the dragged layer to its new position
    // The hook will automatically reorder all other layers
    onReorderLayer(draggedLayerId, finalOrder);

    setDraggedLayerId(null);
    setDragOverLayerId(null);
    setDragDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
    setDragDropPosition(null);
  };

  const handleLayerRightClick = (event: React.MouseEvent, layerId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuLayerId(layerId);
  };

  const closeContextMenu = () => {
    setContextMenuLayerId(null);
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

      <div className="mt-5 space-y-2">
        {sortedLayers.map((layer) => {
          const isActive = activeLayerId === layer.id;
          const isDragging = draggedLayerId === layer.id;
          const isDragOver = dragOverLayerId === layer.id;
          const isExpanded = expandedLayerId === layer.id;
          const showDropIndicatorAbove = isDragOver && dragDropPosition === "above";
          const showDropIndicatorBelow = isDragOver && dragDropPosition === "below";

          return (
            <div
              key={layer.id}
              draggable={!contextMenuLayerId}
              onDragStart={(e) => {
                // Don't start drag if context menu is open
                if (contextMenuLayerId) {
                  e.preventDefault();
                  return;
                }
                handleDragStart(layer.id, e);
              }}
              onDragOver={(e) => handleDragOver(e, layer.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, layer.id)}
              onDragEnd={handleDragEnd}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLayerRightClick(e, layer.id);
              }}
              className={`group relative cursor-move rounded-2xl border transition-all ${
                isActive
                  ? "border-sky-500/50 bg-sky-500/10"
                  : "border-white/10 bg-black/40 hover:bg-white/5"
              } ${isDragging ? "opacity-50" : ""}`}
            >
              {/* Drop indicator above */}
              {showDropIndicatorAbove && (
                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-sky-500 rounded-full z-10" />
              )}
              {/* Drop indicator below */}
              {showDropIndicatorBelow && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sky-500 rounded-full z-10" />
              )}
              <div
                onMouseDown={(e) => {
                  // Select layer on mouse down (before drag starts)
                  if (!draggedLayerId) {
                    onSetActiveLayer(layer.id);
                  }
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white"
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSetActiveLayer(layer.id);
                  }
                }}
              >
                <div className="flex flex-1 items-center gap-3">
                  {/* Visibility toggle button */}
                  <Button
                    variant="ghost"
                    className="h-8 w-8 flex-shrink-0 cursor-pointer rounded-full border border-white/10 p-0 text-slate-300 hover:bg-white/10"
                    aria-label={layer.visible ? "Hide layer" : "Show layer"}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleLayerVisibility(layer.id);
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    {layer.visible ? (
                      <Eye className="h-4 w-4 text-sky-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                  {/* Layer preview thumbnail */}
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900">
                    {layerThumbnails.has(layer.id) ? (
                      <img
                        src={layerThumbnails.get(layer.id)}
                        alt={`${layer.name} preview`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                        {layer.type.slice(0, 1)}
                      </div>
                    )}
                    {!layer.visible && (
                      <div className="absolute inset-0 bg-black/60" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                        {layer.type}
                      </p>
                      {layer.locked && (
                        <Lock className="h-3 w-3 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onToggleLayerLock && (
                    <LayerIconButton
                      label={layer.locked ? "Unlock layer" : "Lock layer"}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleLayerLock(layer.id);
                      }}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                      className={layer.locked ? "text-yellow-400" : ""}
                    >
                      <Lock className="h-4 w-4" />
                    </LayerIconButton>
                  )}
                </div>
              </div>

              {/* Expanded controls */}
              <div
                className={`overflow-hidden transition-all ${
                  isExpanded ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-white/10 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Opacity</span>
                    <Slider
                      value={layer.opacity ?? 100}
                      onChange={(event) => onSetLayerOpacity(layer.id, Number(event.target.value))}
                      max={100}
                      min={0}
                      step={1}
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="w-12 text-right text-xs text-slate-400">
                      {Math.round(layer.opacity ?? 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Expand/collapse button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedLayerId(isExpanded ? null : layer.id);
                }}
                className="absolute bottom-2 right-16 text-xs text-slate-500 opacity-0 transition-opacity group-hover:opacity-100"
              >
                {isExpanded ? "−" : "+"}
              </button>
            </div>
          );
        })}
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

      {/* Layer Context Menu - Render outside panel to avoid clipping */}
      {contextMenuLayerId && (() => {
        const layer = layers.find((l) => l.id === contextMenuLayerId);
        if (!layer) return null;
        return (
          <LayerContextMenu
            key={contextMenuLayerId}
            layer={layer}
            layers={layers}
            position={contextMenuPosition}
            onRename={() => {
              setRenamingLayerId(layer.id);
              setRenameValue(layer.name);
            }}
            onDuplicate={() => onDuplicateLayer(layer.id)}
            onDelete={() => onDeleteLayer(layer.id)}
            onToggleLock={() => onToggleLayerLock?.(layer.id)}
            onToggleVisibility={() => onToggleLayerVisibility(layer.id)}
            onClose={closeContextMenu}
          />
        );
      })()}
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

