"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Target, History, Bell, Settings,
  TrendingUp, ChevronRight, LogOut, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSidebarStore } from "@/lib/sidebar-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/challenges", label: "My Challenges", icon: Target, badge: "3" },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell, badge: "2", badgeVariant: "destructive" as const },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebarStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-60 flex flex-col border-r transition-transform duration-200",
        // Desktop: always visible. Mobile: slide in when open
        "md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22C55E]">
            <TrendingUp className="h-4 w-4 text-black" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>PropEdge</span>
            <span className="ml-0.5 text-[10px] text-[#22C55E] font-semibold uppercase tracking-widest block -mt-0.5">Hub</span>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={close}
          className="md:hidden p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: "var(--text-faint)" }}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-2 pb-1" style={{ color: "var(--text-faint)" }}>
          Prop Tracker
        </p>
        {navItems.map(({ href, label, icon: Icon, badge, badgeVariant }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all group",
                isActive ? "bg-[#22C55E]/10 text-[#22C55E]" : "hover:bg-black/5 dark:hover:bg-white/5"
              )}
              style={!isActive ? { color: "var(--text-muted)" } : {}}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#22C55E]" : "")} />
              <span className="flex-1">{label}</span>
              {badge && (
                <Badge variant={badgeVariant ?? "secondary"} className="h-5 min-w-5 text-[10px] px-1.5">
                  {badge}
                </Badge>
              )}
              {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
            </Link>
          );
        })}

        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-1" style={{ color: "var(--text-faint)" }}>
          Tools
        </p>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm" style={{ color: "var(--text-faint)" }}>
          <TrendingUp className="h-4 w-4 shrink-0" />
          <span className="flex-1">Trade Journal</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}>
            Soon
          </span>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <ThemeToggle />
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>Toggle theme</span>
        </div>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group transition-colors">
          <div className="h-7 w-7 rounded-full bg-[#22C55E]/15 flex items-center justify-center text-xs font-bold text-[#22C55E]">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>User</p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-faint)" }}>Free Plan</p>
          </div>
          <LogOut className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} />
        </div>
      </div>
    </aside>
  );
}
