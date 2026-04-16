import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import type { Trade } from "@/hooks/use-live-data";

interface Props {
  trades:     Trade[];
  isLoading?: boolean;
}

export function TradesTable({ trades, isLoading = false }: Props) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          Recent Trades
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-[#22C55E]" />}
        </CardTitle>
        <a href="/dashboard/history" className="text-xs text-[#22C55E] hover:underline">
          View all →
        </a>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["Symbol", "Type", "Lots", "Open", "Close", "Pips", "P&L", "Closed"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-xs font-medium"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const isProfit = trade.profit >= 0;
                const isBuy    = trade.type === "BUY";
                const closeLabel = trade.closeTime
                  ? new Date(trade.closeTime).toLocaleString("en-US", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : "—";

                return (
                  <tr
                    key={trade.id}
                    className="border-b transition-colors"
                    style={{ borderColor: "var(--border-2)" }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--text)" }}>
                      {trade.symbol}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={isBuy ? "default" : "destructive"} className="gap-1">
                        {isBuy
                          ? <ArrowUpRight className="h-2.5 w-2.5" />
                          : <ArrowDownRight className="h-2.5 w-2.5" />}
                        {trade.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {trade.lots}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {trade.openPrice}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {trade.closePrice}
                    </td>
                    <td className={cn("px-5 py-3 font-medium text-xs", trade.pips >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                      {trade.pips >= 0 ? "+" : ""}{trade.pips}
                    </td>
                    <td className={cn("px-5 py-3 font-semibold", isProfit ? "text-[#22C55E]" : "text-[#EF4444]")}>
                      {isProfit ? "+" : ""}${Math.abs(trade.profit).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--text-faint)" }}>
                      {closeLabel}
                    </td>
                  </tr>
                );
              })}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-xs" style={{ color: "var(--text-faint)" }}>
                    No trades yet — connect your MT5 account to start syncing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
