import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "./types";

// Router-level guard: mount on every router that needs a logged-in user.
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.var.user) return c.json({ error: "unauthorized" }, 401);
  await next();
});

/** Current user's id inside a handler. ALWAYS scope queries by this. */
export function userId(c: Context<AppEnv>): string {
  const user = c.var.user;
  if (!user) {
    throw new HTTPException(401, {
      res: Response.json({ error: "unauthorized" }, { status: 401 }),
    });
  }
  return user.id;
}
