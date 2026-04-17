import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"), // free | pro | elite
  status: text("status").notNull().default("active"), // active | expired | cancelled
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── MT5 Accounts ─────────────────────────────────────────────────────────────

export const mt5Accounts = pgTable("mt5_accounts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  accountNumber: text("account_number").notNull(),
  serverName: text("server_name").notNull(),
  passwordEncrypted: text("password_encrypted"),
  isActive: boolean("is_active").default(true).notNull(),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Prop Challenges ──────────────────────────────────────────────────────────

export const propChallenges = pgTable("prop_challenges", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mt5AccountId: integer("mt5_account_id").references(() => mt5Accounts.id),
  firm: text("firm").notNull(), // e.g. "FTUK", "FunderPro", "Nova"
  phase: text("phase").notNull().default("phase1"), // phase1 | phase2 | funded
  accountSize: decimal("account_size", { precision: 15, scale: 2 }),
  startingBalance: decimal("starting_balance", { precision: 15, scale: 2 }),
  dailyDrawdownLimit: decimal("daily_drawdown_limit", { precision: 6, scale: 4 }),
  maxDrawdownLimit: decimal("max_drawdown_limit", { precision: 6, scale: 4 }),
  profitTarget: decimal("profit_target", { precision: 6, scale: 4 }),
  minTradingDays: integer("min_trading_days"),
  status: text("status").notNull().default("active"), // active | passed | failed | completed
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Live Account Data (time-series snapshots) ────────────────────────────────

export const liveAccountData = pgTable("live_account_data", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => propChallenges.id, { onDelete: "cascade" }),
  equity: decimal("equity", { precision: 15, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }),
  dailyLoss: decimal("daily_loss", { precision: 6, scale: 4 }),
  maxDrawdown: decimal("max_drawdown", { precision: 6, scale: 4 }),
  profitAchieved: decimal("profit_achieved", { precision: 6, scale: 4 }),
  openPositions: integer("open_positions").default(0),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ─── Trades ───────────────────────────────────────────────────────────────────

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => propChallenges.id, { onDelete: "cascade" }),
  ticket: text("ticket"),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // buy | sell
  lotSize: decimal("lot_size", { precision: 8, scale: 2 }),
  openPrice: decimal("open_price", { precision: 15, scale: 5 }),
  closePrice: decimal("close_price", { precision: 15, scale: 5 }),
  openTime: timestamp("open_time"),
  closeTime: timestamp("close_time"),
  profit: decimal("profit", { precision: 10, scale: 2 }),
  swap: decimal("swap", { precision: 10, scale: 2 }),
  commission: decimal("commission", { precision: 10, scale: 2 }),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").references(() => propChallenges.id),
  type: text("type").notNull(), // daily_drawdown | max_drawdown | profit_target | breach
  severity: text("severity").notNull().default("warning"), // info | warning | critical
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  channels: text("channels").array(), // ['email', 'whatsapp']
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Journal Entries ──────────────────────────────────────────────────────────

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").references(() => propChallenges.id),
  tradeTicket: text("trade_ticket"),
  date: timestamp("date").notNull().defaultNow(),
  symbol: text("symbol"),
  direction: text("direction").default("none"), // buy | sell | none
  setup: text("setup"),
  notes: text("notes"),
  outcome: text("outcome"),
  pnl: decimal("pnl", { precision: 10, scale: 2 }),
  mood: text("mood"), // confident | neutral | anxious | greedy | fearful
  tags: text("tags").array(),
  isWin: boolean("is_win"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  mt5Accounts: many(mt5Accounts),
  challenges: many(propChallenges),
  alerts: many(alerts),
  journalEntries: many(journalEntries),
}));

export const propChallengesRelations = relations(propChallenges, ({ one, many }) => ({
  user: one(users, { fields: [propChallenges.userId], references: [users.id] }),
  mt5Account: one(mt5Accounts, {
    fields: [propChallenges.mt5AccountId],
    references: [mt5Accounts.id],
  }),
  liveData: many(liveAccountData),
  trades: many(trades),
  alerts: many(alerts),
}));
