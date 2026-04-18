import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propChallenges, liveAccountData } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status"); // optional e.g. "active"

  const rows = await db
    .select({
      id:                 propChallenges.id,
      firm:               propChallenges.firm,
      phase:              propChallenges.phase,
      accountSize:        propChallenges.accountSize,
      startingBalance:    propChallenges.startingBalance,
      profitTarget:       propChallenges.profitTarget,
      maxDrawdownLimit:   propChallenges.maxDrawdownLimit,
      dailyDrawdownLimit: propChallenges.dailyDrawdownLimit,
      minTradingDays:     propChallenges.minTradingDays,
      status:             propChallenges.status,
      startDate:          propChallenges.startDate,
      endDate:            propChallenges.endDate,
    })
    .from(propChallenges)
    .where(eq(propChallenges.userId, session.user.id))
    .orderBy(desc(propChallenges.createdAt));

  const filtered = statusFilter
    ? rows.filter((r) => r.status === statusFilter)
    : rows;

  if (filtered.length === 0) {
    return NextResponse.json({ challenges: [] });
  }

  // Fetch latest liveAccountData per challenge
  const ids = filtered.map((r) => r.id);
  const allLive = await db
    .select({
      challengeId:    liveAccountData.challengeId,
      profitAchieved: liveAccountData.profitAchieved,
      maxDrawdown:    liveAccountData.maxDrawdown,
      timestamp:      liveAccountData.timestamp,
    })
    .from(liveAccountData)
    .where(inArray(liveAccountData.challengeId, ids))
    .orderBy(desc(liveAccountData.timestamp));

  // Take most recent snapshot per challengeId
  const liveMap = new Map<number, { profitAchieved: string | null; maxDrawdown: string | null }>();
  for (const row of allLive) {
    if (!liveMap.has(row.challengeId)) {
      liveMap.set(row.challengeId, {
        profitAchieved: row.profitAchieved,
        maxDrawdown: row.maxDrawdown,
      });
    }
  }

  const challenges = filtered.map((c) => {
    const live = liveMap.get(c.id);
    const accountSize = Number(c.accountSize ?? 0);
    const startingBalance = Number(c.startingBalance ?? accountSize);

    // Rules stored as fractions (0.05) → convert to % for display
    const profitTargetPct     = Number(c.profitTarget       ?? 0) * 100;
    const maxDrawdownLimitPct = Number(c.maxDrawdownLimit   ?? 0) * 100;
    const dailyDDLimitPct     = Number(c.dailyDrawdownLimit ?? 0) * 100;

    // Live metrics already stored as % (4.2, not 0.042)
    const profitAchieved = live ? Number(live.profitAchieved ?? 0) : 0;
    const maxDrawdown    = live ? Number(live.maxDrawdown    ?? 0) : 0;

    // Days left (null for funded/no end date)
    let daysLeft: number | null = null;
    if (c.endDate) {
      daysLeft = Math.max(0, Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86_400_000));
    }

    return {
      id: c.id,
      firm: c.firm,
      phase: c.phase,
      accountSize,
      startingBalance,
      profitTarget:       profitTargetPct,
      maxDrawdownLimit:   maxDrawdownLimitPct,
      dailyDrawdownLimit: dailyDDLimitPct,
      minTradingDays:     c.minTradingDays,
      status:             c.status,
      startDate:          c.startDate ? new Date(c.startDate).toLocaleDateString() : null,
      endDate:            c.endDate   ? new Date(c.endDate).toLocaleDateString()   : null,
      daysLeft,
      profitAchieved,
      maxDrawdown,
      hasLiveData: live !== undefined,
    };
  });

  return NextResponse.json({ challenges });
}
