"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { ExportPdfButton } from "@/components/prop-tracker/export-pdf-button";

type Trade = {
  id: number;
  rowNum: number;
  firm: string;
  symbol: string;
  type: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  pips: number;
  profit: number;
  closeTime: string | null;
};

type Stats = {
  total: number;
  winRate: number;
  netPnl: number;
  bestTrade: number;
};

export default function HistoryPage() {
  const [trades, setTrades]   = useState<Trade[]>([]);
  const [stats, setStats]     = useState<Stats>({ total: 0, winRate: 0, netPnl: 0, bestTrade: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/trades")
      .then((r) => r.json())
      .then((data) => {
        setTrades(data.trades ?? []);
        setStats(data.stats ?? { total: 0, winRate: 0, netPnl: 0, bestTrade: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Trades", value: String(stats.total) },
    { label: "Win Rate",     value: `${stats.winRate}%` },
    { label: "Net P&L",      value: `${stats.netPnl >= 0 ? "+" : ""}$${stats.netPnl.toFixed(2)}` },
    { label: "Best Trade",   value: `+$${stats.bestTrade.toFixed(2)}` },
  ];

  const pdfTrades = trades.map((t) => ({
    symbol:    t.symbol,
    type:      t.type,
    lots:      t.lots,
    openPrice: t.openPrice,
    closePrice: t.closePrice,
    pips:      t.pips,
    profit:    t.profit,
    closeTime: t.closeTime ?? "",
  }));

  const pdfStats = {
    total:     String(stats.total),
    winRate:   `${stats.winRate}%`,
    netPnl:    `${stats.netPnl >= 0 ? "+" : ""}$${stats.netPnl.toFixed(2)}`,
    bestTrade: `+$${stats.bestTrade.toFixed(2)}`,
  };

  const totalProfit = trades.reduce((s, t) => s + t.profit, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Trade History</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>Full trade log across all challenges</p>
        </div>
        <ExportPdfButton trades={pdfTrades} stats={pdfStats} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{s.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Trades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#555]" />
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>
              <p className="text-sm">No trades yet. Connect MT5 to start syncing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["#", "Symbol", "Type", "Lots", "Open", "Close", "Pips", "Profit", "Date"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[#555]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => {
                    const isProfit = trade.profit >= 0;
                    const isBuy    = trade.type === "BUY";
                    return (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 text-[#555] text-xs">{trade.rowNum}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>{trade.symbol}</td>
                        <td className="px-4 py-3">
                          <Badge variant={isBuy ? "default" : "destructive"} className="gap-1 text-[10px]">
                            {isBuy ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                            {trade.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[#888]">{trade.lots}</td>
                        <td className="px-4 py-3 text-[#888] font-mono text-xs">{trade.openPrice.toFixed(5)}</td>
                        <td className="px-4 py-3 text-[#888] font-mono text-xs">{trade.closePrice.toFixed(5)}</td>
                        <td className={cn("px-4 py-3 font-medium text-xs", trade.pips >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                          {trade.pips >= 0 ? "+" : ""}{trade.pips}
                        </td>
                        <td className={cn("px-4 py-3 font-semibold", isProfit ? "text-[#22C55E]" : "text-[#EF4444]")}>
                          {isProfit ? "+" : ""}${trade.profit.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-[#555] text-xs">
                          {trade.closeTime ? new Date(trade.closeTime).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/8 bg-white/2">
                    <td colSpan={7} className="px-4 py-3 text-xs font-semibold text-[#888]">Total</td>
                    <td className={cn("px-4 py-3 font-bold", totalProfit >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                      {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
