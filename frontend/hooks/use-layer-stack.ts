"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Layer } from "@/lib/types";

interface UseLayerStackOptions {
  initialLayers?: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  documentId?: string;
}

export function useLayerStack({
  initialLayers = [],
  canvasWidth,
  canvasHeight,
  documentId = "default",
}: UseLayerStackOptions) {
  const storageKeyRef = useRef(`tedit:layers:${documentId}`);
  
  const [layers, setLayers] = useState<Layer[]>(() => {
    // Try to restore from localStorage first
    try {
      const stored = localStorage.getItem(storageKeyRef.current);
      if (stored) {
        const parsedLayers = JSON.parse(stored);
        if (Array.isArray(parsedLayers) && parsedLayers.length > 0) {
          return parsedLayers.map((layer: Layer, index: number) => ({
            ...layer,
            opacity: layer.opacity ?? 100,
            locked: layer.locked ?? false,
            order: layer.order ?? index,
          })).sort((a, b) => a.order - b.order);
        }
      }
    } catch (error) {
      console.warn("Failed to restore layers from localStorage:", error);
    }
    
    // Fallback to initial layers
    return initialLayers.map((layer, index) => ({
      ...layer,
      opacity: layer.opacity ?? 100,
      locked: layer.locked ?? false,
      order: layer.order ?? index,
    })).sort((a, b) => a.order - b.order);
  });

  // Store canvas elements for each layer
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const [activeLayerId, setActiveLayerId] = useState<string | null>(
    layers.length > 0 ? layers[0].id : null
  );

  const activeLayer = layers.find((layer) => layer.id === activeLayerId);

  const getLayerCanvas = useCallback((layerId: string) => {
    return layerCanvasesRef.current.get(layerId);
  }, []);

  const setLayerCanvas = useCallback((layerId: string, canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      layerCanvasesRef.current.set(layerId, canvas);
    } else {
      layerCanvasesRef.current.delete(layerId);
    }
  }, []);

  const addLayer = useCallback((layer?: Partial<Layer>) => {
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: layer?.name || `Layer ${layers.length + 1}`,
      type: layer?.type || "Pixel",
      visible: layer?.visible ?? true,
      opacity: layer?.opacity ?? 100,
      locked: layer?.locked ?? false,
      order: layers.length,
      canvasData: layer?.canvasData,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    return newLayer;
  }, [layers.length]);

  const deleteLayer = useCallback((layerId: string) => {
    setLayers((prev) => {
      const filtered = prev.filter((layer) => layer.id !== layerId);
      // If deleting active layer, set new active layer
      if (activeLayerId === layerId) {
        const remaining = filtered.filter((l) => l.id !== layerId);
        setActiveLayerId(remaining.length > 0 ? remaining[0].id : null);
      }
      return filtered;
    });
    layerCanvasesRef.current.delete(layerId);
  }, [activeLayerId]);

  const duplicateLayer = useCallback((layerId: string) => {
    setLayers((prev) => {
      const target = prev.find((layer) => layer.id === layerId);
      if (!target) return prev;
      
      const duplicated: Layer = {
        ...target,
        id: crypto.randomUUID(),
        name: `${target.name} copy`,
        order: target.order + 0.5, // Insert right after original
      };
      
      // Reorder all layers after duplication
      const updated = [...prev, duplicated]
        .map((layer, index) => ({
          ...layer,
          order: layer.id === duplicated.id ? target.order + 0.5 : layer.order,
        }))
        .sort((a, b) => a.order - b.order)
        .map((layer, index) => ({
          ...layer,
          order: index,
        }));
      
      setActiveLayerId(duplicated.id);
      return updated;
    });
  }, []);

  const reorderLayer = useCallback((layerId: string, newOrder: number) => {
    setLayers((prev) => {
      const updated = prev.map((layer) => {
        if (layer.id === layerId) {
          return { ...layer, order: newOrder };
        }
        return layer;
      });
      
      // Reorder all layers
      return updated
        .sort((a, b) => {
          if (a.id === layerId) return newOrder - b.order;
          if (b.id === layerId) return a.order - newOrder;
          return a.order - b.order;
        })
        .map((layer, index) => ({
          ...layer,
          order: index,
        }));
    });
  }, []);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId
          ? { ...layer, opacity: Math.max(0, Math.min(100, opacity)) }
          : layer
      )
    );
  }, []);

  const toggleLayerLock = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      )
    );
  }, []);

  const renameLayer = useCallback((layerId: string, name: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, name: name.trim() || layer.name } : layer
      )
    );
  }, []);

  const setActiveLayer = useCallback((layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer && !layer.locked) {
      setActiveLayerId(layerId);
    }
  }, [layers]);

  const moveLayerUp = useCallback((layerId: string) => {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === layerId);
      if (!target) return prev;
      
      const currentOrder = target.order;
      if (currentOrder >= prev.length - 1) return prev; // Already at top
      
      return reorderLayers(prev, layerId, currentOrder + 1);
    });
  }, []);

  const moveLayerDown = useCallback((layerId: string) => {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === layerId);
      if (!target) return prev;
      
      const currentOrder = target.order;
      if (currentOrder <= 0) return prev; // Already at bottom
      
      return reorderLayers(prev, layerId, currentOrder - 1);
    });
  }, []);

  const getSortedLayers = useCallback(() => {
    return [...layers].sort((a, b) => b.order - a.order); // Top to bottom for rendering
  }, [layers]);

  // Get visible layers sorted by order (bottom to top for rendering)
  const getVisibleLayers = useCallback(() => {
    return getSortedLayers().filter((layer) => layer.visible);
  }, [getSortedLayers]);

  // Update layer canvas data
  const updateLayerCanvasData = useCallback((layerId: string, dataUrl: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, canvasData: dataUrl } : layer
      )
    );
  }, []);

  // Persist layers to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyRef.current, JSON.stringify(layers));
    } catch (error) {
      console.warn("Failed to persist layers to localStorage:", error);
    }
  }, [layers]);

  return {
    layers,
    activeLayer,
    activeLayerId,
    setActiveLayer,
    addLayer,
    deleteLayer,
    duplicateLayer,
    reorderLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    toggleLayerLock,
    renameLayer,
    moveLayerUp,
    moveLayerDown,
    getSortedLayers,
    getVisibleLayers,
    getLayerCanvas,
    setLayerCanvas,
    updateLayerCanvasData,
  };
}

// Helper function to reorder layers
function reorderLayers(layers: Layer[], layerId: string, newOrder: number): Layer[] {
  const clampedOrder = Math.max(0, Math.min(layers.length - 1, newOrder));
  
  const updated = layers.map((layer) => {
    if (layer.id === layerId) {
      return { ...layer, order: clampedOrder };
    }
    return layer;
  });
  
  return updated
    .sort((a, b) => {
      if (a.id === layerId) {
        if (b.order === clampedOrder) return 0;
        return clampedOrder - b.order;
      }
      if (b.id === layerId) {
        if (a.order === clampedOrder) return 0;
        return a.order - clampedOrder;
      }
      return a.order - b.order;
    })
    .map((layer, index) => ({
      ...layer,
      order: index,
    }));
}

