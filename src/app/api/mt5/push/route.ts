export const dynamic = "force-dynamic";

/**
 * POST /api/mt5/push
 *
 * Receives live snapshots from the Python MT5 bridge.
 * - Validates the shared secret header
 * - Resolves account_number → mt5Account → propChallenge
 * - Calculates daily loss % and max drawdown %
 * - Inserts a new liveAccountData row
 * - Upserts new closed deals into the trades table
 * - Checks for alert conditions and inserts alerts
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  mt5Accounts,
  propChallenges,
  liveAccountData,
  trades,
  alerts,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, lt, gte, sql } from "drizzle-orm";
import { sendAlertEmail } from "@/lib/email";
import { sendWhatsAppAlert } from "@/lib/whatsapp";

// ── Zod schema ────────────────────────────────────────────────────────────────

const PositionSchema = z.object({
  ticket:        z.number().int(),
  symbol:        z.string(),
  type:          z.enum(["buy", "sell"]),
  volume:        z.number(),
  price_open:    z.number(),
  price_current: z.number(),
  profit:        z.number(),
  swap:          z.number(),
  time_open:     z.string().datetime({ offset: true }),
});

const DealSchema = z.object({
  ticket:      z.number().int(),
  symbol:      z.string(),
  type:        z.enum(["buy", "sell"]),
  volume:      z.number(),
  price_open:  z.number(),
  price_close: z.number(),
  profit:      z.number(),
  swap:        z.number(),
  commission:  z.number(),
  time_open:   z.string().datetime({ offset: true }),
  time_close:  z.string().datetime({ offset: true }),
  comment:     z.string().optional().default(""),
});

const PushSchema = z.object({
  account_number:  z.string(),
  server:          z.string(),
  equity:          z.number(),
  balance:         z.number(),
  margin_free:     z.number().optional(),
  open_positions:  z.array(PositionSchema).default([]),
  closed_deals:    z.array(DealSchema).default([]),
  timestamp:       z.string().datetime({ offset: true }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns today's date string in UTC: "YYYY-MM-DD" */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Daily loss %: how far equity has dropped since the start of today.
 * If no snapshot exists today yet, compare to yesterday's last snapshot.
 */
async function calcDailyLossPct(
  challengeId: number,
  currentEquity: number,
  accountSize: number,
): Promise<number> {
  const today = todayUtc();
  const todayStart = new Date(`${today}T00:00:00.000Z`);

  // Most recent snapshot from before today
  const [prevSnap] = await db
    .select({ equity: liveAccountData.equity })
    .from(liveAccountData)
    .where(
      and(
        eq(liveAccountData.challengeId, challengeId),
        lt(liveAccountData.timestamp, todayStart),
      )
    )
    .orderBy(desc(liveAccountData.timestamp))
    .limit(1);

  const referenceEquity = prevSnap ? Number(prevSnap.equity) : accountSize;
  const loss = referenceEquity - currentEquity;
  return Math.max(0, (loss / accountSize) * 100);
}

/**
 * Max drawdown %: drop from the all-time peak equity to current.
 */
async function calcMaxDrawdownPct(
  challengeId: number,
  currentEquity: number,
  startingBalance: number,
): Promise<number> {
  const [peakRow] = await db
    .select({ peak: sql<string>`MAX(${liveAccountData.equity})` })
    .from(liveAccountData)
    .where(eq(liveAccountData.challengeId, challengeId));

  const peak = peakRow?.peak ? Number(peakRow.peak) : startingBalance;
  const drawdown = Math.max(peak, startingBalance) - currentEquity;
  return Math.max(0, (drawdown / startingBalance) * 100);
}

/** Profit achieved % from starting balance */
function calcProfitPct(equity: number, startingBalance: number): number {
  return ((equity - startingBalance) / startingBalance) * 100;
}

// ── Alert checks ──────────────────────────────────────────────────────────────

async function maybeInsertAlerts(
  challengeId: number,
  userId: string,
  userEmail: string,
  userWhatsapp: string | null | undefined,
  firm: string,
  dailyLossPct: number,
  dailyLossLimit: number,
  maxDrawdownPct: number,
  maxDrawdownLimit: number,
  profitPct: number,
  profitTarget: number,
) {
  const newAlerts: (typeof alerts.$inferInsert)[] = [];

  // Daily loss warning at 70% of limit
  if (dailyLossPct >= dailyLossLimit * 0.70 && dailyLossPct < dailyLossLimit) {
    const ratio = dailyLossPct / dailyLossLimit;
    const severity = ratio >= 0.90 ? "critical" : "warning";
    newAlerts.push({
      userId,
      challengeId,
      type:     "daily_drawdown",
      severity,
      title:    `Daily Loss ${ratio >= 0.90 ? "Critical" : "Warning"}`,
      message:  `Daily loss is at ${dailyLossPct.toFixed(2)}% — limit is ${dailyLossLimit}%. ${(dailyLossLimit - dailyLossPct).toFixed(2)}% buffer remaining.`,
      isRead:   false,
    });
  }

  // Daily loss breach
  if (dailyLossPct >= dailyLossLimit) {
    newAlerts.push({
      userId,
      challengeId,
      type:     "breach",
      severity: "critical",
      title:    "Daily Loss Limit BREACHED",
      message:  `Daily loss reached ${dailyLossPct.toFixed(2)}% — exceeds the ${dailyLossLimit}% limit. Stop trading immediately.`,
      isRead:   false,
    });
  }

  // Max drawdown warning at 70%
  if (maxDrawdownPct >= maxDrawdownLimit * 0.70 && maxDrawdownPct < maxDrawdownLimit) {
    const ratio = maxDrawdownPct / maxDrawdownLimit;
    const severity = ratio >= 0.90 ? "critical" : "warning";
    newAlerts.push({
      userId,
      challengeId,
      type:     "max_drawdown",
      severity,
      title:    `Max Drawdown ${ratio >= 0.90 ? "Critical" : "Warning"}`,
      message:  `Max drawdown is at ${maxDrawdownPct.toFixed(2)}% — limit is ${maxDrawdownLimit}%.`,
      isRead:   false,
    });
  }

  // Profit target reached (insert once — check no existing alert)
  if (profitPct >= profitTarget) {
    newAlerts.push({
      userId,
      challengeId,
      type:     "profit_target",
      severity: "info",
      title:    "Profit Target Reached! 🎯",
      message:  `You've achieved ${profitPct.toFixed(2)}% profit — the target was ${profitTarget}%. Consider requesting a payout or advancing to the next phase.`,
      isRead:   false,
    });
  }

  if (newAlerts.length > 0) {
    await db.insert(alerts).values(newAlerts);

    // Email + WhatsApp for critical and breach alerts only
    for (const alert of newAlerts) {
      if (alert.severity === "critical" || alert.type === "breach") {
        const title    = alert.title    as string;
        const message  = alert.message  as string;
        const severity = alert.severity as "info" | "warning" | "critical";
        sendAlertEmail(userEmail, title, message, severity, firm);
        if (userWhatsapp) {
          sendWhatsAppAlert(userWhatsapp, title, message, severity, firm);
        }
      }
    }
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Auth
  const secret = req.headers.get("x-bridge-secret");
  if (!secret || secret !== process.env.MT5_BRIDGE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate
  let body: z.infer<typeof PushSchema>;
  try {
    const raw = await req.json();
    body = PushSchema.parse(raw);
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload", detail: String(err) }, { status: 400 });
  }

  const { account_number, server, equity, balance, open_positions, closed_deals } = body;

  // 3. Resolve MT5 account
  const [mt5Account] = await db
    .select()
    .from(mt5Accounts)
    .where(
      and(
        eq(mt5Accounts.accountNumber, account_number),
        eq(mt5Accounts.isActive, true),
      )
    )
    .limit(1);

  if (!mt5Account) {
    // Unknown account — record but don't error (bridge may send before account is linked)
    return NextResponse.json({ warning: "No linked MT5 account found", account_number });
  }

  // 4. Update lastSync
  await db
    .update(mt5Accounts)
    .set({ lastSync: new Date() })
    .where(eq(mt5Accounts.id, mt5Account.id));

  // 5. Resolve active challenge for this account
  const [challenge] = await db
    .select()
    .from(propChallenges)
    .where(
      and(
        eq(propChallenges.mt5AccountId, mt5Account.id),
        eq(propChallenges.isActive, true),
        eq(propChallenges.status, "active"),
      )
    )
    .limit(1);

  if (!challenge) {
    return NextResponse.json({ warning: "No active challenge linked to this account", account_number });
  }

  const accountSize    = Number(challenge.accountSize    ?? challenge.startingBalance ?? equity);
  const startingBal    = Number(challenge.startingBalance ?? equity);
  const ddLimit        = Number(challenge.dailyDrawdownLimit ?? 0.05) * 100; // stored as 0.05 = 5%
  const maxDdLimit     = Number(challenge.maxDrawdownLimit   ?? 0.10) * 100;
  const profitTarget   = Number(challenge.profitTarget       ?? 0.10) * 100;

  // 6. Calculate metrics
  const dailyLossPct   = await calcDailyLossPct(challenge.id, equity, accountSize);
  const maxDrawdownPct = await calcMaxDrawdownPct(challenge.id, equity, startingBal);
  const profitPct      = calcProfitPct(equity, startingBal);

  // 7. Insert live snapshot
  await db.insert(liveAccountData).values({
    challengeId:    challenge.id,
    equity:         String(equity),
    balance:        String(balance),
    dailyLoss:      String(dailyLossPct.toFixed(4)),
    maxDrawdown:    String(maxDrawdownPct.toFixed(4)),
    profitAchieved: String(profitPct.toFixed(4)),
    openPositions:  open_positions.length,
    timestamp:      new Date(body.timestamp),
  });

  // 8. Upsert closed deals into trades table
  if (closed_deals.length > 0) {
    const tradeRows = closed_deals.map((d) => ({
      challengeId:  challenge.id,
      ticket:       String(d.ticket),
      symbol:       d.symbol,
      type:         d.type,
      lotSize:      String(d.volume),
      openPrice:    String(d.price_open),
      closePrice:   String(d.price_close),
      openTime:     new Date(d.time_open),
      closeTime:    new Date(d.time_close),
      profit:       String(d.profit),
      swap:         String(d.swap),
      commission:   String(d.commission),
      comment:      d.comment ?? "",
    }));

    // Insert, ignoring duplicates on ticket
    for (const row of tradeRows) {
      await db
        .insert(trades)
        .values(row)
        .onConflictDoNothing();
    }
  }

  // 9. Check alert conditions — look up user email for notifications
  const [challengeUser] = await db
    .select({ email: users.email, whatsappNumber: users.whatsappNumber })
    .from(users)
    .where(eq(users.id, challenge.userId))
    .limit(1);

  await maybeInsertAlerts(
    challenge.id,
    challenge.userId,
    challengeUser?.email ?? "",
    challengeUser?.whatsappNumber,
    challenge.firm,
    dailyLossPct,
    ddLimit,
    maxDrawdownPct,
    maxDdLimit,
    profitPct,
    profitTarget,
  );

  // 10. Update challenge status if target hit or breach occurred
  if (maxDrawdownPct >= maxDdLimit || dailyLossPct >= ddLimit) {
    await db
      .update(propChallenges)
      .set({ status: "failed", isActive: false, updatedAt: new Date() })
      .where(eq(propChallenges.id, challenge.id));
  } else if (profitPct >= profitTarget) {
    await db
      .update(propChallenges)
      .set({ status: "passed", updatedAt: new Date() })
      .where(eq(propChallenges.id, challenge.id));
  }

  return NextResponse.json({
    ok:           true,
    challengeId:  challenge.id,
    equity,
    dailyLossPct: +dailyLossPct.toFixed(4),
    maxDrawdownPct: +maxDrawdownPct.toFixed(4),
    profitPct:    +profitPct.toFixed(4),
  });
}
