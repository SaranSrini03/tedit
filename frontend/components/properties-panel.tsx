"use client";

import { Button } from "@/components/ui/button";

interface PropertiesPanelProps {
  canvasWidth: number;
  canvasHeight: number;
}

export function PropertiesPanel({
  canvasWidth,
  canvasHeight,
}: PropertiesPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">
        Canvas properties
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-white">
        <PropertyBlock label="Width" value={`${canvasWidth} px`} />
        <PropertyBlock label="Height" value={`${canvasHeight} px`} />
        <PropertyBlock label="X" value="0 px" />
        <PropertyBlock label="Y" value="0 px" />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">
          Quick actions
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {["Remove background", "Select subject"].map((action) => (
            <Button
              key={action}
              variant="outline"
              className="rounded-full border-white/15 px-4 py-2 text-[10px] tracking-[0.25em] text-white hover:bg-white/10"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PropertyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
        {label}
      </p>
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm font-semibold">
        {value}
      </div>
    </div>
  );
}

