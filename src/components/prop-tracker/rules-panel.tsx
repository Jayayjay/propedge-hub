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
    <div className="space-y-4">
      {/* Active Firm Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Active Rules · FTUK Phase 2
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((rule) => {
            const pct = rule.inverse
              ? Math.min((rule.value / rule.limit) * 100, 100)
              : (rule.value / rule.limit) * 100;
            const isPassed = rule.inverse && rule.value >= rule.limit;
            const isBreach = !rule.inverse && rule.value / rule.limit >= 1;

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
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                    )}
                    <span className="text-[#ccc]">{rule.label}</span>
                  </div>
                  <span className={cn("font-mono font-medium",
                    rule.status === "warning" ? "text-[#F59E0B]" :
                    isBreach ? "text-[#EF4444]" :
                    isPassed ? "text-[#22C55E]" : "text-[#888]"
                  )}>
                    {rule.value}{rule.unit} / {rule.limit}{rule.unit}
                  </span>
                </div>
                <Progress
                  value={Math.min(pct, 100)}
                  className="h-1.5"
                  indicatorClassName={cn(
                    rule.status === "warning" && !rule.inverse ? "bg-[#F59E0B]" :
                    isBreach ? "bg-[#EF4444]" :
                    isPassed ? "bg-[#22C55E]" : "bg-[#22C55E]"
                  )}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Breach Risk Alert */}
      {breachRisk && (
        <Card className="border-[#F59E0B]/20 bg-[#F59E0B]/5">
          <CardContent className="pt-4">
            <div className="flex gap-2.5">
              <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#F59E0B]">Breach Risk Detected</p>
                <p className="text-xs text-[#888] mt-0.5">
                  Max drawdown is at {((mockChallenge.maxDrawdown / mockChallenge.maxDrawdownLimit) * 100).toFixed(0)}% of limit. Reduce position sizes or close trades.
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
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Plug className="h-3.5 w-3.5 text-[#22C55E]" />
            Connect MT5 Account
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <FileDown className="h-3.5 w-3.5 text-[#888]" />
            Export PDF Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
