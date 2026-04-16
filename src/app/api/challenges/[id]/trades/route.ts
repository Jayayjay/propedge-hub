/**
 * GET /api/challenges/[id]/trades?limit=50&offset=0
 * Returns paginated closed trades for a challenge.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const challengeId = parseInt(id, 10);
  if (isNaN(challengeId)) {
    return NextResponse.json({ error: "Invalid challenge ID" }, { status: 400 });
  }

  const url    = new URL(req.url);
  const limit  = Math.min(parseInt(url.searchParams.get("limit")  ?? "50",  10), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0",   10), 0);

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(trades)
      .where(eq(trades.challengeId, challengeId))
      .orderBy(desc(trades.closeTime))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(trades)
      .where(eq(trades.challengeId, challengeId))
      .then((r) => r[0]?.total ?? 0),
  ]);

  const data = rows.map((t) => {
    const profit     = Number(t.profit ?? 0);
    const openPrice  = Number(t.openPrice ?? 0);
    const closePrice = Number(t.closePrice ?? 0);

    // Rough pip calculation (works for forex; gold is pts * 10)
    const pipMultiplier = t.symbol?.includes("JPY") ? 100 : 10000;
    const rawPips = (closePrice - openPrice) * pipMultiplier;
    const pips = t.type === "sell" ? -rawPips : rawPips;

    return {
      id:         t.id,
      ticket:     t.ticket,
      symbol:     t.symbol,
      type:       t.type.toUpperCase(),
      lots:       Number(t.lotSize ?? 0),
      openPrice:  openPrice,
      closePrice: closePrice,
      profit:     profit,
      swap:       Number(t.swap ?? 0),
      commission: Number(t.commission ?? 0),
      pips:       Math.round(pips),
      openTime:   t.openTime,
      closeTime:  t.closeTime,
      comment:    t.comment,
    };
  });

  // Compute summary stats
  const wins    = data.filter((t) => t.profit > 0).length;
  const total   = data.length;
  const netPnl  = data.reduce((sum, t) => sum + t.profit, 0);

  return NextResponse.json({
    challengeId,
    trades: data,
    pagination: { limit, offset, total: totalRows },
    stats: {
      total,
      wins,
      losses:  total - wins,
      winRate: total > 0 ? +((wins / total) * 100).toFixed(1) : 0,
      netPnl:  +netPnl.toFixed(2),
    },
  });
}
