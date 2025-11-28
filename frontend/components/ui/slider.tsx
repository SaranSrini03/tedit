import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-300">
        {label}
        <input
          ref={ref}
          type="range"
          className={cn(
            "h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-sky-500",
            className,
          )}
          {...props}
        />
      </label>
    );
  },
);

Slider.displayName = "Slider";

