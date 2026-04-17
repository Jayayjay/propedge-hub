import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

async function resolveEntry(id: string, userId: string) {
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) return null;
  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
    .limit(1);
  return entry ?? null;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const entry = await resolveEntry(id, session.user.id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const allowed = ["symbol", "direction", "setup", "notes", "outcome", "pnl", "mood", "tags", "isWin", "date", "tradeTicket", "challengeId"];
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in body) update[key] = key === "date" && body[key] ? new Date(body[key]) : body[key];
  }

  const [entry] = await db
    .update(journalEntries)
    .set(update)
    .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, session.user.id)))
    .returning();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await db
    .delete(journalEntries)
    .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
