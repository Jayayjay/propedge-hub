import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-white/8 bg-[#1A1A1A] px-3 py-2 text-sm text-[#F1F1F1] placeholder:text-[#444] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
