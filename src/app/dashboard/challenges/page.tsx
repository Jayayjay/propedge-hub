"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Target, Calendar, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockChallengesList } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type TabKey = "active" | "completed";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "warning" | "destructive" | "secondary" | "info" }> = {
  active: { label: "Active", variant: "default" },
  passed: { label: "Passed", variant: "info" },
  failed: { label: "Failed", variant: "destructive" },
  funded: { label: "Funded", variant: "default" },
};

const FIRM_COLORS: Record<string, string> = {
  FTUK: "#6366F1",
  FunderPro: "#F59E0B",
  "E8 Markets": "#3B82F6",
  "Nova Funded": "#22C55E",
};

export default function ChallengesPage() {
  const [tab, setTab] = useState<TabKey>("active");

  const filtered = mockChallengesList.filter((c) =>
    tab === "active" ? c.status === "active" : c.status !== "active"
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#F1F1F1]">My Challenges</h1>
          <p className="text-sm text-[#555] mt-0.5">{mockChallengesList.filter((c) => c.status === "active").length} active challenges across {new Set(mockChallengesList.map((c) => c.firm)).size} firms</p>
        </div>
        <Button className="gap-2">
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
              ({mockChallengesList.filter((c) => (t === "active" ? c.status === "active" : c.status !== "active")).length})
            </span>
          </button>
        ))}
      </div>

      {/* Challenge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => {
          const firmColor = FIRM_COLORS[c.firm] ?? "#888";
          const profitPct = (c.profit / c.target) * 100;
          const ddPct = (c.maxDD / c.maxDDLimit) * 100;
          const isActive = c.status === "active";

          return (
            <Card key={c.id} className={cn("relative overflow-hidden hover:border-white/10 transition-colors cursor-pointer", !isActive && "opacity-70")}>
              {/* firm color bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: firmColor }} />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold text-black" style={{ background: firmColor }}>
                        {c.firm.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#F1F1F1]">{c.firm}</p>
                        <p className="text-[11px] text-[#555]">{c.phase}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={STATUS_BADGE[c.status]?.variant ?? "secondary"}>
                      {STATUS_BADGE[c.status]?.label ?? c.status}
                    </Badge>
                    <p className="text-xs text-[#555] mt-1">${c.accountSize.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Profit progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1 text-[#888]">
                      <TrendingUp className="h-3 w-3" /> Profit
                    </span>
                    <span className={cn("font-semibold", c.profit >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                      {c.profit.toFixed(1)}% / {c.target}%
                    </span>
                  </div>
                  <Progress value={profitPct} className="h-1.5" />
                </div>

                {/* Drawdown progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1 text-[#888]">
                      <ShieldAlert className="h-3 w-3" /> Drawdown
                    </span>
                    <span className={cn("font-semibold", ddPct > 65 ? "text-[#F59E0B]" : "text-[#888]")}>
                      {c.maxDD.toFixed(1)}% / {c.maxDDLimit}%
                    </span>
                  </div>
                  <Progress
                    value={ddPct}
                    className="h-1.5"
                    indicatorClassName={ddPct > 65 ? "bg-[#F59E0B]" : "bg-[#555]"}
                  />
                </div>

                {/* Footer meta */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-[#555]">
                    <Calendar className="h-3 w-3" />
                    Started {c.startDate}
                  </div>
                  {isActive && c.daysLeft > 0 && (
                    <span className="text-[11px] text-[#555]">{c.daysLeft} days left</span>
                  )}
                  {!isActive && (
                    <span className={cn("text-[11px] font-medium",
                      c.status === "passed" ? "text-[#3B82F6]" : "text-[#EF4444]"
                    )}>
                      {c.status === "passed" ? "✓ Passed" : "✗ Failed"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#555]">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No {tab} challenges yet.</p>
          <Button variant="ghost" className="mt-3 text-[#22C55E]">
            <Plus className="h-4 w-4 mr-1" /> Add your first challenge
          </Button>
        </div>
      )}
    </div>
  );
}
