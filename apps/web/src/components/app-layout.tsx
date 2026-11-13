import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth";
import { useConfig } from "@/lib/config";

// Guard + shell for all logged-in pages.
export function AppLayout() {
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;

  const { data: config } = useConfig();
  const analytics = Boolean(config?.posthog);

  useEffect(() => {
    if (analytics) void import("@/lib/telemetry").then((t) => t.identify(user));
  }, [analytics, user]);

  if (isPending) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto grid max-w-3xl gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">App</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{user.email}</span>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
