export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  pro: { amount: 1000, name: "PropEdge Hub Pro" },     // $10.00
  elite: { amount: 1700, name: "PropEdge Hub Elite" }, // $17.00
};

const schema = z.object({
  plan: z.enum(["pro", "elite"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = schema.parse(body);

    const price = PLAN_PRICES[plan];
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: price.name },
            unit_amount: price.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/settings?upgraded=true`,
      cancel_url: `${baseUrl}/dashboard/settings`,
      metadata: {
        plan,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
