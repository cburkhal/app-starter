import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createApp } from "../src/app";
import { createAuth } from "../src/auth";
import type { Db } from "../src/db";
import * as schema from "../src/db/schema";
import { loadEnv } from "../src/env";

// In-process Postgres (PGlite): no Docker needed, each test file gets a fresh database.
export async function createTestApp(overrides: Record<string, string> = {}) {
  const pg = new PGlite();
  const raw = drizzle(pg, { schema });
  await migrate(raw, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  const db = raw as unknown as Db;
  const env = loadEnv({ NODE_ENV: "test", APP_URL: "http://localhost:5173", ...overrides });
  const app = createApp({ db, env, auth: createAuth(db, env) });

  const request = (path: string, init: RequestInit = {}, cookie?: string) =>
    app.request(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        origin: env.APP_URL,
        ...(cookie ? { cookie } : {}),
        ...init.headers,
      },
    });

  async function signUp(email: string) {
    const res = await request("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify({ email, password: "correct-horse-battery", name: email }),
    });
    if (res.status !== 200) throw new Error(`sign-up failed: ${res.status} ${await res.text()}`);
    const cookie = res.headers.get("set-cookie")?.split(";")[0];
    if (!cookie) throw new Error("no session cookie");
    return cookie;
  }

  return { app, db, request, signUp, close: () => pg.close() };
}
