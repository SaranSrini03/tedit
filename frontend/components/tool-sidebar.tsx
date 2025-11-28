"use client";

import { Button } from "@/components/ui/button";
import { toolset } from "@/lib/constants";
import type { ToolId } from "@/lib/types";

interface ToolSidebarProps {
  activeTool: ToolId;
  onToolSelect: (tool: ToolId) => void;
}

export function ToolSidebar({ activeTool, onToolSelect }: ToolSidebarProps) {
  return (
    <aside className="flex w-20 flex-col border-r border-white/10 bg-black/70 px-3 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur">
      <div className="flex items-center justify-center pb-5 text-[10px] uppercase tracking-[0.35em] text-slate-500">
        Tools
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center gap-3 pb-6">
          {toolset.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <Button
                key={tool.id}
                variant="ghost"
                data-active={isActive}
                onClick={() => onToolSelect(tool.id)}
                className={`h-12 w-12 rounded-2xl border px-0 transition ${
                  isActive
                    ? "border-white bg-white text-black"
                    : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-black" : "text-white"}`} />
              </Button>
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
  );
}

