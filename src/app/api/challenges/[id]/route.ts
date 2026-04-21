import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propChallenges } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const PatchSchema = z.object({
  status:             z.enum(["active", "passed", "failed", "funded", "completed"]).optional(),
  phase:              z.enum(["phase1", "phase2", "funded"]).optional(),
  accountSize:        z.number().positive().optional(),
  dailyDrawdownLimit: z.number().min(0).max(100).optional(),
  maxDrawdownLimit:   z.number().min(0).max(100).optional(),
  profitTarget:       z.number().min(0).max(100).optional(),
  notes:              z.string().max(500).nullable().optional(),
  endDate:            z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const challengeId = parseInt(id, 10);
  if (isNaN(challengeId)) {
    return NextResponse.json({ error: "Invalid challenge ID" }, { status: 400 });
  }

  let body: z.infer<typeof PatchSchema>;
  try {
    body = PatchSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload", detail: String(err) }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) {
    updates.status = body.status;
    updates.isActive = body.status === "active";
  }
  if (body.phase       !== undefined) updates.phase       = body.phase;
  if (body.accountSize !== undefined) updates.accountSize = String(body.accountSize);
  if (body.dailyDrawdownLimit !== undefined) updates.dailyDrawdownLimit = String(body.dailyDrawdownLimit / 100);
  if (body.maxDrawdownLimit   !== undefined) updates.maxDrawdownLimit   = String(body.maxDrawdownLimit / 100);
  if (body.profitTarget       !== undefined) updates.profitTarget       = String(body.profitTarget / 100);
  if (body.notes   !== undefined) updates.notes   = body.notes;
  if (body.endDate !== undefined) updates.endDate = body.endDate ? new Date(body.endDate) : null;

  const result = await db
    .update(propChallenges)
    .set(updates)
    .where(and(eq(propChallenges.id, challengeId), eq(propChallenges.userId, session.user.id)))
    .returning({ id: propChallenges.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const challengeId = parseInt(id, 10);
  if (isNaN(challengeId)) {
    return NextResponse.json({ error: "Invalid challenge ID" }, { status: 400 });
  }

  const result = await db
    .delete(propChallenges)
    .where(and(eq(propChallenges.id, challengeId), eq(propChallenges.userId, session.user.id)))
    .returning({ id: propChallenges.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
