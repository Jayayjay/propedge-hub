export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propChallenges, liveAccountData } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { z } from "zod";

const CreateSchema = z.object({
  firm:               z.string().min(1).max(100),
  phase:              z.enum(["phase1", "phase2", "funded"]),
  accountSize:        z.number().positive(),
  startingBalance:    z.number().positive().optional(),
  dailyDrawdownLimit: z.number().min(0).max(100),  // user enters as % e.g. 5
  maxDrawdownLimit:   z.number().min(0).max(100),
  profitTarget:       z.number().min(0).max(100),
  minTradingDays:     z.number().int().min(0).default(0),
  mt5AccountId:       z.number().int().optional().nullable(),
  startDate:          z.string().optional(),        // ISO date string
  endDate:            z.string().optional().nullable(),
  notes:              z.string().max(500).optional(),
});

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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof CreateSchema>;
  try {
    body = CreateSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload", detail: String(err) }, { status: 400 });
  }

  const startBal = body.startingBalance ?? body.accountSize;

  const [created] = await db
    .insert(propChallenges)
    .values({
      userId:             session.user.id,
      firm:               body.firm,
      phase:              body.phase,
      accountSize:        String(body.accountSize),
      startingBalance:    String(startBal),
      dailyDrawdownLimit: String(body.dailyDrawdownLimit / 100), // store as fraction
      maxDrawdownLimit:   String(body.maxDrawdownLimit   / 100),
      profitTarget:       String(body.profitTarget       / 100),
      minTradingDays:     body.minTradingDays,
      mt5AccountId:       body.mt5AccountId ?? null,
      startDate:          body.startDate ? new Date(body.startDate) : new Date(),
      endDate:            body.endDate    ? new Date(body.endDate)  : null,
      notes:              body.notes ?? null,
      status:             "active",
      isActive:           true,
    })
    .returning({ id: propChallenges.id });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
