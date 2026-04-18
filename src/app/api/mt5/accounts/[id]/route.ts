import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mt5Accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .update(mt5Accounts)
    .set({ isActive: false })
    .where(
      and(
        eq(mt5Accounts.id, parseInt(id)),
        eq(mt5Accounts.userId, session.user.id),
      )
    );

  return NextResponse.json({ ok: true });
}
