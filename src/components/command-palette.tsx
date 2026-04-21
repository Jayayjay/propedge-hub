"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Target, History, Bell, Settings,
  BookOpen, Plus, BarChart3, LogOut, Sun, Moon, ArrowRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCommandPaletteStore } from "@/lib/command-palette-store";
import { useChallengesList } from "@/hooks/use-app-data";
import { useChallengeStore } from "@/lib/challenge-store";
import { signOutAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  section: "Navigation" | "Actions" | "Challenges" | "Preferences";
  run: () => void;
  keywords?: string;
};

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, close, toggle } = useCommandPaletteStore();
  const { theme, setTheme } = useTheme();
  const { data: challenges = [] } = useChallengesList();
  const setSelected = useChallengeStore((s) => s.setSelected);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, toggle, close]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const go = (path: string) => {
    close();
    router.push(path);
  };

  const commands: Command[] = useMemo(() => {
    const nav: Command[] = [
      { id: "nav-dashboard",  section: "Navigation", label: "Dashboard",       icon: LayoutDashboard, run: () => go("/dashboard"),            keywords: "home" },
      { id: "nav-challenges", section: "Navigation", label: "My Challenges",   icon: Target,          run: () => go("/dashboard/challenges"), keywords: "firms phases" },
      { id: "nav-analytics",  section: "Navigation", label: "Analytics",       icon: BarChart3,       run: () => go("/dashboard/analytics"),  keywords: "stats metrics" },
      { id: "nav-history",    section: "Navigation", label: "Trade History",   icon: History,         run: () => go("/dashboard/history"),    keywords: "trades past" },
      { id: "nav-alerts",     section: "Navigation", label: "Alerts",          icon: Bell,            run: () => go("/dashboard/alerts"),     keywords: "notifications" },
      { id: "nav-journal",    section: "Navigation", label: "Trade Journal",   icon: BookOpen,        run: () => go("/dashboard/journal"),    keywords: "notes diary" },
      { id: "nav-settings",   section: "Navigation", label: "Settings",        icon: Settings,        run: () => go("/dashboard/settings"),   keywords: "profile account" },
    ];

    const actions: Command[] = [
      { id: "act-new-challenge", section: "Actions", label: "New challenge",   hint: "Create", icon: Plus,    run: () => go("/dashboard/challenges?new=1") },
      { id: "act-signout",       section: "Actions", label: "Sign out",        icon: LogOut,  run: () => { close(); signOutAction(); } },
    ];

    const prefs: Command[] = [
      {
        id: "pref-theme-dark",
        section: "Preferences",
        label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        icon: theme === "dark" ? Sun : Moon,
        run: () => { setTheme(theme === "dark" ? "light" : "dark"); close(); },
      },
    ];

    const chal: Command[] = challenges.map((c) => ({
      id: `challenge-${c.id}`,
      section: "Challenges",
      label: c.firm,
      hint: `${c.phase === "phase1" ? "Phase 1" : c.phase === "phase2" ? "Phase 2" : "Funded"} · $${(c.accountSize / 1000).toFixed(0)}K`,
      icon: Target,
      keywords: c.firm + " " + c.phase + " " + c.status,
      run: () => { setSelected(c.id); go("/dashboard"); },
    }));

    return [...nav, ...chal, ...actions, ...prefs];
  }, [challenges, theme, setTheme, setSelected, close, router]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) =>
      c.label.toLowerCase().includes(q) ||
      (c.hint ?? "").toLowerCase().includes(q) ||
      (c.keywords ?? "").toLowerCase().includes(q),
    );
  }, [commands, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIndex]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, c) => {
    (acc[c.section] ||= []).push(c);
    return acc;
  }, {});

  const flatIndex: Map<string, number> = new Map();
  filtered.forEach((c, i) => flatIndex.set(c.id, i));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[activeIndex]?.run();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-xl overflow-hidden shadow-2xl animate-cmd-fade-in"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-faint)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a page, challenge, or action…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-mono shrink-0"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            ESC
          </kbd>
        </div>

        {/* List */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs" style={{ color: "var(--text-faint)" }}>
              No matches for &ldquo;{query}&rdquo;
            </p>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section} className="px-1 py-1">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                  {section}
                </p>
                {items.map((cmd) => {
                  const idx = flatIndex.get(cmd.id) ?? 0;
                  const isActive = idx === activeIndex;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      data-index={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => cmd.run()}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive ? "bg-white/8" : "hover:bg-white/5",
                      )}
                      style={{ color: "var(--text)" }}
                    >
                      <Icon className="h-4 w-4 shrink-0" style={{ color: isActive ? "var(--text)" : "var(--text-muted)" }} />
                      <span className="flex-1 text-left truncate">{cmd.label}</span>
                      {cmd.hint && (
                        <span className="text-[11px] shrink-0" style={{ color: "var(--text-faint)" }}>
                          {cmd.hint}
                        </span>
                      )}
                      {isActive && <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div
          className="flex items-center justify-between border-t px-4 py-2 text-[10px]"
          style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded px-1 py-px font-mono" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded px-1 py-px font-mono" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>↵</kbd>
              Select
            </span>
          </div>
          <span>PropEdge ⌘K</span>
        </div>
      </div>
    </div>
  );
}
