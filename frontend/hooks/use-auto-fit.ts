"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface UseAutoFitOptions {
  documentWidth: number;
  documentHeight: number;
}

export function useAutoFit({ documentWidth, documentHeight }: UseAutoFitOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const measure = () => {
      const node = containerRef.current;
      if (!node) {
        setViewport({ width: window.innerWidth, height: window.innerHeight });
        return;
      }
      const rect = node.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  const scale = useMemo(() => {
    if (!viewport.width || !viewport.height) return 1;
    return Math.min(
      viewport.width / documentWidth || 1,
      viewport.height / documentHeight || 1,
      1,
    );
  }, [documentHeight, documentWidth, viewport.height, viewport.width]);

  return { scale, containerRef };
}

