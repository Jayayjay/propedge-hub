/**
 * GET /api/challenges/[id]/equity?points=100
 * Returns equity curve data for the chart — sampled to N points.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { liveAccountData } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const challengeId = parseInt(id, 10);
  if (isNaN(challengeId)) {
    return NextResponse.json({ error: "Invalid challenge ID" }, { status: 400 });
  }

  const url = new URL(req.url);
  const points = Math.min(parseInt(url.searchParams.get("points") ?? "200", 10), 500);

  // Fetch the most recent N rows and return oldest-first for the chart
  const rows = await db
    .select({
      equity:    liveAccountData.equity,
      balance:   liveAccountData.balance,
      timestamp: liveAccountData.timestamp,
    })
    .from(liveAccountData)
    .where(eq(liveAccountData.challengeId, challengeId))
    .orderBy(desc(liveAccountData.timestamp))
    .limit(points);

  // Reverse so oldest is first (left side of chart)
  const data = rows.reverse().map((r) => ({
    equity:    Number(r.equity),
    balance:   r.balance ? Number(r.balance) : null,
    timestamp: r.timestamp,
    date: new Date(r.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day:   "numeric",
      hour:  "2-digit",
      minute:"2-digit",
    }),
  }));

  return NextResponse.json({ challengeId, data });
}
