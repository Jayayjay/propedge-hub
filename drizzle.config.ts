import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Direct URL (no pooler) for drizzle-kit — pooler doesn't support websocket migrations.
    // The app uses DATABASE_URL (pooler) at runtime via neon-http.
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
} satisfies Config;
