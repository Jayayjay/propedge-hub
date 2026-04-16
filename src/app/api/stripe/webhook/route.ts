import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendSubscriptionEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan ?? "pro";
    const userId = session.metadata?.userId;
    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : null;
    const stripeSubscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;

    if (!userId) {
      console.error("Webhook: missing userId in metadata");
      return NextResponse.json({ received: true });
    }

    try {
      const existing = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (existing.length > 0) {
        await db
          .update(subscriptions)
          .set({
            plan,
            status: "active",
            stripeCustomerId,
            stripeSubscriptionId,
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
            updatedAt: now,
          })
          .where(eq(subscriptions.userId, userId));
      } else {
        await db.insert(subscriptions).values({
          userId,
          plan,
          status: "active",
          stripeCustomerId,
          stripeSubscriptionId,
          currentPeriodStart: now,
          currentPeriodEnd: expiresAt,
        });
      }

      console.log(`✓ Subscription updated: userId=${userId} → ${plan}`);

      // Send confirmation email
      const [user] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (user) {
        sendSubscriptionEmail(user.email, user.name ?? "Trader", plan);
      }
    } catch (err) {
      console.error("Webhook DB error:", err);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId =
      typeof subscription.customer === "string" ? subscription.customer : null;

    if (stripeCustomerId) {
      try {
        await db
          .update(subscriptions)
          .set({ status: "cancelled", plan: "free", updatedAt: new Date() })
          .where(eq(subscriptions.stripeCustomerId, stripeCustomerId));
      } catch (err) {
        console.error("Webhook cancel error:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
