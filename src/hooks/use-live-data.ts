/**
 * TanStack Query hooks for live MT5 challenge data.
 * All three hooks poll on a 5-second interval and fall back
 * gracefully to mock data when no real data exists yet.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { mockEquityCurve, mockTrades, mockChallenge } from "@/lib/mock-data";

const POLL_MS = 5_000;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LiveSnapshot {
  challengeId:        number;
  firm:               string;
  phase:              string;
  status:             string;
  accountSize:        number;
  startingBalance:    number;
  dailyDrawdownLimit: number;
  maxDrawdownLimit:   number;
  profitTarget:       number;
  minTradingDays:     number | null;
  // live — null when no data yet
  equity:             number | null;
  balance:            number | null;
  dailyLoss:          number | null;
  maxDrawdown:        number | null;
  profitAchieved:     number | null;
  openPositions:      number;
  lastUpdated:        string | null;
  // MT5 connection
  mt5Connected:       boolean;
  mt5LastSync:        string | null;
  mt5Label:           string | null;
}

export interface EquityPoint {
  equity:    number;
  balance:   number | null;
  timestamp: string;
  date:      string;
}

export interface Trade {
  id:         number;
  ticket:     string | null;
  symbol:     string;
  type:       string;
  lots:       number;
  openPrice:  number;
  closePrice: number;
  profit:     number;
  swap:       number;
  commission: number;
  pips:       number;
  openTime:   string | null;
  closeTime:  string | null;
  comment:    string | null;
}

export interface TradesResponse {
  challengeId: number;
  trades:      Trade[];
  pagination:  { limit: number; offset: number; total: number };
  stats:       { total: number; wins: number; losses: number; winRate: number; netPnl: number };
}

// ── Fetchers ───────────────────────────────────────────────────────────────────

async function fetchLive(challengeId: number): Promise<LiveSnapshot> {
  const res = await fetch(`/api/challenges/${challengeId}/live`);
  if (!res.ok) throw new Error(`Live fetch failed: ${res.status}`);
  return res.json();
}

async function fetchEquity(challengeId: number): Promise<EquityPoint[]> {
  const res = await fetch(`/api/challenges/${challengeId}/equity?points=200`);
  if (!res.ok) throw new Error(`Equity fetch failed: ${res.status}`);
  const json = await res.json();
  return json.data;
}

async function fetchTrades(challengeId: number, limit = 50): Promise<TradesResponse> {
  const res = await fetch(`/api/challenges/${challengeId}/trades?limit=${limit}`);
  if (!res.ok) throw new Error(`Trades fetch failed: ${res.status}`);
  return res.json();
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Live snapshot — current equity, drawdown %, profit %, etc.
 * Falls back to mock data while the DB is empty.
 */
export function useLiveSnapshot(challengeId: number) {
  return useQuery<LiveSnapshot>({
    queryKey:       ["live", challengeId],
    queryFn:        () => fetchLive(challengeId),
    refetchInterval: POLL_MS,
    retry:          2,
  });
}

/**
 * Equity curve for the chart.
 * Returns mock data as placeholderData so the chart always renders.
 */
export function useEquityCurve(challengeId: number) {
  return useQuery<EquityPoint[]>({
    queryKey:        ["equity", challengeId],
    queryFn:         () => fetchEquity(challengeId),
    refetchInterval: POLL_MS,
    placeholderData: mockEquityCurve as unknown as EquityPoint[],
    retry:           2,
  });
}

/**
 * Recent closed trades.
 * Returns mock data as placeholderData so the table always renders.
 */
export function useTrades(challengeId: number, limit = 50) {
  return useQuery<TradesResponse>({
    queryKey:        ["trades", challengeId, limit],
    queryFn:         () => fetchTrades(challengeId, limit),
    refetchInterval: POLL_MS,
    placeholderData: {
      challengeId,
      trades: mockTrades as unknown as Trade[],
      pagination: { limit, offset: 0, total: mockTrades.length },
      stats: {
        total:   mockTrades.length,
        wins:    mockTrades.filter((t) => t.profit > 0).length,
        losses:  mockTrades.filter((t) => t.profit <= 0).length,
        winRate: 60,
        netPnl:  mockTrades.reduce((s, t) => s + t.profit, 0),
      },
    },
    retry: 2,
  });
}

// ── Derived helpers ────────────────────────────────────────────────────────────

/** Merge live snapshot with mock fallback values for display */
export function resolveSnapshot(data: LiveSnapshot | undefined) {
  if (!data) return mockChallenge;

  return {
    ...mockChallenge,
    firm:             data.firm,
    phase:            data.phase,
    accountSize:      data.accountSize,
    startingBalance:  data.startingBalance,
    dailyLossLimit:   data.dailyDrawdownLimit,
    maxDrawdownLimit: data.maxDrawdownLimit,
    profitTarget:     data.profitTarget,
    currentEquity:    data.equity          ?? mockChallenge.currentEquity,
    dailyLoss:        data.dailyLoss !== null ? -data.dailyLoss  : mockChallenge.dailyLoss,
    maxDrawdown:      data.maxDrawdown     ?? mockChallenge.maxDrawdown,
    profitAchieved:   data.profitAchieved  ?? mockChallenge.profitAchieved,
    mt5Connected:     data.mt5Connected,
    mt5LastSync:      data.mt5LastSync,
    isLive:           data.equity !== null,
  };
}
