import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Plug, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveSnapshot } from "@/hooks/use-live-data";

interface RulesPanelProps {
  snapshot?: LiveSnapshot | null;
}

export function RulesPanel({ snapshot }: RulesPanelProps) {
  const hasLive = snapshot !== null && snapshot !== undefined;

  const dailyLossVal   = hasLive ? Math.abs(snapshot.dailyLoss  ?? 0) : 0;
  const maxDDVal       = hasLive ? (snapshot.maxDrawdown         ?? 0) : 0;
  const profitVal      = hasLive ? (snapshot.profitAchieved      ?? 0) : 0;
  // minTradingDays: not tracked in liveAccountData, show as 0 / limit
  const tradingDays    = 0;

  const dailyLossLimit  = hasLive ? snapshot.dailyDrawdownLimit : 5;
  const maxDDLimit      = hasLive ? snapshot.maxDrawdownLimit   : 10;
  const profitTarget    = hasLive ? snapshot.profitTarget       : 10;
  const minTradingDays  = hasLive ? (snapshot.minTradingDays ?? 0) : 5;

  const firmLabel = hasLive ? `${snapshot.firm} · ${snapshot.phase}` : "No challenge linked";

  const rules = [
    {
      label: "Daily Loss",
      value: dailyLossVal,
      limit: dailyLossLimit,
      unit: "%",
      status: dailyLossVal / dailyLossLimit > 0.65 ? "warning" : "safe",
      inverse: false,
    },
    {
      label: "Max Drawdown",
      value: maxDDVal,
      limit: maxDDLimit,
      unit: "%",
      status: maxDDVal / maxDDLimit > 0.65 ? "warning" : "safe",
      inverse: false,
    },
    {
      label: "Profit Target",
      value: profitVal,
      limit: profitTarget,
      unit: "%",
      status: "safe" as const,
      inverse: true,
    },
    {
      label: "Min Trading Days",
      value: tradingDays,
      limit: minTradingDays,
      unit: " days",
      status: "safe" as const,
      inverse: true,
    },
  ];

  const breachRisk = rules.some((r) => r.status === "warning" || r.status === "danger");

  return (
    <div className="space-y-3">
      {/* Active Firm Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rules · {firmLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((rule) => {
            const pct = rule.inverse
              ? Math.min((rule.value / rule.limit) * 100, 100)
              : (rule.value / rule.limit) * 100;
            const isPassed = rule.inverse && rule.value >= rule.limit;
            const isBreach = !rule.inverse && rule.value / rule.limit >= 1;

            const statusColor =
              rule.status === "warning" ? "#F59E0B" :
              isBreach ? "#EF4444" :
              isPassed ? "#22C55E" :
              "rgba(255,255,255,0.3)";

            return (
              <div key={rule.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {isPassed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                    ) : isBreach ? (
                      <XCircle className="h-3.5 w-3.5 text-[#EF4444]" />
                    ) : rule.status === "warning" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-white/15 flex items-center justify-center">
                        <div className="h-1 w-1 rounded-full bg-white/20" />
                      </div>
                    )}
                    <span style={{ color: "var(--text-muted)" }}>{rule.label}</span>
                  </div>
                  <span className="font-mono" style={{ color: statusColor }}>
                    {rule.value.toFixed(2)}{rule.unit} / {rule.limit}{rule.unit}
                  </span>
                </div>
                <Progress
                  value={Math.min(pct, 100)}
                  className="h-1"
                  indicatorClassName={cn(
                    rule.status === "warning" && !rule.inverse ? "bg-[#F59E0B]" :
                    isBreach ? "bg-[#EF4444]" :
                    isPassed ? "bg-[#22C55E]" : "bg-white/20"
                  )}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Breach Risk Alert */}
      {breachRisk && (
        <Card style={{ borderColor: "rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.04)" }}>
          <CardContent className="pt-4">
            <div className="flex gap-2.5">
              <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#F59E0B]">Breach Risk Detected</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                  {maxDDVal / maxDDLimit > 0.65
                    ? `Max drawdown at ${((maxDDVal / maxDDLimit) * 100).toFixed(0)}% of limit.`
                    : `Daily loss at ${((dailyLossVal / dailyLossLimit) * 100).toFixed(0)}% of limit.`}{" "}
                  Reduce position sizes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="secondary" size="sm" className="w-full justify-start gap-2" asChild>
            <Link href="/dashboard/settings">
              <Plug className="h-3.5 w-3.5" />
              Connect MT5 Account
            </Link>
          </Button>
          <Button variant="secondary" size="sm" className="w-full justify-start gap-2">
            <FileDown className="h-3.5 w-3.5" />
            Export PDF Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
