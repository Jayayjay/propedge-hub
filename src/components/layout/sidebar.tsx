"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Target, History, Bell, Settings,
  ChevronRight, LogOut, X, BookOpen, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSidebarStore } from "@/lib/sidebar-store";
import { signOutAction } from "@/lib/actions";
import { useChallengesList, useAlertsCount, useUserSettings } from "@/hooks/use-app-data";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

type NavBadge = { count: number; variant: "default" | "destructive" | "secondary" };

export function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebarStore();
  const [pending, startTransition] = useTransition();

  const { data: challenges = [] } = useChallengesList();
  const { data: alertsInfo } = useAlertsCount();
  const { data: user } = useUserSettings();

  const activeCount = challenges.filter((c) => c.status === "active").length;
  const unread = alertsInfo?.unread ?? 0;

  const navItems: Array<{
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: NavBadge;
  }> = [
    { href: "/dashboard",            label: "Dashboard",     icon: LayoutDashboard },
    {
      href: "/dashboard/challenges", label: "My Challenges", icon: Target,
      ...(activeCount > 0 ? { badge: { count: activeCount, variant: "secondary" } as NavBadge } : {}),
    },
    { href: "/dashboard/analytics", label: "Analytics",     icon: BarChart3 },
    { href: "/dashboard/history",   label: "History",       icon: History },
    {
      href: "/dashboard/alerts",    label: "Alerts",        icon: Bell,
      ...(unread > 0 ? { badge: { count: unread, variant: "destructive" } as NavBadge } : {}),
    },
    { href: "/dashboard/settings",  label: "Settings",      icon: Settings },
  ];

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const planLabel = user?.plan ? user.plan[0].toUpperCase() + user.plan.slice(1) : "Free";
  const initials = displayName
    .split(/[\s@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const handleSignOut = () => {
    startTransition(() => {
      signOutAction();
    });
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-60 flex flex-col border-r transition-transform duration-200",
        "md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white transition-transform group-hover:scale-105">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L6 7L9 10L13 4" stroke="black" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text)" }}>
            PropEdge<span style={{ color: "var(--text-faint)" }}>Hub</span>
          </span>
        </Link>
        <button
          onClick={close}
          className="md:hidden p-1 rounded-md hover:bg-white/5"
          style={{ color: "var(--text-faint)" }}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-2 pb-1.5" style={{ color: "var(--text-faint)" }}>
          Prop Tracker
        </p>
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                isActive
                  ? "bg-white/8 text-white"
                  : "hover:bg-white/4 text-[#666] hover:text-[#ccc]"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-[#555]")} />
              <span className="flex-1">{label}</span>
              {badge && (
                <Badge variant={badge.variant} className="h-5 min-w-5 text-[10px] px-1.5">
                  {badge.count > 99 ? "99+" : badge.count}
                </Badge>
              )}
              {isActive && <ChevronRight className="h-3 w-3 text-white/30" />}
            </Link>
          );
        })}

        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-1.5" style={{ color: "var(--text-faint)" }}>
          Tools
        </p>
        {[{ href: "/dashboard/journal", label: "Trade Journal", icon: BookOpen }].map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                isActive
                  ? "bg-white/8 text-white"
                  : "hover:bg-white/4 text-[#666] hover:text-[#ccc]"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-[#555]")} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="h-3 w-3 text-white/30" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/4 transition-colors group"
          title={user?.email ?? undefined}
        >
          <div
            className="h-7 w-7 rounded-full border flex items-center justify-center text-[11px] font-bold"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--surface-2)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{displayName}</p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-faint)" }}>{planLabel} Plan</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={pending}
            className="p-1 rounded-md hover:bg-white/5 transition-colors disabled:opacity-50"
            style={{ color: "var(--text-faint)" }}
            aria-label="Sign out"
            title="Sign out"
          >
            {pending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <LogOut className="h-3.5 w-3.5 group-hover:text-white/60 transition-colors" />
            }
          </button>
        </div>
      </div>
    </aside>
  );
}
