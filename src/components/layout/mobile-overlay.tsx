"use client";

import { useSidebarStore } from "@/lib/sidebar-store";

export function MobileOverlay() {
  const { open, close } = useSidebarStore();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-30 bg-black/60 md:hidden"
      onClick={close}
      aria-hidden="true"
    />
  );
}
