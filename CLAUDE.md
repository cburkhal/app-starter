# CLAUDE.md

Starter for prototypes. TypeScript monorepo: Vite SPA + Hono API + Postgres, deployed with Docker Compose (Raspberry Pi 4 friendly).

## Commands
- `pnpm dev`: API on :3000 + web on :5173 (needs Postgres: `pnpm db:up`, or a local Postgres with app/app)
- `pnpm check`: lint + typecheck + tests. **Run before saying a task is done.**
- `pnpm contract`: regenerate OpenAPI spec + typed client after any API route change
- `pnpm db:generate`: create a migration after changing `apps/api/src/db/schema.ts` (applied on API start)
- `pnpm format`: autofix lint/format (Biome)
- `pnpm --filter @app/web e2e`: Playwright smoke test against the running dev stack

## Layout
- `apps/api` Hono + `@hono/zod-openapi`, Drizzle, Better Auth. Tests use in-memory PGlite (`test/setup.ts`).
- `apps/web` Vite + React 19, React Router, TanStack Query, shadcn/ui (Tailwind v4), Recharts.
- `packages/contract` `openapi.json` + generated `schema.d.ts`. Generated, never edit by hand.
- `deploy/` Caddyfile, backup script, Kustomize base (`deploy/base`, also holds the backup script used by compose) and overlays. New env vars: add to `.env.example` and `deploy/overlays/example/secret.env.example`.
- `apps/*/src/**/notes*` is the **example feature**. Copy its pattern, delete it in real apps.

## Architecture rules (do not break)
1. **The OpenAPI contract is the boundary.** The web app calls the backend only via `api` from `@/lib/api` (openapi-fetch). No business logic in the web app that belongs on the server. The backend must stay replaceable (e.g. by Rust) as long as it serves `packages/contract/openapi.json`.
2. **Every API route is defined with `createRoute` + Zod** (request and response schemas, `operationId`), so it appears in the contract.
3. **Authorization: every query on user data is scoped by `userId(c)`.** Never trust ids from the client alone. Add a test that user B cannot read/modify user A's data.
4. Auth is Better Auth under `/api/auth/*` (cookie session). Don't hand-roll auth. Keycloak/OIDC is env-toggled (`KEYCLOAK_*`). Other backends verify users via JWT (`/api/auth/token`, `/api/auth/jwks`).
5. Config only via env, validated in `apps/api/src/env.ts`. Public browser config is served by `GET /api/config` (no build-time secrets in the SPA).
6. Never commit secrets. `.env` is gitignored; document new vars in `.env.example`.

## Adding a feature (checklist)
1. Table in `apps/api/src/db/schema.ts` -> `pnpm db:generate`
2. Router in `apps/api/src/routes/<feature>.ts` (copy `notes.ts`), mount in `src/app.ts`
3. Tests in `apps/api/test/<feature>.test.ts` (happy path, validation, user isolation)
4. `pnpm contract`
5. Web: `src/features/<feature>/api.ts` (query hooks) + page components; route in `src/main.tsx`
6. `pnpm check`

## Conventions
- UI: use shadcn components (`npx shadcn@latest add <name>`, or the shadcn MCP). Don't edit `components/ui/*` unless needed; compose instead. Charts: shadcn `ChartContainer` + Recharts, colors via `--chart-N`.
- Imports: `@/` alias in web. Biome formats (double quotes, 2 spaces, width 100).
- Keep files small and feature-scoped. Prefer boring, explicit code over abstractions.
- Prod API is bundled into one file (tsup); runtime image has no node_modules.
