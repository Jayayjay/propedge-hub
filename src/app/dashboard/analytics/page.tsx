"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Target, Activity, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Trade = {
  id: number;
  firm: string;
  symbol: string;
  type: string;
  lots: number;
  profit: number;
  closeTime: string | null;
};

type Stats = {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  bestTrade: number;
};

const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#A855F7", "#EF4444", "#06B6D4", "#EC4899"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2.5 shadow-xl text-xs min-w-[120px]"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      {label !== undefined && (
        <p className="mb-1" style={{ color: "var(--text-faint)" }}>{label}</p>
      )}
      {payload.map((p: { name: string; value: number; color?: string }, i: number) => (
        <div key={i} className="flex items-center gap-2">
          {p.color && <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />}
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {formatter ? formatter(p.value) : p.value}
          </span>
          {p.name && <span style={{ color: "var(--text-faint)" }}>{p.name}</span>}
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0, wins: 0, losses: 0, winRate: 0, netPnl: 0, bestTrade: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/trades")
      .then((r) => r.json())
      .then((data) => {
        setTrades(data.trades ?? []);
        setStats(data.stats ?? { total: 0, wins: 0, losses: 0, winRate: 0, netPnl: 0, bestTrade: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  // Sort chronologically for time-series
  const sorted = useMemo(
    () => [...trades].filter((t) => t.closeTime).sort(
      (a, b) => new Date(a.closeTime!).getTime() - new Date(b.closeTime!).getTime(),
    ),
    [trades],
  );

  // Equity curve & running drawdown
  const equitySeries = useMemo(() => {
    let cum = 0;
    let peak = 0;
    return sorted.map((t, i) => {
      cum += t.profit;
      if (cum > peak) peak = cum;
      const dd = peak - cum;
      return {
        idx: i + 1,
        date: t.closeTime ? new Date(t.closeTime).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "",
        equity: Math.round(cum * 100) / 100,
        drawdown: -Math.round(dd * 100) / 100,
      };
    });
  }, [sorted]);

  // Rolling win-rate (last 10)
  const rollingWinRate = useMemo(() => {
    const win: number[] = [];
    return sorted.map((t, i) => {
      win.push(t.profit > 0 ? 1 : 0);
      const window = win.slice(Math.max(0, i - 9));
      const rate = Math.round((window.reduce((s, x) => s + x, 0) / window.length) * 100);
      return {
        idx: i + 1,
        date: t.closeTime ? new Date(t.closeTime).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "",
        rate,
      };
    });
  }, [sorted]);

  // P&L distribution (binned)
  const pnlBuckets = useMemo(() => {
    if (trades.length === 0) return [];
    const buckets: Record<string, number> = {
      "< -$500": 0,
      "-$500 to -$200": 0,
      "-$200 to -$50": 0,
      "-$50 to $0": 0,
      "$0 to $50": 0,
      "$50 to $200": 0,
      "$200 to $500": 0,
      "> $500": 0,
    };
    trades.forEach((t) => {
      const p = t.profit;
      if (p < -500) buckets["< -$500"]++;
      else if (p < -200) buckets["-$500 to -$200"]++;
      else if (p < -50) buckets["-$200 to -$50"]++;
      else if (p < 0) buckets["-$50 to $0"]++;
      else if (p < 50) buckets["$0 to $50"]++;
      else if (p < 200) buckets["$50 to $200"]++;
      else if (p < 500) buckets["$200 to $500"]++;
      else buckets["> $500"]++;
    });
    return Object.entries(buckets).map(([bucket, count]) => ({
      bucket,
      count,
      isLoss: bucket.includes("-") || bucket.includes("< -"),
    }));
  }, [trades]);

  // Symbol breakdown
  const bySymbol = useMemo(() => {
    const map = new Map<string, { trades: number; pnl: number }>();
    trades.forEach((t) => {
      const prev = map.get(t.symbol) ?? { trades: 0, pnl: 0 };
      map.set(t.symbol, { trades: prev.trades + 1, pnl: prev.pnl + t.profit });
    });
    return [...map.entries()]
      .map(([symbol, v]) => ({ symbol, trades: v.trades, pnl: Math.round(v.pnl * 100) / 100 }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 7);
  }, [trades]);

  // Day-of-week performance
  const byDay = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totals = days.map((d) => ({ day: d, pnl: 0, trades: 0 }));
    trades.forEach((t) => {
      if (!t.closeTime) return;
      const dow = new Date(t.closeTime).getDay();
      totals[dow].pnl += t.profit;
      totals[dow].trades += 1;
    });
    return totals.map((d) => ({ ...d, pnl: Math.round(d.pnl * 100) / 100 }));
  }, [trades]);

  // Max drawdown figure
  const maxDrawdown = useMemo(
    () => equitySeries.reduce((m, p) => Math.min(m, p.drawdown), 0),
    [equitySeries],
  );

  // Avg win / avg loss / R:R
  const rMultiples = useMemo(() => {
    const wins = trades.filter((t) => t.profit > 0);
    const losses = trades.filter((t) => t.profit < 0);
    const avgWin = wins.length ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.profit, 0) / losses.length) : 0;
    const rr = avgLoss > 0 ? avgWin / avgLoss : 0;
    const profitFactor = avgLoss > 0 && losses.length
      ? wins.reduce((s, t) => s + t.profit, 0) / Math.abs(losses.reduce((s, t) => s + t.profit, 0))
      : 0;
    const expectancy = trades.length ? stats.netPnl / trades.length : 0;
    return {
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      rr: Math.round(rr * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
    };
  }, [trades, stats.netPnl]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>
            Performance breakdown across all your challenges
          </p>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[#333]" />
            <p className="text-sm" style={{ color: "var(--text)" }}>No trades yet</p>
            <p className="text-xs mt-1 mb-6" style={{ color: "var(--text-faint)" }}>
              Connect an MT5 account and start trading to see your edge unfold here.
            </p>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/dashboard/settings">
                Connect MT5
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topCards = [
    { label: "Net P&L", value: `${stats.netPnl >= 0 ? "+" : ""}${formatCurrency(stats.netPnl)}`, accent: stats.netPnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]" },
    { label: "Win Rate", value: `${stats.winRate}%`, accent: "" },
    { label: "Avg R:R", value: rMultiples.rr.toFixed(2), accent: rMultiples.rr >= 1 ? "text-[#22C55E]" : "text-[#EF4444]" },
    { label: "Max Drawdown", value: formatCurrency(Math.abs(maxDrawdown)), accent: "text-[#EF4444]" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>
          {stats.total} trade{stats.total === 1 ? "" : "s"} · performance breakdown across all challenges
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4">
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{c.label}</p>
              <p className={`text-xl font-bold mt-1 ${c.accent}`} style={c.accent ? undefined : { color: "var(--text)" }}>
                {c.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equity + drawdown */}
      <Card>
        <CardHeader className="flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
              Equity Curve & Drawdown
            </CardTitle>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              Cumulative P&L (green) overlaid with running drawdown (red)
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>Peak</p>
              <p className="text-sm font-semibold text-[#22C55E]">
                {formatCurrency(Math.max(0, ...equitySeries.map((p) => p.equity)))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>Max DD</p>
              <p className="text-sm font-semibold text-[#EF4444]">
                {formatCurrency(Math.abs(maxDrawdown))}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4 pt-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={equitySeries} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(equitySeries.length / 7))}
              />
              <YAxis
                tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                width={48}
              />
              <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="equity" stroke="#22C55E" strokeWidth={1.5} fill="url(#equityGrad)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="drawdown" stroke="#EF4444" strokeWidth={1} fill="url(#ddGrad)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Win-rate curve + P&L distribution */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
              Rolling Win Rate
            </CardTitle>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              10-trade rolling window · current {rollingWinRate[rollingWinRate.length - 1]?.rate ?? 0}%
            </p>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={rollingWinRate} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="winRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.floor(rollingWinRate.length / 6))}
                />
                <YAxis
                  tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  width={36}
                />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v}%`} />} />
                <ReferenceLine y={50} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={1.5} fill="url(#winRateGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
              P&L Distribution
            </CardTitle>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Avg win <span className="text-[#22C55E] font-medium">{formatCurrency(rMultiples.avgWin)}</span>
              {" · "}
              Avg loss <span className="text-[#EF4444] font-medium">{formatCurrency(rMultiples.avgLoss)}</span>
              {" · "}
              PF <span style={{ color: "var(--text)" }} className="font-medium">{rMultiples.profitFactor.toFixed(2)}</span>
            </p>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pnlBuckets} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fill: "var(--text-faint)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {pnlBuckets.map((b, i) => (
                    <Cell key={i} fill={b.isLoss ? "#EF4444" : "#22C55E"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Day of week + symbol breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Day of Week Performance</CardTitle>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Net P&L by weekday
            </p>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDay} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--text-faint)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "var(--text-faint)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                  width={46}
                />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {byDay.map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? "#22C55E" : "#EF4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top Symbols</CardTitle>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Most-traded instruments
            </p>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={bySymbol}
                    dataKey="trades"
                    nameKey="symbol"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {bySymbol.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--surface)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-1.5 text-xs">
                {bySymbol.map((s, i) => (
                  <li key={s.symbol} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="font-medium truncate" style={{ color: "var(--text)" }}>{s.symbol}</span>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-auto">{s.trades}</Badge>
                    <span className={`font-semibold tabular-nums w-16 text-right ${s.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {s.pnl >= 0 ? "+" : ""}{formatCurrency(s.pnl)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expectancy footnote */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Expectancy</p>
              <p className={`text-sm font-bold mt-0.5 ${rMultiples.expectancy >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                {rMultiples.expectancy >= 0 ? "+" : ""}{formatCurrency(rMultiples.expectancy)}/trade
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Profit Factor</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text)" }}>{rMultiples.profitFactor.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Avg Win</p>
              <p className="text-sm font-bold mt-0.5 text-[#22C55E]">{formatCurrency(rMultiples.avgWin)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Avg Loss</p>
              <p className="text-sm font-bold mt-0.5 text-[#EF4444]">{formatCurrency(rMultiples.avgLoss)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
