import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propChallenges, trades } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all challenge IDs belonging to the user
  const challenges = await db
    .select({ id: propChallenges.id, firm: propChallenges.firm })
    .from(propChallenges)
    .where(eq(propChallenges.userId, session.user.id));

  if (challenges.length === 0) {
    return NextResponse.json({ trades: [], stats: { total: 0, wins: 0, losses: 0, winRate: 0, netPnl: 0, bestTrade: 0 } });
  }

  const ids = challenges.map((c) => c.id);
  const firmById = new Map(challenges.map((c) => [c.id, c.firm]));

  const rows = await db
    .select({
      id:          trades.id,
      challengeId: trades.challengeId,
      ticket:      trades.ticket,
      symbol:      trades.symbol,
      type:        trades.type,
      lotSize:     trades.lotSize,
      openPrice:   trades.openPrice,
      closePrice:  trades.closePrice,
      openTime:    trades.openTime,
      closeTime:   trades.closeTime,
      profit:      trades.profit,
      swap:        trades.swap,
      commission:  trades.commission,
      comment:     trades.comment,
    })
    .from(trades)
    .where(inArray(trades.challengeId, ids))
    .orderBy(desc(trades.closeTime));

  const mapped = rows.map((t, i) => {
    const profit = Number(t.profit ?? 0);
    const open   = Number(t.openPrice  ?? 0);
    const close  = Number(t.closePrice ?? 0);
    // Rough pip calculation (5-digit broker)
    const rawPips = t.symbol?.includes("JPY")
      ? (close - open) * (t.type === "buy" ? 100 : -100)
      : (close - open) * (t.type === "buy" ? 10000 : -10000);
    const pips = Math.round(rawPips * 10) / 10;

    return {
      id:         t.id,
      rowNum:     i + 1,
      ticket:     t.ticket,
      firm:       firmById.get(t.challengeId) ?? "",
      symbol:     t.symbol,
      type:       t.type.toUpperCase(),
      lots:       Number(t.lotSize ?? 0),
      openPrice:  open,
      closePrice: close,
      openTime:   t.openTime,
      closeTime:  t.closeTime,
      profit,
      swap:       Number(t.swap ?? 0),
      commission: Number(t.commission ?? 0),
      pips,
      comment:    t.comment,
    };
  });

  const wins   = mapped.filter((t) => t.profit > 0);
  const losses = mapped.filter((t) => t.profit <= 0);
  const netPnl = mapped.reduce((s, t) => s + t.profit, 0);
  const bestTrade = mapped.reduce((best, t) => Math.max(best, t.profit), 0);

  return NextResponse.json({
    trades: mapped,
    stats: {
      total:     mapped.length,
      wins:      wins.length,
      losses:    losses.length,
      winRate:   mapped.length > 0 ? Math.round((wins.length / mapped.length) * 100) : 0,
      netPnl:    Math.round(netPnl * 100) / 100,
      bestTrade: Math.round(bestTrade * 100) / 100,
    },
  });
}
