import type { Schemas } from "@app/contract";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

// Keys come from the API at runtime (/api/config), so one image works in every environment.
export function initTelemetry(config: Schemas["PublicConfig"]) {
  if (config.sentryDsn) Sentry.init({ dsn: config.sentryDsn, tracesSampleRate: 0.1 });
  if (config.posthog) {
    posthog.init(config.posthog.key, {
      api_host: config.posthog.host,
      person_profiles: "identified_only",
    });
  }
}

export function identify(user: { id: string; email: string } | null) {
  if (!posthog.__loaded) return;
  if (user) posthog.identify(user.id, { email: user.email });
  else posthog.reset();
}
