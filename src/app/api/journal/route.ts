import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, session.user.id))
    .orderBy(desc(journalEntries.date));

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { challengeId, tradeTicket, symbol, direction, setup, notes, outcome, pnl, mood, tags, isWin, date } = body;

  const [entry] = await db
    .insert(journalEntries)
    .values({
      userId: session.user.id,
      challengeId: challengeId ?? null,
      tradeTicket: tradeTicket ?? null,
      date: date ? new Date(date) : new Date(),
      symbol: symbol ?? null,
      direction: direction ?? "none",
      setup: setup ?? null,
      notes: notes ?? null,
      outcome: outcome ?? null,
      pnl: pnl != null ? String(pnl) : null,
      mood: mood ?? null,
      tags: Array.isArray(tags) ? tags : [],
      isWin: isWin ?? null,
    })
    .returning();

  return NextResponse.json({ entry }, { status: 201 });
}
