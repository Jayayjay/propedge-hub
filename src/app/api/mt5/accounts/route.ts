import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mt5Accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/crypto";

// GET — two callers:
//   1. Bridge (X-Bridge-Secret header) → all active accounts with decrypted passwords
//   2. Settings UI (session) → current user's accounts, no passwords
export async function GET(req: NextRequest) {
  const bridgeSecret = req.headers.get("x-bridge-secret");

  if (bridgeSecret) {
    if (bridgeSecret !== process.env.MT5_BRIDGE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rows = await db
      .select()
      .from(mt5Accounts)
      .where(eq(mt5Accounts.isActive, true));

    return NextResponse.json(
      rows.map((a) => ({
        login:    a.accountNumber,
        password: a.passwordEncrypted ? decrypt(a.passwordEncrypted) : "",
        server:   a.serverName,
        label:    a.label,
        userId:   a.userId,
      }))
    );
  }

  // Session auth for settings UI
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id:            mt5Accounts.id,
      label:         mt5Accounts.label,
      accountNumber: mt5Accounts.accountNumber,
      serverName:    mt5Accounts.serverName,
      isActive:      mt5Accounts.isActive,
      lastSync:      mt5Accounts.lastSync,
    })
    .from(mt5Accounts)
    .where(
      and(
        eq(mt5Accounts.userId, session.user.id),
        eq(mt5Accounts.isActive, true),
      )
    );

  return NextResponse.json(rows);
}

// POST — user adds an MT5 account from Settings
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, accountNumber, serverName, password } = await req.json();

  if (!label || !accountNumber || !serverName || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const [account] = await db
    .insert(mt5Accounts)
    .values({
      userId:            session.user.id,
      label:             label.trim(),
      accountNumber:     String(accountNumber).trim(),
      serverName:        serverName.trim(),
      passwordEncrypted: encrypt(password),
      isActive:          true,
    })
    .returning({
      id:            mt5Accounts.id,
      label:         mt5Accounts.label,
      accountNumber: mt5Accounts.accountNumber,
      serverName:    mt5Accounts.serverName,
    });

  return NextResponse.json(account, { status: 201 });
}
