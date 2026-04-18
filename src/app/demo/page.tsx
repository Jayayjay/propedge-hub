"use client";

import Link from "next/link";
import { useState } from "react";
import {
  TrendingUp, TrendingDown, Wifi, CheckCircle2, XCircle,
  AlertTriangle, Bell, Lock, ArrowRight, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mockChallenge, mockTrades, mockAlerts, mockEquityCurve, mockChallengesList } from "@/lib/mock-data";
import { EquityChart } from "@/components/prop-tracker/equity-chart";
import { formatCurrency } from "@/lib/utils";

// ── KPI card (inline, no status color complications) ──────────────────────────
function DemoKpi({
  title, value, sub, trend, ring,
}: {
  title: string;
  value: string;
  sub: string;
  trend?: number;
  ring?: { value: number; max: number };
}) {
  const pct = ring ? Math.min(ring.value / ring.max, 1) : 0;
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-white/10" />
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{sub}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-1.5">
                {trend >= 0
                  ? <TrendingUp className="h-3 w-3 text-[#22C55E]" />
                  : <TrendingDown className="h-3 w-3 text-[#EF4444]" />}
                <span className={`text-xs ${trend >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {trend >= 0 ? "+" : ""}{trend.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          {ring && (
            <div className="relative shrink-0">
              <svg width="54" height="54" className="-rotate-90">
                <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
                <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,0.25)"
                  strokeWidth={4} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                  strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                  {Math.round(pct * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Locked panel overlay ───────────────────────────────────────────────────────
function LockedPanel({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl gap-3"
      style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.55)" }}>
      <Lock className="h-5 w-5" style={{ color: "var(--text-faint)" }} />
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</p>
      <Link href="/signup">
        <Button size="sm" className="gap-1.5 text-xs">Sign up free <ArrowRight className="h-3 w-3" /></Button>
      </Link>
    </div>
  );
}

// ── Main demo page ─────────────────────────────────────────────────────────────
export default function DemoPage() {
  const c = mockChallenge;
  const [activeChallenge, setActiveChallenge] = useState(0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>
            {c.firm} · {c.phase} · Started {c.startDate}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <Wifi className="h-3.5 w-3.5 text-[#22C55E]" />
          <span className="text-[#22C55E] font-medium">MT5 Demo</span>
          <span style={{ color: "var(--text-faint)" }}>· sample data only</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DemoKpi
          title="Current Equity"
          value={formatCurrency(c.currentEquity, true)}
          sub={`Account: ${formatCurrency(c.accountSize, true)}`}
          trend={(c.currentEquity - c.startingBalance) / c.startingBalance * 100}
        />
        <DemoKpi
          title="Daily Loss"
          value={`${Math.abs(c.dailyLoss).toFixed(2)}%`}
          sub={`Limit: ${c.dailyLossLimit}%`}
          ring={{ value: Math.abs(c.dailyLoss), max: c.dailyLossLimit }}
        />
        <DemoKpi
          title="Max Drawdown"
          value={`${c.maxDrawdown.toFixed(2)}%`}
          sub={`Buffer: ${(c.maxDrawdownLimit - c.maxDrawdown).toFixed(2)}% left`}
          ring={{ value: c.maxDrawdown, max: c.maxDrawdownLimit }}
        />
        <DemoKpi
          title="Profit Target"
          value={`${c.profitAchieved.toFixed(2)}%`}
          sub={`Target: ${c.profitTarget}%`}
          ring={{ value: c.profitAchieved, max: c.profitTarget }}
        />
      </div>

      {/* Chart + side panels */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

        <div className="space-y-4">
          {/* Equity chart */}
          <EquityChart
            data={mockEquityCurve as any}
            startingBalance={c.startingBalance}
            isLive={false}
          />

          {/* Recent trades */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle>Recent Trades</CardTitle>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--surface-2)", color: "var(--text-faint)", border: "1px solid var(--border)" }}>
                Sample data
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Symbol", "Type", "Lots", "Open", "Close", "P&L"].map((h) => (
                        <th key={h} className="text-left px-5 py-2.5 font-medium" style={{ color: "var(--text-faint)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockTrades.map((t, i) => (
                      <tr key={t.id} style={{ borderBottom: i < mockTrades.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <td className="px-5 py-2.5 font-mono font-medium" style={{ color: "var(--text)" }}>{t.symbol}</td>
                        <td className="px-5 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${t.type === "BUY" ? "bg-white/8 text-white/60" : "bg-white/4 text-white/30"}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-5 py-2.5" style={{ color: "var(--text-muted)" }}>{t.lots}</td>
                        <td className="px-5 py-2.5 font-mono" style={{ color: "var(--text-muted)" }}>{t.openPrice}</td>
                        <td className="px-5 py-2.5 font-mono" style={{ color: "var(--text-muted)" }}>{t.closePrice}</td>
                        <td className={`px-5 py-2.5 font-semibold ${t.profit >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                          {t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Rules panel */}
          <Card>
            <CardHeader><CardTitle>Active Rules · FTUK Phase 2</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Daily Loss",    value: Math.abs(c.dailyLoss), limit: c.dailyLossLimit, unit: "%", ok: true },
                { label: "Max Drawdown",  value: c.maxDrawdown,         limit: c.maxDrawdownLimit, unit: "%", ok: c.maxDrawdown / c.maxDrawdownLimit < 0.65 },
                { label: "Profit Target", value: c.profitAchieved,      limit: c.profitTarget, unit: "%", ok: true, inverse: true },
                { label: "Trading Days",  value: c.tradingDays,         limit: c.minTradingDays, unit: " days", ok: true, inverse: true },
              ].map((rule) => {
                const pct = Math.min((rule.value / rule.limit) * 100, 100);
                return (
                  <div key={rule.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        {rule.ok
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                          : <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" />}
                        <span style={{ color: "var(--text-muted)" }}>{rule.label}</span>
                      </div>
                      <span className="font-mono" style={{ color: "var(--text-faint)" }}>
                        {rule.value}{rule.unit} / {rule.limit}{rule.unit}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1" indicatorClassName="bg-white/20" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Alerts preview */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5" />
                Recent Alerts
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">{mockAlerts.filter(a => !a.isRead).length} new</Badge>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {mockAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  {alert.type === "warning"
                    ? <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B] shrink-0 mt-0.5" />
                    : alert.type === "success"
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                    : <Bell className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--text-faint)" }} />}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{alert.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>{alert.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sign up CTA */}
          <div className="rounded-xl p-5 text-center"
            style={{ border: "1px solid rgba(255,255,255,0.10)", background: "var(--surface)" }}>
            <BarChart3 className="h-6 w-6 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Connect your MT5</p>
            <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>
              Sign up free to see your real equity, trades, and get alerts before you breach.
            </p>
            <Link href="/signup" className="block">
              <Button className="w-full gap-2 text-xs">
                Start Free — No Card Required <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* All challenges — locked */}
      <Card className="relative overflow-hidden">
        <LockedPanel label="Sign up to track all your challenges" />
        <CardHeader>
          <CardTitle>My Challenges (3 active)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 blur-sm pointer-events-none select-none" aria-hidden>
            {mockChallengesList.slice(0, 4).map((ch) => (
              <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                    {ch.firm.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{ch.firm} · {ch.phase}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>${ch.accountSize.toLocaleString()} account</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[#22C55E]">+{ch.profit}%</p>
                    <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>profit</p>
                  </div>
                  <Badge variant={ch.status === "active" ? "secondary" : ch.status === "passed" ? "default" : "destructive"} className="text-[9px]">
                    {ch.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
