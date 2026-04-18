import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { alerts, propChallenges } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const conditions = [eq(alerts.userId, session.user.id)];
  if (unreadOnly) conditions.push(eq(alerts.isRead, false));

  const rows = await db
    .select({
      id: alerts.id,
      type: alerts.type,
      severity: alerts.severity,
      title: alerts.title,
      message: alerts.message,
      isRead: alerts.isRead,
      channels: alerts.channels,
      createdAt: alerts.createdAt,
      firm: propChallenges.firm,
    })
    .from(alerts)
    .leftJoin(propChallenges, eq(alerts.challengeId, propChallenges.id))
    .where(and(...conditions))
    .orderBy(desc(alerts.createdAt))
    .limit(100);

  return NextResponse.json(rows);
}
