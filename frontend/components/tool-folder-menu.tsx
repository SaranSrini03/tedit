"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toolFolders } from "@/lib/constants";
import type { ToolId } from "@/lib/types";

interface ToolFolderMenuProps {
  folderId: string;
  activeTool: ToolId;
  onToolSelect: (tool: ToolId) => void;
  position: { x: number; y: number };
  onClose: () => void;
}

export function ToolFolderMenu({
  folderId,
  activeTool,
  onToolSelect,
  position,
  onClose,
}: ToolFolderMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const folder = toolFolders.find((f) => f.id === folderId);

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

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!folder) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-lg border border-gray-300 bg-white p-2 shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="mb-2 border-b border-gray-200 px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-black">
        {folder.label}
      </div>
      <div className="flex flex-col gap-1">
        {folder.tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <Button
              key={tool.id}
              variant="ghost"
              onClick={() => {
                onToolSelect(tool.id);
                onClose();
              }}
              className={`h-9 w-full justify-start gap-3 rounded-md px-3 text-sm transition !text-black ${
                isActive
                  ? "bg-gray-200 hover:bg-gray-300"
                  : "hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4 !text-black" />
              <span className="!text-black">{tool.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

