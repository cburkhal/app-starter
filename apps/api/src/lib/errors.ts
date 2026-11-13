import { z } from "@hono/zod-openapi";

export const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

export const errorResponses = {
  401: {
    description: "Not authenticated",
    content: { "application/json": { schema: ErrorSchema } },
  },
} as const;
