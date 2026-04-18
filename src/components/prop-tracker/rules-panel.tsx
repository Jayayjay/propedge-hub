import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Plug, FileDown } from "lucide-react";
import { mockChallenge } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const rules = [
  {
    label: "Daily Loss Limit",
    value: Math.abs(mockChallenge.dailyLoss),
    limit: mockChallenge.dailyLossLimit,
    unit: "%",
    status: "safe",
  },
  {
    label: "Max Drawdown",
    value: mockChallenge.maxDrawdown,
    limit: mockChallenge.maxDrawdownLimit,
    unit: "%",
    status: mockChallenge.maxDrawdown / mockChallenge.maxDrawdownLimit > 0.65 ? "warning" : "safe",
  },
  {
    label: "Profit Target",
    value: mockChallenge.profitAchieved,
    limit: mockChallenge.profitTarget,
    unit: "%",
    status: "safe",
    inverse: true,
  },
  {
    label: "Min Trading Days",
    value: mockChallenge.tradingDays,
    limit: mockChallenge.minTradingDays,
    unit: " days",
    status: "safe",
    inverse: true,
  },
];

export function RulesPanel() {
  const breachRisk = rules.some((r) => r.status === "warning" || r.status === "danger");

  return (
    <div className="space-y-3">
      {/* Active Firm Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rules · FTUK Phase 2</CardTitle>
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
                    {rule.value}{rule.unit} / {rule.limit}{rule.unit}
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
                  Max drawdown at {((mockChallenge.maxDrawdown / mockChallenge.maxDrawdownLimit) * 100).toFixed(0)}% of limit. Reduce position sizes.
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
          <Button variant="secondary" size="sm" className="w-full justify-start gap-2">
            <Plug className="h-3.5 w-3.5" />
            Connect MT5 Account
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
