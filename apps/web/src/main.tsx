import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppLayout } from "@/components/app-layout";
import { NotesPage } from "@/features/notes/notes-page";
import { fetchConfig } from "@/lib/config";
import { LoginPage } from "@/pages/login";
import "./index.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

// Routes: add new feature pages as children of AppLayout (= login required).
const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [{ index: true, element: <NotesPage /> }],
  },
]);

queryClient
  .fetchQuery({ queryKey: ["config"], queryFn: fetchConfig })
  // Lazy: Sentry/PostHog are only downloaded when configured.
  .then(async (cfg) => {
    if (cfg.sentryDsn || cfg.posthog) (await import("@/lib/telemetry")).initTelemetry(cfg);
  })
  .catch((err) => console.warn("config unavailable", err));

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
