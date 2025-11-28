"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/topbar";
import { Toolbar } from "@/components/toolbar";
import { ToolSidebar } from "@/components/tool-sidebar";
import { ColorPanel } from "@/components/color-panel";
import { PropertiesPanel } from "@/components/properties-panel";
import { LayersPanel } from "@/components/layers-panel";
import { Button } from "@/components/ui/button";
import { WorkspaceContainer } from "@/components/workspace-container";
import { CanvasRenderer } from "@/components/canvas-renderer";
import { useCanvas } from "@/hooks/use-canvas";
import { baseLayers, seedHistory } from "@/lib/constants";
import type { ToolId, Layer, HistoryEntry } from "@/lib/types";

interface DocumentEditorProps {
  documentId: string;
  canvasWidth: number;
  canvasHeight: number;
  onNewDocument: () => void;
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || !!target.closest("input, textarea, [contenteditable='true']");
};

export function DocumentEditor({
  documentId,
  canvasWidth,
  canvasHeight,
  onNewDocument,
}: DocumentEditorProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("brush");
  const [brushSize, setBrushSize] = useState(8);
  const [strokeColor, setStrokeColor] = useState("#38bdf8");
  const [layers, setLayers] = useState<Layer[]>(baseLayers);
  const [history, setHistory] = useState<HistoryEntry[]>(seedHistory);
  const [brightness, setBrightness] = useState(72);
  const [userZoom, setUserZoom] = useState(1);
  const [renderScale, setRenderScale] = useState(1);
  const [isHandTool, setIsHandTool] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const handActive = isHandTool || spacePressed;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addImageLayerEntry = useCallback((name: string) => {
    setLayers((prev) => [
      {
        id: crypto.randomUUID(),
        name: name || `Image ${prev.filter((layer) => layer.type === "Image").length + 1}`,
        type: "Image",
        visible: true,
      },
      ...prev,
    ]);
  }, []);

  const pushHistory = useCallback((label: string) => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      label,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setHistory((prev) => [entry, ...prev].slice(0, 6));
  }, []);

  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    prepareCanvas,
    drawImageOnCanvas,
    restoreCanvas,
  } = useCanvas({
    documentId,
    activeTool,
    brushSize,
    strokeColor,
    zoom: renderScale * 100,
    canvasWidth,
    canvasHeight,
    onDrawComplete: pushHistory,
  });

  useEffect(() => {
    prepareCanvas();
    // Restore saved content after canvas is prepared when dimensions change
    requestAnimationFrame(() => {
      restoreCanvas();
    });
  }, [prepareCanvas, restoreCanvas, canvasWidth, canvasHeight]);

  const adjustBrushSize = (delta: number) => {
    setBrushSize((size) => Math.max(1, Math.min(128, size + delta)));
  };

  const handleZoomChange = useCallback((delta: number) => {
    setUserZoom((value) => {
      const next = Math.min(4, Math.max(0.1, value + delta));
      return Number(next.toFixed(2));
    });
  }, []);

  const handleScaleChange = useCallback((scale: number) => {
    setRenderScale(scale);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !event.repeat && !isEditableTarget(event.target)) {
        event.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        setSpacePressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, []);

  useEffect(() => {
    const handleColorSwap = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "x" && !isEditableTarget(event.target)) {
        event.preventDefault();
        setStrokeColor((current) =>
          current.toLowerCase() === "#0f172a" ? "#ffffff" : "#0f172a",
        );
      }
    };
    window.addEventListener("keydown", handleColorSwap, true);
    return () => window.removeEventListener("keydown", handleColorSwap, true);
  }, []);

  const handleProcessFile = useCallback(
    (file: File | null) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          drawImageOnCanvas(image);
          addImageLayerEntry(file.name || "Imported image");
        };
        image.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [drawImageOnCanvas, addImageLayerEntry],
  );

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleProcessFile(file);
    event.target.value = "";
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleDropFile = (file: File | null) => {
    handleProcessFile(file);
  };

  const handleExport = useCallback(
    (format: "png" | "jpg") => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      const quality = format === "jpg" ? 0.92 : undefined;
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          link.href = url;
          link.download = `${documentId || "youdoc"}-${timestamp}.${format}`;
          document.body.appendChild(link);
          link.click();
          requestAnimationFrame(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(link);
          });
        },
        mime,
        quality,
      );
    },
    [canvasRef, documentId],
  );

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  };

  const addLayer = () => {
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `Layer ${layers.length + 1}`,
      type: "Pixel",
      visible: true,
    };
    setLayers((prev) => [newLayer, ...prev]);
    pushHistory("Added new layer");
  };

  const duplicateLayer = (id: string) => {
    setLayers((prev) => {
      const target = prev.find((layer) => layer.id === id);
      if (!target) return prev;
      const clone: Layer = {
        ...target,
        id: crypto.randomUUID(),
        name: `${target.name} copy`,
      };
      pushHistory(`Duplicated ${target.name}`);
      return [clone, ...prev];
    });
  };

  const deleteLayer = (id: string) => {
    setLayers((prev) => {
      const target = prev.find((layer) => layer.id === id);
      if (!target) return prev;
      pushHistory(`Deleted ${target.name}`);
      return prev.filter((layer) => layer.id !== id);
    });
  };

  const renameLayer = (id: string, name: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, name: name || layer.name } : layer,
      ),
    );
    pushHistory(`Renamed layer to ${name || "Untitled"}`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#2b2b2b] text-slate-100">
      <TopBar
        onNewDocument={onNewDocument}
        onExport={handleExport}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
        isGridVisible={showGrid}
      />

      <Toolbar
        activeTool={activeTool}
        brushSize={brushSize}
        userZoomPercent={renderScale * 100}
        isHandToolActive={isHandTool}
        onBrushSizeChange={adjustBrushSize}
        onHandToolToggle={() => setIsHandTool((prev) => !prev)}
        onToolSelect={setActiveTool}
      />

      <div className="flex flex-1 overflow-hidden">
        <ToolSidebar activeTool={activeTool} onToolSelect={setActiveTool} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#3a3a3a] bg-[#232323] px-6 py-3 text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <label className="flex items-center gap-2">
                Color
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(event) => setStrokeColor(event.target.value)}
                  className="h-7 w-10 rounded border border-[#555] bg-transparent p-0"
                  aria-label="Select stroke color"
                />
              </label>
              <Button
                variant="outline"
                className="border-[#555] px-3 py-1 text-[11px] uppercase tracking-wide"
                onClick={() => setStrokeColor("#0f172a")}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                className="border-[#555] px-3 py-1 text-[11px] uppercase tracking-wide"
                onClick={handleSelectImage}
              >
                Import image
              </Button>
            </div>
            <span className="text-[11px] text-slate-400">
              {Math.round(renderScale * 100)}% · {canvasWidth} × {canvasHeight}px
            </span>
          </div>

          <WorkspaceContainer
            docWidth={canvasWidth}
            docHeight={canvasHeight}
            userZoom={userZoom}
            handActive={handActive}
            showGrid={showGrid}
            onZoomChange={handleZoomChange}
            onScaleChange={handleScaleChange}
          >
            <CanvasRenderer
              canvasRef={canvasRef}
              activeTool={activeTool}
              brushSize={brushSize}
              isDrawingDisabled={handActive}
              onStartDrawing={startDrawing}
              onDraw={draw}
              onStopDrawing={stopDrawing}
              onDropImage={handleDropFile}
            />
          </WorkspaceContainer>
        </div>

        <aside className="flex w-80 min-h-0 flex-col gap-4 overflow-y-auto border-l border-[#2b2b2b] bg-[#1a1a1a] p-4">
          <ColorPanel
            strokeColor={strokeColor}
            brightness={brightness}
            onColorChange={setStrokeColor}
            onBrightnessChange={setBrightness}
          />

          <PropertiesPanel
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />

          <LayersPanel
            layers={layers}
            history={history}
            onToggleLayerVisibility={toggleLayerVisibility}
            onAddLayer={addLayer}
            onDuplicateLayer={duplicateLayer}
            onDeleteLayer={deleteLayer}
            onRenameLayer={renameLayer}
          />
        </aside>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  );
}

