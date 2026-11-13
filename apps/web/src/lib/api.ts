// Typed API client generated from the OpenAPI contract (packages/contract).
// The web app talks to the backend ONLY through this client, so the backend can be swapped
// (e.g. for Rust) as long as it serves the same contract.
import type { paths } from "@app/contract";
import createClient from "openapi-fetch";

export const api = createClient<paths>({ baseUrl: "", credentials: "include" });

/** Unwraps an openapi-fetch result or throws, for use inside TanStack Query. */
export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await promise;
  if (error || !response.ok) {
    const message =
      (error as { error?: string } | undefined)?.error ??
      `${response.status} ${response.statusText}`;
    throw new Error(message);
  }
  return data as T;
}
