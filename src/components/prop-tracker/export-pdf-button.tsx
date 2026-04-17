"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export interface TradeRow {
  symbol: string;
  type: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  pips: number;
  profit: number;
  closeTime: string;
}

interface Props {
  trades: TradeRow[];
  stats: { total: string; winRate: string; netPnl: string; bestTrade: string };
  filename?: string;
}

export function ExportPdfButton({ trades, stats, filename = "propedge-trade-report.pdf" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(18);
      doc.setTextColor(22, 163, 74);
      doc.text("PropEdge Hub", 14, 16);

      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Trade History Report", 14, 23);
      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
        14,
        29,
      );

      autoTable(doc, {
        startY: 36,
        head: [["Total Trades", "Win Rate", "Net P&L", "Best Trade"]],
        body: [[stats.total, stats.winRate, stats.netPnl, stats.bestTrade]],
        theme: "grid",
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 10, fontStyle: "bold" },
        tableWidth: 140,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summaryFinalY: number = (doc as any).lastAutoTable?.finalY ?? 55;

      autoTable(doc, {
        startY: summaryFinalY + 10,
        head: [["#", "Symbol", "Type", "Lots", "Open Price", "Close Price", "Pips", "Profit", "Date"]],
        body: trades.map((t, i) => [
          i + 1,
          t.symbol,
          t.type,
          t.lots.toFixed(2),
          t.openPrice.toFixed(5),
          t.closePrice.toFixed(5),
          (t.pips >= 0 ? "+" : "") + t.pips,
          (t.profit >= 0 ? "+" : "") + "$" + t.profit.toFixed(2),
          t.closeTime,
        ]),
        theme: "striped",
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        didParseCell(data) {
          if (data.section === "body" && data.column.index === 7) {
            const val = String(data.cell.raw ?? "");
            if (val.startsWith("+")) data.cell.styles.textColor = [22, 163, 74] as [number, number, number];
            else if (val.startsWith("-")) data.cell.styles.textColor = [239, 68, 68] as [number, number, number];
          }
        },
      });

      doc.save(filename);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="gap-2">
      <Download className="h-4 w-4" />
      {loading ? "Generating…" : "Export PDF"}
    </Button>
  );
}
