"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Bell, Wifi, WifiOff, RefreshCw, Menu, Plus, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useChallengeStore } from "@/lib/challenge-store";
import { useCommandPaletteStore } from "@/lib/command-palette-store";
import { useChallengesList, useAlertsCount } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";

const PHASE_LABEL: Record<string, string> = {
  phase1: "Phase 1",
  phase2: "Phase 2",
  funded: "Funded",
};

export function Topbar() {
  const { toggle } = useSidebarStore();
  const { selectedId, setSelected } = useChallengeStore();
  const openCommand = useCommandPaletteStore((s) => s.open);
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading: loadingChallenges } = useChallengesList();
  const { data: alertsInfo } = useAlertsCount();

  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = challenges.filter((c) => c.status === "active");
  const current = challenges.find((c) => c.id === selectedId) ?? active[0] ?? null;

  // Auto-select first active when list loads or selected goes missing
  useEffect(() => {
    if (current && current.id !== selectedId) {
      setSelected(current.id);
    }
  }, [current, selectedId, setSelected]);

  // Click-outside close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["challenges-list"] }),
      queryClient.invalidateQueries({ queryKey: ["alerts-count"] }),
      queryClient.invalidateQueries({ queryKey: ["live"] }),
      queryClient.invalidateQueries({ queryKey: ["equity"] }),
      queryClient.invalidateQueries({ queryKey: ["trades"] }),
    ]);
    setTimeout(() => setRefreshing(false), 400);
  };

  const unread = alertsInfo?.unread ?? 0;
  const mt5Connected = !!current?.hasLiveData;

  const label = current
    ? `${current.firm}${current.phase ? " · " + (PHASE_LABEL[current.phase] ?? current.phase) : ""}${current.accountSize ? ` · $${(current.accountSize / 1000).toFixed(0)}K` : ""}`
    : loadingChallenges
    ? "Loading…"
    : "No challenge";

  return (
    <header
      className="fixed top-0 left-0 md:left-60 right-0 z-20 h-14 border-b flex items-center px-3 md:px-5 gap-2 md:gap-3"
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
      <div ref={ref} className="relative flex-1 md:flex-none min-w-0">
        <button
          onClick={() => setOpen(!open)}
          disabled={challenges.length === 0 && !loadingChallenges}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors w-full md:w-auto hover:bg-white/4 disabled:opacity-60"
          style={{
            background: "var(--surface-2)",
            border: `1px solid var(--border)`,
            color: "var(--text)",
          }}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              mt5Connected ? "bg-[#22C55E]" : "bg-[#555]",
            )}
          />
          <span className="truncate max-w-[160px] md:max-w-[260px]">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />
        </button>
        {open && (
          <div
            className="absolute top-full left-0 mt-1 w-80 rounded-xl shadow-2xl overflow-hidden z-50 animate-cmd-fade-in"
            style={{ background: "var(--surface)", border: `1px solid var(--border)` }}
          >
            <div className="max-h-72 overflow-y-auto">
              {active.length === 0 ? (
                <p className="px-4 py-4 text-xs" style={{ color: "var(--text-faint)" }}>
                  No active challenges.
                </p>
              ) : (
                active.map((c) => {
                  const isCurrent = c.id === current?.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelected(c.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5 flex items-center gap-2",
                        isCurrent && "bg-white/5",
                      )}
                      style={{ color: "var(--text)" }}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          c.hasLiveData ? "bg-[#22C55E]" : "bg-[#555]",
                        )}
                      />
                      <span className="flex-1 truncate">
                        {c.firm}
                        <span className="ml-1.5" style={{ color: "var(--text-faint)" }}>
                          {PHASE_LABEL[c.phase] ?? c.phase} · ${(c.accountSize / 1000).toFixed(0)}K
                        </span>
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                          ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <Link
              href="/dashboard/challenges"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-t px-4 py-2.5 text-xs font-medium hover:bg-white/5 transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add new challenge
            </Link>
          </div>
        )}
      </div>

      {/* MT5 status */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs shrink-0">
        {mt5Connected ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-[#22C55E]" />
            <span className="text-[#22C55E] font-medium">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} />
            <span style={{ color: "var(--text-faint)" }}>Offline</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Search / command palette trigger */}
      <button
        onClick={openCommand}
        className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--text-faint)",
        }}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Quick search…</span>
        <kbd
          className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-mono"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          ⌘K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleRefresh}
        aria-label="Refresh data"
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
          style={{ color: "var(--text-faint)" }}
        />
      </Button>

      <Link href="/dashboard/alerts" aria-label="Alerts">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 relative">
          <Bell className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
          {unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center"
            >
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </Link>
    </header>
  );
}
