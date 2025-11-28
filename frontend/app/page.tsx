"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeScreen } from "@/components/welcome-screen";
import { DocumentSetup } from "@/components/document-setup";

type ViewState = "welcome" | "setup";

export default function Home() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>("welcome");

  const handleCreateNew = () => {
    setViewState("setup");
  };

  const handleOpen = () => {
    console.log("Open file");
  };

  const handleDocumentCreate = async (width: number, height: number) => {
    const documentId = crypto.randomUUID();
    if (typeof window !== "undefined") {
      // Save to localStorage for immediate access
      localStorage.setItem(
        `tedit:document:${documentId}:size`,
        JSON.stringify({ width, height }),
      );
      
      // Also save to backend for sharing
      try {
        await fetch(`/api/documents/${documentId}/canvas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataUrl: null, // No canvas data yet, just metadata
            width,
            height,
          }),
        });
      } catch (error) {
        // Backend save failed, but localStorage save succeeded
        console.warn("Failed to save document size to backend:", error);
      }
    }
    router.push(`/document/${documentId}`);
  };

  const handleCancelSetup = () => {
    setViewState("welcome");
  };

  if (viewState === "welcome") {
    return (
      <WelcomeScreen
        onCreateNew={handleCreateNew}
        onOpen={handleOpen}
      />
    );
  }

  return (
    <DocumentSetup
      onCreate={handleDocumentCreate}
      onCancel={handleCancelSetup}
    />
  );
}
