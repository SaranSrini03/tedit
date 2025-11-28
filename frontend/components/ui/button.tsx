import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "toolbar";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-sky-500 text-white hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400",
  outline:
    "border border-slate-700 text-slate-100 hover:bg-slate-800 disabled:text-slate-500",
  ghost:
    "text-slate-200 hover:bg-slate-800 disabled:text-slate-500 disabled:hover:bg-transparent",
  toolbar:
    "bg-slate-800 text-slate-100 hover:bg-slate-700 data-[active=true]:bg-sky-500 data-[active=true]:text-white",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed",
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

