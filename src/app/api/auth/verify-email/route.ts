import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/email";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://propedge-hub-3tt7.vercel.app/";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(`${BASE_URL}/verify-email?error=missing`);
  }

  // Look up token
  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, token)
      )
    )
    .limit(1);

  if (!record) {
    return NextResponse.redirect(`${BASE_URL}/verify-email?error=invalid`);
  }

  if (record.expires < new Date()) {
    // Clean up expired token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));
    return NextResponse.redirect(`${BASE_URL}/verify-email?error=expired`);
  }

  // Mark email verified
  const [user] = await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email))
    .returning({ name: users.name });

  // Delete the used token
  await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

  // Send welcome email now that they're confirmed
  if (user) {
    sendWelcomeEmail(email, user.name ?? "Trader");
  }

  return NextResponse.redirect(`${BASE_URL}/login?verified=true`);
}
