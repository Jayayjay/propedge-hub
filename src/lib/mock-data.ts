// Mock data for MVP demo — replace with real DB/MT5 queries later

export const PROP_FIRMS = [
  { id: "ftuk", name: "FTUK", color: "#6366F1" },
  { id: "funderpro", name: "FunderPro", color: "#F59E0B" },
  { id: "nova", name: "Nova Funded", color: "#22C55E" },
  { id: "e8", name: "E8 Markets", color: "#3B82F6" },
  { id: "mff", name: "My Forex Funds", color: "#EC4899" },
];

export const mockEquityCurve = Array.from({ length: 30 }, (_, i) => {
  const base = 10000;
  const trend = i * 35;
  const noise = Math.sin(i * 0.7) * 180 + Math.random() * 120 - 60;
  return {
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
      .toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    equity: Math.round(base + trend + noise),
    balance: Math.round(base + trend + noise - 50),
  };
});

export const mockChallenge = {
  id: 1,
  firm: "FTUK",
  phase: "Phase 2",
  accountSize: 100000,
  currentEquity: 102380,
  startingBalance: 100000,
  dailyLoss: -0.8,          // % today
  dailyLossLimit: 5,
  maxDrawdown: 4.2,
  maxDrawdownLimit: 10,
  profitAchieved: 2.38,
  profitTarget: 10,
  tradingDays: 12,
  minTradingDays: 5,
  status: "active" as const,
  startDate: "Mar 16, 2026",
};

export const mockTrades = [
  { id: 1, symbol: "XAUUSD", type: "BUY", lots: 0.10, openPrice: 2312.50, closePrice: 2321.80, profit: 93.00, closeTime: "Today 14:22", pips: 93 },
  { id: 2, symbol: "EURUSD", type: "SELL", lots: 0.20, openPrice: 1.08820, closePrice: 1.08640, profit: 36.00, closeTime: "Today 11:05", pips: 18 },
  { id: 3, symbol: "GBPUSD", type: "BUY", lots: 0.15, openPrice: 1.26540, closePrice: 1.26210, profit: -49.50, closeTime: "Yesterday 20:11", pips: -33 },
  { id: 4, symbol: "USDJPY", type: "SELL", lots: 0.10, openPrice: 151.820, closePrice: 151.440, profit: 25.10, closeTime: "Yesterday 15:44", pips: 38 },
  { id: 5, symbol: "XAUUSD", type: "BUY", lots: 0.05, openPrice: 2298.10, closePrice: 2305.60, profit: 37.50, closeTime: "Apr 12 09:30", pips: 75 },
];

export const mockAlerts = [
  {
    id: 1,
    type: "warning",
    title: "Daily Loss Approaching Limit",
    message: "FTUK Phase 2 – daily loss is at 1.2% of 5% limit. Trade carefully.",
    time: "2 hours ago",
    isRead: false,
    firm: "FTUK",
  },
  {
    id: 2,
    type: "success",
    title: "Profit Target 50% Reached",
    message: "FunderPro Phase 1 – you've hit 5% profit. Keep it up!",
    time: "Yesterday",
    isRead: false,
    firm: "FunderPro",
  },
  {
    id: 3,
    type: "info",
    title: "New Challenge Connected",
    message: "Nova Funded account #4891234 successfully linked.",
    time: "2 days ago",
    isRead: true,
    firm: "Nova Funded",
  },
];

export const mockChallengesList = [
  {
    id: 1,
    firm: "FTUK",
    phase: "Phase 2",
    accountSize: 100000,
    profit: 2.38,
    target: 10,
    maxDD: 4.2,
    maxDDLimit: 10,
    status: "active",
    startDate: "Mar 16",
    daysLeft: 18,
  },
  {
    id: 2,
    firm: "FunderPro",
    phase: "Phase 1",
    accountSize: 50000,
    profit: 5.1,
    target: 8,
    maxDD: 2.1,
    maxDDLimit: 8,
    status: "active",
    startDate: "Apr 01",
    daysLeft: 29,
  },
  {
    id: 3,
    firm: "E8 Markets",
    phase: "Funded",
    accountSize: 200000,
    profit: 3.4,
    target: 5,
    maxDD: 1.8,
    maxDDLimit: 8,
    status: "active",
    startDate: "Feb 10",
    daysLeft: 0,
  },
  {
    id: 4,
    firm: "FTUK",
    phase: "Phase 1",
    accountSize: 25000,
    profit: 10.2,
    target: 10,
    maxDD: 6.1,
    maxDDLimit: 10,
    status: "passed",
    startDate: "Jan 20",
    daysLeft: 0,
  },
  {
    id: 5,
    firm: "Nova Funded",
    phase: "Phase 1",
    accountSize: 50000,
    profit: 1.2,
    target: 10,
    maxDD: 5.8,
    maxDDLimit: 8,
    status: "failed",
    startDate: "Mar 01",
    daysLeft: 0,
  },
];
