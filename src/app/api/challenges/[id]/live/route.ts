/**
 * GET /api/challenges/[id]/live
 * Returns the most recent liveAccountData snapshot for a challenge.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { liveAccountData, propChallenges, mt5Accounts } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const challengeId = parseInt(id, 10);
  if (isNaN(challengeId)) {
    return NextResponse.json({ error: "Invalid challenge ID" }, { status: 400 });
  }

  // Get challenge metadata
  const [challenge] = await db
    .select()
    .from(propChallenges)
    .where(eq(propChallenges.id, challengeId))
    .limit(1);

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  // Get most recent snapshot
  const [latest] = await db
    .select()
    .from(liveAccountData)
    .where(eq(liveAccountData.challengeId, challengeId))
    .orderBy(desc(liveAccountData.timestamp))
    .limit(1);

  // Get MT5 account sync status
  const mt5Account = challenge.mt5AccountId
    ? await db
        .select({ lastSync: mt5Accounts.lastSync, label: mt5Accounts.label })
        .from(mt5Accounts)
        .where(eq(mt5Accounts.id, challenge.mt5AccountId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const startingBalance = Number(challenge.startingBalance ?? challenge.accountSize ?? 100000);

  return NextResponse.json({
    challengeId,
    firm:             challenge.firm,
    phase:            challenge.phase,
    status:           challenge.status,
    accountSize:      Number(challenge.accountSize),
    startingBalance,
    dailyDrawdownLimit: Number(challenge.dailyDrawdownLimit) * 100,
    maxDrawdownLimit:   Number(challenge.maxDrawdownLimit) * 100,
    profitTarget:       Number(challenge.profitTarget) * 100,
    minTradingDays:     challenge.minTradingDays,

    // Live data (null if no data yet — frontend falls back to mock)
    equity:         latest ? Number(latest.equity)         : null,
    balance:        latest ? Number(latest.balance)        : null,
    dailyLoss:      latest ? Number(latest.dailyLoss)      : null,
    maxDrawdown:    latest ? Number(latest.maxDrawdown)    : null,
    profitAchieved: latest ? Number(latest.profitAchieved) : null,
    openPositions:  latest?.openPositions ?? 0,
    lastUpdated:    latest?.timestamp ?? null,

    // MT5 connection status
    mt5Connected:   mt5Account !== null,
    mt5LastSync:    mt5Account?.lastSync ?? null,
    mt5Label:       mt5Account?.label ?? null,
  });
}
