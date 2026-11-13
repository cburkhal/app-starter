import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth, keycloak } from "better-auth/plugins/generic-oauth";
import { jwt } from "better-auth/plugins/jwt";
import type { Db } from "./db";
import * as schema from "./db/schema";
import { type Env, keycloakEnabled } from "./env";

export function createAuth(db: Db, env: Env) {
  const sso = keycloakEnabled(env)
    ? [
        genericOAuth({
          config: [
            keycloak({
              issuer: env.KEYCLOAK_ISSUER as string,
              clientId: env.KEYCLOAK_CLIENT_ID as string,
              clientSecret: env.KEYCLOAK_CLIENT_SECRET as string,
            }),
          ],
        }),
      ]
    : [];

  return betterAuth({
    baseURL: env.APP_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL],
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: env.AUTH_EMAIL_PASSWORD },
    // Built-in brute-force protection on auth endpoints (on in production).
    // Client IP comes from the reverse proxy (Caddy sets X-Forwarded-For).
    rateLimit: { enabled: env.NODE_ENV === "production" },
    advanced: { ipAddress: { ipAddressHeaders: ["x-forwarded-for"] } },
    // jwt(): exposes /api/auth/jwks and /api/auth/token so any other backend
    // (e.g. a future Rust service) can verify users without sharing the database.
    plugins: [jwt(), ...sso],
  });
}

export type Auth = ReturnType<typeof createAuth>;
