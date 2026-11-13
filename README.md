# app-starter

Opinionated starter for building prototypes fast with AI coding agents, and running them on your own hardware (down to a Raspberry Pi 4).

**Stack:** Vite + React + shadcn/ui + Recharts · Hono API with an OpenAPI contract · Postgres + Drizzle · Better Auth (optional Keycloak SSO) · Sentry + PostHog (optional) · Docker Compose + Caddy · multi-arch images (amd64/arm64).

```
apps/web            SPA (served by Caddy in production)
apps/api            REST API, auth, migrations
packages/contract   OpenAPI spec + generated TS types = the contract between the two
```

The web app only talks to the API through the OpenAPI contract, so the backend can later be rewritten (e.g. in Rust with Axum + utoipa) without touching the frontend.

## Start a new app from this template

```bash
gh repo create my-idea --template cburkhal/app-starter --private --clone
cd my-idea && pnpm install
cp .env.example .env
pnpm db:up          # Postgres in Docker (or use a local Postgres: user/password/db = app)
pnpm dev            # http://localhost:5173
```

Then: delete the example `notes` feature when you build your own, and edit `CLAUDE.md` with what the app is about.

## Daily commands

| Command | What |
|---|---|
| `pnpm dev` | API + web with hot reload |
| `pnpm check` | lint, typecheck, tests (run before committing) |
| `pnpm contract` | regenerate OpenAPI + client after API changes |
| `pnpm db:generate` | new migration after schema changes |
| `pnpm --filter @app/web e2e` | Playwright smoke test (stack must be running) |

## Deploy on a Raspberry Pi (or any Docker host)

Images are built for amd64 + arm64 by GitHub Actions on every push to `main` and pushed to GHCR (`ghcr.io/<owner>/<repo>-api|web`). The Pi only pulls, it never builds.

```bash
# on the Pi (64-bit OS, Docker installed)
git clone https://github.com/<you>/<repo> && cd <repo>
cp .env.example .env    # set APP_URL, BETTER_AUTH_SECRET, POSTGRES_PASSWORD, SITE_ADDRESS
docker compose pull && docker compose up -d
```

- `SITE_ADDRESS=:80` serves plain HTTP on the LAN. Set it to a domain for automatic HTTPS (ports 80/443 reachable).
- Each app has its own Postgres. For several apps on one Pi, give each a different `APP_NAME` and `HTTP_PORT`, or put one shared reverse proxy in front.
- GHCR packages are private by default: either make them public in the package settings, or `docker login ghcr.io` on the Pi.
- Footprint: roughly 150-250 MB RAM for Caddy + API + Postgres when idle.
- **Backups:** the `backup` service dumps the database nightly to `./backups` (`BACKUP_CRON`, keeps `BACKUP_KEEP_DAYS`, default 7). That's still on the Pi's disk: copy the folder somewhere else (NAS, rsync, restic). Manual dump: `docker compose exec backup backup.sh`.
- **Restore:** `gunzip -c backups/<file>.sql.gz | docker compose exec -T db psql -U app app`

## Deploy on Kubernetes (desktop / heavier workloads)

Same images (amd64), managed with Kustomize: `deploy/kustomization.yaml` is the base (Postgres StatefulSet, API, web, Ingress, nightly backup CronJob into a PVC), `deploy/overlays/example` shows a per-environment overlay.

```bash
cp -r deploy/overlays/example deploy/overlays/desktop
cd deploy/overlays/desktop
cp secret.env.example secret.env     # APP_URL, BETTER_AUTH_SECRET, POSTGRES_PASSWORD (hex)
# edit kustomization.yaml: namespace, image names/tags, ingress host
kubectl apply -k .
```

Needs a default StorageClass and an Ingress controller. Add TLS (e.g. cert-manager) in your overlay. CI validates the example overlay against a real API server (kind).

## Auth

- Email + password by default (Better Auth, sessions in Postgres, httpOnly cookies).
- **Keycloak / OIDC:** set `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`. Redirect URI: `<APP_URL>/api/auth/callback/keycloak`. Set `AUTH_EMAIL_PASSWORD=false` for SSO only.
- **Other backends** (e.g. a Rust service) verify users with JWTs: the client gets one from `GET /api/auth/token`, the service validates it against `GET /api/auth/jwks`. No shared database or secret needed.

## Observability (optional)

Set `SENTRY_DSN` (API), `PUBLIC_SENTRY_DSN` and `PUBLIC_POSTHOG_KEY` (browser). Browser keys are delivered at runtime via `/api/config`, so the same image works everywhere. Sentry/PostHog code is only downloaded by the browser when configured.

## Security baseline

Better Auth (rate-limited auth endpoints in production), Zod validation on every route, per-user query scoping with tests, secure headers, secrets only via env, gitleaks (pre-commit + CI), Renovate for dependency updates.

## Known tradeoffs

- The production API is bundled into one file to keep images tiny. Sentry still captures errors, but automatic tracing spans are not recorded.
- `components/ui/chart.tsx` is a lite version of shadcn's chart. Replace with `npx shadcn@latest add chart` if you need legends or advanced tooltips.
- Migrations run on API start (fine for one instance; switch to a separate migrate step when scaling out).
