"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentEditor } from "@/components/document-editor";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const { id } = use<{ id: string }>(params);
  const router = useRouter();
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Try to fetch from backend API first (for shared documents)
    const fetchSize = async () => {
      try {
        const response = await fetch(`/api/documents/${id}/canvas`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.metadata) {
            const { width, height } = result.metadata;
            if (
              typeof width === "number" &&
              typeof height === "number" &&
              width > 0 &&
              height > 0
            ) {
              setSize({ width, height });
              // Also save to localStorage for offline access
              localStorage.setItem(
                `tedit:document:${id}:size`,
                JSON.stringify({ width, height }),
              );
              return;
            }
          }
        }
      } catch (apiError) {
        // API failed, try localStorage
        console.warn("Backend load failed, trying localStorage:", apiError);
      }
      
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(`tedit:document:${id}:size`);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (
          typeof parsed?.width === "number" &&
          typeof parsed?.height === "number" &&
          parsed.width > 0 &&
          parsed.height > 0
        ) {
          setSize(parsed);
        }
      } catch {
        /* ignore */
      }
    };
    
    fetchSize();
  }, [id]);

  const width = size?.width ?? 2560;
  const height = size?.height ?? 1440;

  const handleNewDocument = () => {
    router.push("/");
  };

  return (
    <DocumentEditor
      documentId={id}
      canvasWidth={width}
      canvasHeight={height}
      onNewDocument={handleNewDocument}
    />
  );
}

