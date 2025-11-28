"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toolFolders } from "@/lib/constants";
import { ToolFolderMenu } from "@/components/tool-folder-menu";
import type { ToolId } from "@/lib/types";

interface ToolSidebarProps {
  activeTool: ToolId;
  onToolSelect: (tool: ToolId) => void;
}

export function ToolSidebar({ activeTool, onToolSelect }: ToolSidebarProps) {
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const getActiveFolder = () => {
    return toolFolders.find((folder) =>
      folder.tools.some((tool) => tool.id === activeTool)
    );
  };

  const activeFolder = getActiveFolder();

  const handleFolderClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    folderId: string
  ) => {
    const folder = toolFolders.find((f) => f.id === folderId);
    if (!folder) return;

    // Left click: select default tool or cycle through tools
    if (e.button === 0 || e.type === "click") {
      if (folder.tools.some((tool) => tool.id === activeTool)) {
        // If current tool is in this folder, cycle to next tool in folder
        const currentIndex = folder.tools.findIndex(
          (tool) => tool.id === activeTool
        );
        const nextIndex = (currentIndex + 1) % folder.tools.length;
        onToolSelect(folder.tools[nextIndex].id);
      } else {
        // Select default tool from folder
        onToolSelect(folder.defaultTool);
      }
    }
  };

  const handleFolderRightClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    folderId: string
  ) => {
    e.preventDefault();
    const button = buttonRefs.current.get(folderId);
    if (button) {
      const rect = button.getBoundingClientRect();
      setMenuPosition({
        x: rect.right + 8,
        y: rect.top,
      });
      setOpenFolder(folderId);
    }
  };

  const handleToolSelect = (toolId: ToolId) => {
    onToolSelect(toolId);
    setOpenFolder(null);
  };

  return (
    <>
      <aside className="flex w-20 flex-col border-r border-white/10 bg-black/70 px-3 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur">
        <div className="flex items-center justify-center pb-5 text-[10px] uppercase tracking-[0.35em] text-slate-500">
          Tools
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="flex flex-col items-center gap-3 pb-6">
            {toolFolders.map((folder) => {
              const FolderIcon = folder.icon;
              const isActive = folder.tools.some((tool) => tool.id === activeTool);
              const hasMultipleTools = folder.tools.length > 1;

              return (
                <div key={folder.id} className="relative">
                  <Button
                    ref={(el) => {
                      if (el) buttonRefs.current.set(folder.id, el);
                    }}
                    variant="ghost"
                    onClick={(e) => handleFolderClick(e, folder.id)}
                    onContextMenu={(e) => handleFolderRightClick(e, folder.id)}
                    className={`group relative h-12 w-12 rounded-2xl border px-0 transition ${
                      isActive
                        ? "border-white bg-white text-black"
                        : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                    }`}
                    title={`${folder.label}${hasMultipleTools ? " (Right-click for more)" : ""}`}
                  >
                    <FolderIcon
                      className={`h-5 w-5 ${isActive ? "text-black" : "text-white"}`}
                    />
                    {hasMultipleTools && (
                      <div
                        className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 ${
                          isActive
                            ? "border-black bg-white"
                            : "border-black/70 bg-white/20"
                        }`}
                      />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center gap-4 border-t border-white/10 pt-4">
          <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
            Colors
          </div>
          <div className="relative h-12 w-12">
            <div className="absolute left-3 top-3 h-7 w-7 rounded border border-white/20 bg-white/70" />
            <div className="absolute h-7 w-7 rounded border border-white/20 bg-black/70" />
          </div>
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-full border border-white/20 text-xs text-white hover:bg-white/10"
          >
            …
          </Button>
        </div>
      </aside>

      {openFolder && (
        <ToolFolderMenu
          folderId={openFolder}
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          position={menuPosition}
          onClose={() => setOpenFolder(null)}
        />
      )}
    </>
  );
}

