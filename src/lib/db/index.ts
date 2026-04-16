import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { fetch as undici_fetch } from "undici";
import * as schema from "./schema";

// Next.js patches globalThis.fetch which breaks @neondatabase/serverless.
// undici is the raw, unpatched HTTP client — use it directly.
neonConfig.fetchFunction = undici_fetch as unknown as typeof fetch;

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
