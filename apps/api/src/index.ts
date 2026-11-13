import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import * as Sentry from "@sentry/node";
import { createApp } from "./app";
import { createAuth } from "./auth";
import { createDb } from "./db";
import { loadEnv } from "./env";

const env = loadEnv();
if (env.SENTRY_DSN) Sentry.init({ dsn: env.SENTRY_DSN, tracesSampleRate: 0.1 });

const { db, migrate, close } = createDb(env.DATABASE_URL);
// Migrations run on startup: simple and fine for single-instance apps.
await migrate(process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL("../drizzle", import.meta.url)));

const app = createApp({ db, env, auth: createAuth(db, env) });
const server = serve({ fetch: app.fetch, port: env.PORT }, (info) =>
  console.log(`api listening on :${info.port}`),
);

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    server.close();
    void close().then(() => process.exit(0));
  });
}
