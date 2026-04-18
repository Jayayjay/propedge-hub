import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { alerts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const alertId = parseInt(id, 10);
  if (isNaN(alertId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  await db
    .update(alerts)
    .set({ isRead: true })
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
