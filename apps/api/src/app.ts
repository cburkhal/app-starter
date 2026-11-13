import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import * as Sentry from "@sentry/node";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import type { Auth } from "./auth";
import type { Db } from "./db";
import { type Env, keycloakEnabled } from "./env";
import type { AppEnv } from "./lib/types";
import { notes } from "./routes/notes";

const ConfigSchema = z
  .object({
    auth: z.object({ emailPassword: z.boolean(), providers: z.array(z.string()) }),
    sentryDsn: z.string().nullable(),
    posthog: z.object({ key: z.string(), host: z.string() }).nullable(),
  })
  .openapi("PublicConfig");

export function createApp({ db, env, auth }: { db: Db; env: Env; auth: Auth }) {
  const app = new OpenAPIHono<AppEnv>({
    // Uniform 400 for Zod validation errors.
    defaultHook: (result, c) => {
      if (!result.success)
        return c.json({ error: result.error.issues[0]?.message ?? "invalid" }, 400);
    },
  }).basePath("/api");

  if (env.NODE_ENV !== "test") app.use("*", logger());
  app.use("*", secureHeaders());

  app.use("*", async (c, next) => {
    c.set("db", db);
    c.set("env", env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("user", session?.user ?? null);
    await next();
  });

  app.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));

  app.get("/health", (c) => c.json({ ok: true }));

  app.openapi(
    createRoute({
      method: "get",
      path: "/config",
      operationId: "getConfig",
      tags: ["meta"],
      summary: "Public runtime config for the SPA (auth providers, analytics keys)",
      responses: {
        200: { description: "Config", content: { "application/json": { schema: ConfigSchema } } },
      },
    }),
    (c) =>
      c.json(
        {
          auth: {
            emailPassword: env.AUTH_EMAIL_PASSWORD,
            providers: keycloakEnabled(env) ? ["keycloak"] : [],
          },
          sentryDsn: env.PUBLIC_SENTRY_DSN || null,
          posthog: env.PUBLIC_POSTHOG_KEY
            ? { key: env.PUBLIC_POSTHOG_KEY, host: env.PUBLIC_POSTHOG_HOST }
            : null,
        },
        200,
      ),
  );

  app.route("/notes", notes);

  app.doc31("/openapi.json", {
    openapi: "3.1.0",
    info: { title: "App API", version: "0.1.0" },
  });

  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse();
    Sentry.captureException(err);
    console.error(err);
    return c.json({ error: "internal error" }, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
