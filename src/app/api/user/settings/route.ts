import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      name:                  users.name,
      email:                 users.email,
      whatsappNumber:        users.whatsappNumber,
      emailAlertsEnabled:    users.emailAlertsEnabled,
      whatsappAlertsEnabled: users.whatsappAlertsEnabled,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [sub] = await db
    .select({
      plan:               subscriptions.plan,
      status:             subscriptions.status,
      currentPeriodEnd:   subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  return NextResponse.json({
    ...user,
    plan:             sub?.status === "active" ? (sub.plan ?? "free") : "free",
    subscriptionStatus: sub?.status ?? null,
    currentPeriodEnd:   sub?.currentPeriodEnd ?? null,
  });
}

const PatchSchema = z.object({
  name:                  z.string().min(1).max(100).optional(),
  whatsappNumber:        z.string().max(20).nullable().optional(),
  emailAlertsEnabled:    z.boolean().optional(),
  whatsappAlertsEnabled: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof PatchSchema>;
  try {
    body = PatchSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload", detail: String(err) }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name                  !== undefined) updates.name                  = body.name;
  if (body.whatsappNumber        !== undefined) updates.whatsappNumber        = body.whatsappNumber;
  if (body.emailAlertsEnabled    !== undefined) updates.emailAlertsEnabled    = body.emailAlertsEnabled;
  if (body.whatsappAlertsEnabled !== undefined) updates.whatsappAlertsEnabled = body.whatsappAlertsEnabled;

  await db.update(users).set(updates).where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
