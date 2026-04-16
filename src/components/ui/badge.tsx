import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#22C55E]/15 text-[#22C55E]",
        secondary: "bg-white/10 text-[#F1F1F1]",
        destructive: "bg-[#EF4444]/15 text-[#EF4444]",
        warning: "bg-[#F59E0B]/15 text-[#F59E0B]",
        outline: "border border-white/15 text-[#F1F1F1]",
        info: "bg-[#3B82F6]/15 text-[#3B82F6]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
