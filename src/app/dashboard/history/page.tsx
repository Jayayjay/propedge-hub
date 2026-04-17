"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockTrades } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ExportPdfButton } from "@/components/prop-tracker/export-pdf-button";

const stats = [
  { label: "Total Trades", value: "47" },
  { label: "Win Rate", value: "62%" },
  { label: "Net P&L", value: "+$1,284" },
  { label: "Best Trade", value: "+$312" },
];

const pdfStats = { total: "47", winRate: "62%", netPnl: "+$1,284", bestTrade: "+$312" };

export default function HistoryPage() {
  const totalProfit = mockTrades.reduce((sum, t) => sum + t.profit, 0);

  const pdfTrades = mockTrades.map((t) => ({
    symbol: t.symbol,
    type: t.type,
    lots: t.lots,
    openPrice: t.openPrice,
    closePrice: t.closePrice,
    pips: t.pips,
    profit: t.profit,
    closeTime: t.closeTime,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#F1F1F1]">Trade History</h1>
          <p className="text-sm text-[#555] mt-0.5">Full trade log across all challenges</p>
        </div>
        <ExportPdfButton trades={pdfTrades} stats={pdfStats} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-[#555]">{s.label}</p>
              <p className="text-xl font-bold text-[#F1F1F1] mt-1">{s.value}</p>
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
                {mockTrades.map((trade, i) => {
                  const isProfit = trade.profit >= 0;
                  const isBuy = trade.type === "BUY";
                  return (
                    <tr key={trade.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-[#555] text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-[#F1F1F1]">{trade.symbol}</td>
                      <td className="px-4 py-3">
                        <Badge variant={isBuy ? "default" : "destructive"} className="gap-1 text-[10px]">
                          {isBuy ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                          {trade.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#888]">{trade.lots}</td>
                      <td className="px-4 py-3 text-[#888] font-mono text-xs">{trade.openPrice}</td>
                      <td className="px-4 py-3 text-[#888] font-mono text-xs">{trade.closePrice}</td>
                      <td className={cn("px-4 py-3 font-medium text-xs", trade.pips >= 0 ? "text-[#22C55E]" : "text-[#EF4444]")}>
                        {trade.pips >= 0 ? "+" : ""}{trade.pips}
                      </td>
                      <td className={cn("px-4 py-3 font-semibold", isProfit ? "text-[#22C55E]" : "text-[#EF4444]")}>
                        {isProfit ? "+" : ""}${trade.profit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-[#555] text-xs">{trade.closeTime}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
