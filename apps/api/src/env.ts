import { z } from "zod";

// All configuration comes from environment variables, validated once at startup.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default("postgres://app:app@localhost:5432/app"),
  // Public URL the browser uses, e.g. https://notes.example.com (dev: Vite at :5173)
  APP_URL: z.url().default("http://localhost:5173"),
  BETTER_AUTH_SECRET: z.string().min(32).default("dev-secret-change-me-dev-secret-change-me"),
  // Set to "false" to disable email/password and force SSO.
  AUTH_EMAIL_PASSWORD: z.stringbool().default(true),
  // Optional Keycloak (or any OIDC provider via issuer). Enabled when all three are set.
  KEYCLOAK_ISSUER: z.url().optional(),
  KEYCLOAK_CLIENT_ID: z.string().optional(),
  KEYCLOAK_CLIENT_SECRET: z.string().optional(),
  // Optional observability (cloud free tiers). Empty = disabled.
  SENTRY_DSN: z.string().optional(),
  PUBLIC_SENTRY_DSN: z.string().optional(),
  PUBLIC_POSTHOG_KEY: z.string().optional(),
  PUBLIC_POSTHOG_HOST: z.string().default("https://eu.i.posthog.com"),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  // Empty strings (e.g. "KEY=" in .env) count as unset.
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== ""));
  const env = schema.parse(cleaned);
  if (env.NODE_ENV === "production" && env.BETTER_AUTH_SECRET.startsWith("dev-secret")) {
    throw new Error("BETTER_AUTH_SECRET must be set in production (openssl rand -base64 32)");
  }
  return env;
}

export const keycloakEnabled = (env: Env) =>
  Boolean(env.KEYCLOAK_ISSUER && env.KEYCLOAK_CLIENT_ID && env.KEYCLOAK_CLIENT_SECRET);
