"use client";

import { useLiveSnapshot, useEquityCurve, useTrades, resolveSnapshot } from "@/hooks/use-live-data";
import { KpiCard } from "@/components/prop-tracker/kpi-card";
import { EquityChart } from "@/components/prop-tracker/equity-chart";
import { TradesTable } from "@/components/prop-tracker/trades-table";
import { RulesPanel } from "@/components/prop-tracker/rules-panel";
import { formatCurrency, getRiskColor } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { mockEquityCurve } from "@/lib/mock-data";

const CHALLENGE_ID = 1; // TODO: drive from user session / URL param

export function LiveDashboard() {
  const liveQuery   = useLiveSnapshot(CHALLENGE_ID);
  const equityQuery = useEquityCurve(CHALLENGE_ID);
  const tradesQuery = useTrades(CHALLENGE_ID, 10);

  const c          = resolveSnapshot(liveQuery.data);
  const equityData = equityQuery.data ?? (mockEquityCurve as any);
  const trades     = tradesQuery.data?.trades ?? [];

  const ddColor    = getRiskColor(c.maxDrawdown, c.maxDrawdownLimit);
  const dailyColor = getRiskColor(Math.abs(c.dailyLoss), c.dailyLossLimit);

  const isLive    = (liveQuery.data?.equity ?? null) !== null;
  const isError   = liveQuery.isError;
  const lastSync  = liveQuery.data?.mt5LastSync
    ? new Date(liveQuery.data.mt5LastSync).toLocaleTimeString()
    : null;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>
            {c.firm} · {c.phase} · Started {c.startDate ?? "—"}
          </p>
        </div>

        {/* Sync status badge */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          {isError ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" />
              <span style={{ color: "var(--text-muted)" }}>API error</span>
            </>
          ) : isLive ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-[#22C55E]" />
              <span className="text-[#22C55E] font-medium">MT5 Live</span>
              {lastSync && (
                <span style={{ color: "var(--text-faint)" }}>· {lastSync}</span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-[#555]" />
              <span style={{ color: "var(--text-faint)" }}>Demo data · connect MT5 to go live</span>
            </>
          )}
          {liveQuery.isFetching && (
            <RefreshCw className="h-3 w-3 animate-spin" style={{ color: "var(--text-faint)" }} />
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          title="Current Equity"
          value={formatCurrency(c.currentEquity, true)}
          subValue={`Account: ${formatCurrency(c.accountSize, true)}`}
          trend={(c.currentEquity - c.startingBalance) / c.startingBalance * 100}
          status="safe"
        />
        <KpiCard
          title="Daily Loss"
          value={`${Math.abs(c.dailyLoss).toFixed(2)}%`}
          subValue={`Limit: ${c.dailyLossLimit}% / ${formatCurrency(c.accountSize * c.dailyLossLimit / 100)}`}
          status={Math.abs(c.dailyLoss) / c.dailyLossLimit > 0.65 ? "warning" : "safe"}
          ring={{ value: Math.abs(c.dailyLoss), max: c.dailyLossLimit, color: dailyColor }}
        />
        <KpiCard
          title="Max Drawdown"
          value={`${c.maxDrawdown.toFixed(2)}%`}
          subValue={`Buffer: ${(c.maxDrawdownLimit - c.maxDrawdown).toFixed(2)}% remaining`}
          status={c.maxDrawdown / c.maxDrawdownLimit > 0.65 ? "warning" : "safe"}
          ring={{ value: c.maxDrawdown, max: c.maxDrawdownLimit, color: ddColor }}
        />
        <KpiCard
          title="Profit Target"
          value={`${c.profitAchieved.toFixed(2)}%`}
          subValue={`Target: ${c.profitTarget}%`}
          status="safe"
          ring={{ value: c.profitAchieved, max: c.profitTarget, color: "#22C55E" }}
        />
      </div>

      {/* Chart + right panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-3 md:gap-4">
        <div className="space-y-4">
          <EquityChart
            data={equityData}
            startingBalance={c.startingBalance}
            isLive={isLive}
            isLoading={equityQuery.isFetching && !equityQuery.data}
          />
          <TradesTable
            trades={trades as any}
            isLoading={tradesQuery.isFetching && !tradesQuery.data}
          />
        </div>
        <div>
          <RulesPanel />
        </div>
      </div>
    </div>
  );
}
