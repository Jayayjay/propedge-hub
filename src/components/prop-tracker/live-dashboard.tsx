"use client";

import { useLiveSnapshot, useEquityCurve, useTrades } from "@/hooks/use-live-data";
import { KpiCard } from "@/components/prop-tracker/kpi-card";
import { EquityChart } from "@/components/prop-tracker/equity-chart";
import { TradesTable } from "@/components/prop-tracker/trades-table";
import { RulesPanel } from "@/components/prop-tracker/rules-panel";
import { formatCurrency, getRiskColor } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";

interface LiveDashboardProps {
  challengeId: number;
}

export function LiveDashboard({ challengeId }: LiveDashboardProps) {
  const liveQuery   = useLiveSnapshot(challengeId);
  const equityQuery = useEquityCurve(challengeId);
  const tradesQuery = useTrades(challengeId, 10);

  const c = liveQuery.data;

  // Derived display values — show zeros until data arrives
  const equity         = c?.equity          ?? c?.startingBalance ?? 0;
  const startBal       = c?.startingBalance ?? 0;
  const accountSize    = c?.accountSize     ?? 0;
  const dailyLoss      = Math.abs(c?.dailyLoss       ?? 0);
  const maxDrawdown    = c?.maxDrawdown      ?? 0;
  const profitAchieved = c?.profitAchieved  ?? 0;
  const dailyLossLimit = c?.dailyDrawdownLimit ?? 5;
  const maxDDLimit     = c?.maxDrawdownLimit   ?? 10;
  const profitTarget   = c?.profitTarget       ?? 10;

  const ddColor    = getRiskColor(maxDrawdown, maxDDLimit);
  const dailyColor = getRiskColor(dailyLoss,   dailyLossLimit);

  const isLive  = (c?.equity ?? null) !== null;
  const isError = liveQuery.isError;
  const lastSync = c?.mt5LastSync
    ? new Date(c.mt5LastSync).toLocaleTimeString()
    : null;

  const equityData = equityQuery.data ?? [];
  const trades     = tradesQuery.data?.trades ?? [];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>
            {c ? `${c.firm} · ${c.phase}` : "Loading…"}
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
              {lastSync && <span style={{ color: "var(--text-faint)" }}>· {lastSync}</span>}
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-[#555]" />
              <span style={{ color: "var(--text-faint)" }}>
                {c ? "Awaiting MT5 sync" : "Loading…"}
              </span>
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
          value={formatCurrency(equity, true)}
          subValue={`Account: ${formatCurrency(accountSize, true)}`}
          trend={startBal > 0 ? (equity - startBal) / startBal * 100 : 0}
          status="safe"
        />
        <KpiCard
          title="Daily Loss"
          value={`${dailyLoss.toFixed(2)}%`}
          subValue={`Limit: ${dailyLossLimit}% / ${formatCurrency(accountSize * dailyLossLimit / 100)}`}
          status={dailyLoss / dailyLossLimit > 0.65 ? "warning" : "safe"}
          ring={{ value: dailyLoss, max: dailyLossLimit, color: dailyColor }}
        />
        <KpiCard
          title="Max Drawdown"
          value={`${maxDrawdown.toFixed(2)}%`}
          subValue={`Buffer: ${(maxDDLimit - maxDrawdown).toFixed(2)}% remaining`}
          status={maxDrawdown / maxDDLimit > 0.65 ? "warning" : "safe"}
          ring={{ value: maxDrawdown, max: maxDDLimit, color: ddColor }}
        />
        <KpiCard
          title="Profit Target"
          value={`${profitAchieved.toFixed(2)}%`}
          subValue={`Target: ${profitTarget}%`}
          status="safe"
          ring={{ value: profitAchieved, max: profitTarget, color: "#22C55E" }}
        />
      </div>

      {/* Chart + right panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-3 md:gap-4">
        <div className="space-y-4">
          <EquityChart
            data={equityData}
            startingBalance={startBal}
            isLive={isLive}
            isLoading={equityQuery.isFetching && !equityQuery.data}
          />
          <TradesTable
            trades={trades as any}
            isLoading={tradesQuery.isFetching && !tradesQuery.data}
          />
        </div>
        <div>
          <RulesPanel snapshot={c ?? null} />
        </div>
      </div>
    </div>
  );
}
