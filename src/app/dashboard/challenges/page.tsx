"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingUp, ShieldAlert, Calendar, Target, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type TabKey = "active" | "completed";

type Challenge = {
  id: number;
  firm: string;
  phase: string;
  accountSize: number;
  profitTarget: number;
  maxDrawdownLimit: number;
  status: string;
  startDate: string | null;
  daysLeft: number | null;
  profitAchieved: number;
  maxDrawdown: number;
  hasLiveData: boolean;
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "warning" | "destructive" | "secondary" | "info" }> = {
  active:    { label: "Active",  variant: "default" },
  passed:    { label: "Passed",  variant: "info" },
  failed:    { label: "Failed",  variant: "destructive" },
  funded:    { label: "Funded",  variant: "default" },
  completed: { label: "Done",    variant: "secondary" },
};

const FIRM_COLORS: Record<string, string> = {
  FTUK: "#6366F1",
  FunderPro: "#F59E0B",
  "E8 Markets": "#3B82F6",
  "Nova Funded": "#22C55E",
  FXIFY: "#EC4899",
  "Funding Pips": "#8B5CF6",
  "The5ers": "#14B8A6",
};

function firmColor(name: string) {
  return FIRM_COLORS[name] ?? "#888";
}

export default function ChallengesPage() {
  const [tab, setTab]           = useState<TabKey>("active");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((data) => setChallenges(data.challenges ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = challenges.filter((c) =>
    tab === "active" ? c.status === "active" : c.status !== "active"
  );
  const activeCount    = challenges.filter((c) => c.status === "active").length;
  const completedCount = challenges.filter((c) => c.status !== "active").length;
  const firmCount      = new Set(challenges.map((c) => c.firm)).size;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>My Challenges</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>
            {loading ? "Loading…" : `${activeCount} active challenge${activeCount !== 1 ? "s" : ""} across ${firmCount} firm${firmCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" />
          New Challenge
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1F1F1F] p-1 rounded-lg w-fit">
        {(["active", "completed"] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
              tab === t
                ? "bg-[#2A2A2A] text-[#F1F1F1] shadow"
                : "text-[#666] hover:text-[#F1F1F1]"
            )}
          >
            {t}
            <span className="ml-2 text-xs opacity-60">
              ({t === "active" ? activeCount : completedCount})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#555]" />
        </div>
      ) : (
        <>
          {/* Challenge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((c) => {
              const color     = firmColor(c.firm);
              const profitPct = c.profitTarget > 0 ? (c.profitAchieved / c.profitTarget) * 100 : 0;
              const ddPct     = c.maxDrawdownLimit > 0 ? (c.maxDrawdown / c.maxDrawdownLimit) * 100 : 0;
              const isActive  = c.status === "active";

              return (
                <Card
                  key={c.id}
                  className={cn(
                    "relative overflow-hidden hover:border-white/10 transition-colors cursor-pointer",
                    !isActive && "opacity-70"
                  )}
                >
                  {/* firm color bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold text-black"
                          style={{ background: color }}
                        >
                          {c.firm.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{c.firm}</p>
                          <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{c.phase}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={STATUS_BADGE[c.status]?.variant ?? "secondary"}>
                          {STATUS_BADGE[c.status]?.label ?? c.status}
                        </Badge>
                        <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                          ${c.accountSize.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Profit progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <TrendingUp className="h-3 w-3" /> Profit
                        </span>
                        <span className={cn("font-semibold", c.profitAchieved >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                          {c.hasLiveData ? `${c.profitAchieved.toFixed(1)}%` : "—"} / {c.profitTarget}%
                        </span>
                      </div>
                      <Progress value={Math.min(profitPct, 100)} className="h-1.5" />
                    </div>

                    {/* Drawdown progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <ShieldAlert className="h-3 w-3" /> Drawdown
                        </span>
                        <span className={cn("font-semibold", ddPct > 65 ? "text-[#F59E0B]" : "text-[#888]")}>
                          {c.hasLiveData ? `${c.maxDrawdown.toFixed(1)}%` : "—"} / {c.maxDrawdownLimit}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(ddPct, 100)}
                        className="h-1.5"
                        indicatorClassName={ddPct > 65 ? "bg-[#F59E0B]" : "bg-[#555]"}
                      />
                    </div>

                    {/* Footer meta */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                        <Calendar className="h-3 w-3" />
                        {c.startDate ? `Started ${c.startDate}` : "No start date"}
                      </div>
                      {isActive && c.daysLeft !== null && c.daysLeft > 0 && (
                        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{c.daysLeft}d left</span>
                      )}
                      {!isActive && (
                        <span className={cn("text-[11px] font-medium",
                          c.status === "passed" || c.status === "funded" ? "text-[#3B82F6]" : "text-[#EF4444]"
                        )}>
                          {c.status === "passed" || c.status === "funded" ? "✓ Passed" : "✗ Failed"}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>
              <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No {tab} challenges yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
