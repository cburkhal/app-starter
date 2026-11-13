// Example resource. Pattern: Zod schemas -> createRoute -> handler that ALWAYS scopes by user.
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, desc, eq, sql } from "drizzle-orm";
import { note } from "../db/schema";
import { ErrorSchema, errorResponses } from "../lib/errors";
import { requireUser, userId } from "../lib/require-user";
import type { AppEnv } from "../lib/types";

const NoteSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    body: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi("Note");

const NoteInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().max(10_000).default(""),
  })
  .openapi("NoteInput");

const StatsSchema = z
  .array(z.object({ day: z.string(), count: z.number().int() }))
  .openapi("NoteStats");

const IdParam = z.object({ id: z.uuid().openapi({ param: { name: "id", in: "path" } }) });

const notFound = {
  404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
} as const;

const toDto = (n: typeof note.$inferSelect) => ({
  id: n.id,
  title: n.title,
  body: n.body,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});

export const notes = new OpenAPIHono<AppEnv>();
notes.use("*", requireUser);

notes.openapi(
  createRoute({
    method: "get",
    path: "/",
    operationId: "listNotes",
    tags: ["notes"],
    responses: {
      200: {
        description: "Notes of the current user",
        content: { "application/json": { schema: z.array(NoteSchema) } },
      },
      ...errorResponses,
    },
  }),
  async (c) => {
    const rows = await c.var.db
      .select()
      .from(note)
      .where(eq(note.userId, userId(c)))
      .orderBy(desc(note.createdAt));
    return c.json(rows.map(toDto), 200);
  },
);

notes.openapi(
  createRoute({
    method: "get",
    path: "/stats",
    operationId: "noteStats",
    tags: ["notes"],
    summary: "Notes created per day (last 30 days), for the chart",
    responses: {
      200: {
        description: "Daily counts",
        content: { "application/json": { schema: StatsSchema } },
      },
      ...errorResponses,
    },
  }),
  async (c) => {
    const day = sql<string>`to_char(${note.createdAt}, 'YYYY-MM-DD')`;
    const rows = await c.var.db
      .select({ day, count: sql<number>`count(*)::int` })
      .from(note)
      .where(and(eq(note.userId, userId(c)), sql`${note.createdAt} > now() - interval '30 days'`))
      .groupBy(day)
      .orderBy(day);
    return c.json(rows, 200);
  },
);

notes.openapi(
  createRoute({
    method: "post",
    path: "/",
    operationId: "createNote",
    tags: ["notes"],
    request: { body: { content: { "application/json": { schema: NoteInputSchema } } } },
    responses: {
      201: { description: "Created", content: { "application/json": { schema: NoteSchema } } },
      ...errorResponses,
    },
  }),
  async (c) => {
    const input = c.req.valid("json");
    const [row] = await c.var.db
      .insert(note)
      .values({ ...input, userId: userId(c) })
      .returning();
    if (!row) throw new Error("insert returned no row");
    return c.json(toDto(row), 201);
  },
);

notes.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    operationId: "deleteNote",
    tags: ["notes"],
    request: { params: IdParam },
    responses: { 204: { description: "Deleted" }, ...errorResponses, ...notFound },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const deleted = await c.var.db
      .delete(note)
      .where(and(eq(note.id, id), eq(note.userId, userId(c))))
      .returning({ id: note.id });
    if (deleted.length === 0) return c.json({ error: "not found" }, 404);
    return c.body(null, 204);
  },
);
