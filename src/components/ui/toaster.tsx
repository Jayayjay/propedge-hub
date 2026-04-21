"use client";

import { useToastStore, type ToastVariant } from "@/lib/toast-store";
import { CheckCircle2, AlertTriangle, Info, X, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANT_MAP: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; ring: string }> = {
  success: { icon: CheckCircle2,  color: "text-[#22C55E]", ring: "ring-[#22C55E]/20" },
  error:   { icon: AlertOctagon,  color: "text-[#EF4444]", ring: "ring-[#EF4444]/20" },
  info:    { icon: Info,          color: "text-[#3B82F6]", ring: "ring-[#3B82F6]/20" },
  warning: { icon: AlertTriangle, color: "text-[#F59E0B]", ring: "ring-[#F59E0B]/20" },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {toasts.map((t) => {
        const { icon: Icon, color, ring } = VARIANT_MAP[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl ring-1 animate-slide-in-right",
              ring,
            )}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 hover:bg-white/5"
              style={{ color: "var(--text-faint)" }}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
