import { createAuthClient } from "better-auth/react";

// Talks to Better Auth under /api/auth (same origin). Session = httpOnly cookie.
// Keycloak (when enabled on the API) is a regular provider: signIn.social({ provider: "keycloak" }).
export const authClient = createAuthClient({ basePath: "/api/auth" });

export const { useSession, signIn, signUp, signOut } = authClient;
