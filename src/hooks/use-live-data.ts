"use client";

import { useQuery } from "@tanstack/react-query";

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
  equity:             number | null;
  balance:            number | null;
  dailyLoss:          number | null;
  maxDrawdown:        number | null;
  profitAchieved:     number | null;
  openPositions:      number;
  lastUpdated:        string | null;
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
  return json.data ?? [];
}

async function fetchTrades(challengeId: number, limit = 50): Promise<TradesResponse> {
  const res = await fetch(`/api/challenges/${challengeId}/trades?limit=${limit}`);
  if (!res.ok) throw new Error(`Trades fetch failed: ${res.status}`);
  return res.json();
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useLiveSnapshot(challengeId: number) {
  return useQuery<LiveSnapshot>({
    queryKey:        ["live", challengeId],
    queryFn:         () => fetchLive(challengeId),
    refetchInterval: POLL_MS,
    retry:           2,
  });
}

export function useEquityCurve(challengeId: number) {
  return useQuery<EquityPoint[]>({
    queryKey:        ["equity", challengeId],
    queryFn:         () => fetchEquity(challengeId),
    refetchInterval: POLL_MS,
    retry:           2,
  });
}

export function useTrades(challengeId: number, limit = 50) {
  return useQuery<TradesResponse>({
    queryKey:        ["trades", challengeId, limit],
    queryFn:         () => fetchTrades(challengeId, limit),
    refetchInterval: POLL_MS,
    retry:           2,
  });
}
