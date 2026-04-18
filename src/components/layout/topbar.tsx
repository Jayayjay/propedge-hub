"use client";

import { useState } from "react";
import { ChevronDown, Bell, Wifi, WifiOff, RefreshCw, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/lib/sidebar-store";

const MT5_CONNECTED = true;

export function Topbar() {
  const [selectedFirm, setSelectedFirm] = useState("FTUK – Phase 2 ($100K)");
  const [open, setOpen] = useState(false);
  const { toggle } = useSidebarStore();

  const firmOptions = [
    "FTUK – Phase 2 ($100K)",
    "FunderPro – Phase 1 ($50K)",
    "E8 Markets – Funded ($200K)",
  ];

  return (
    <header
      className="fixed top-0 left-0 md:left-60 right-0 z-20 h-14 border-b flex items-center px-3 md:px-5 gap-2 md:gap-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 shrink-0"
        onClick={toggle}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
      </Button>

      {/* Challenge selector */}
      <div className="relative flex-1 md:flex-none">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors w-full md:w-auto hover:bg-white/4"
          style={{
            background: "var(--surface-2)",
            border: `1px solid var(--border)`,
            color: "var(--text)",
          }}
        >
          {MT5_CONNECTED && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shrink-0" />
          )}
          <span className="truncate max-w-[140px] md:max-w-none">{selectedFirm}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />
        </button>
        {open && (
          <div
            className="absolute top-full left-0 mt-1 w-72 rounded-xl shadow-2xl overflow-hidden z-50"
            style={{ background: "var(--surface)", border: `1px solid var(--border)` }}
          >
            {firmOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => { setSelectedFirm(opt); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                style={{ color: "var(--text-muted)" }}
              >
                {opt}
              </button>
            ))}
            <div className="border-t px-4 py-2.5" style={{ borderColor: "var(--border)" }}>
              <button className="text-xs text-white/40 hover:text-white transition-colors">+ Add New Challenge</button>
            </div>
          </div>
        )}
      </div>

      {/* MT5 status */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs shrink-0">
        {MT5_CONNECTED ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-[#22C55E]" />
            <span className="text-[#22C55E] font-medium">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} />
            <span style={{ color: "var(--text-faint)" }}>Disconnected</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
        <RefreshCw className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} />
      </Button>

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 relative">
        <Bell className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
      </Button>
    </header>
  );
}
