"use client";

import { useEffect } from "react";
import { LiveDashboard } from "@/components/prop-tracker/live-dashboard";
import { DashboardSkeleton } from "@/components/prop-tracker/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { useChallengesList } from "@/hooks/use-app-data";
import { useChallengeStore } from "@/lib/challenge-store";

export default function DashboardPage() {
  const { data: challenges, isLoading } = useChallengesList();
  const { selectedId, setSelected } = useChallengeStore();

  const active = (challenges ?? []).filter((c) => c.status === "active");
  const current = active.find((c) => c.id === selectedId) ?? active[0] ?? null;

  useEffect(() => {
    if (current && current.id !== selectedId) {
      setSelected(current.id);
    }
  }, [current, selectedId, setSelected]);

  if (isLoading) return <DashboardSkeleton />;

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="relative">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <Target className="h-7 w-7" style={{ color: "var(--text-faint)" }} />
          </div>
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#22C55E] animate-pulse ring-4" style={{ ["--tw-ring-color" as string]: "var(--bg)" }} />
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text)" }}>Ready when you are</p>
          <p className="text-sm mt-1 max-w-sm" style={{ color: "var(--text-muted)" }}>
            Add your first prop firm challenge. We&apos;ll start tracking drawdown, profit target, and rule compliance automatically.
          </p>
        </div>
        <Button asChild className="gap-2 mt-2">
          <Link href="/dashboard/challenges?new=1">
            <Plus className="h-4 w-4" />
            Add Your First Challenge
          </Link>
        </Button>
        <Link
          href="/demo"
          className="text-xs underline underline-offset-4"
          style={{ color: "var(--text-faint)" }}
        >
          Or explore the demo dashboard →
        </Link>
      </div>
    );
  }

  return <LiveDashboard challengeId={current.id} />;
}
