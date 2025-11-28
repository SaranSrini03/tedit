import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-lg shadow-black/30",
        className,
      )}
      {...props}
    />
  );
}

