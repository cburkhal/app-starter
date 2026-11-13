import { useState } from "react";
import { Navigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, useSession } from "@/lib/auth";
import { useConfig } from "@/lib/config";

export function LoginPage() {
  const { data: session } = useSession();
  const { data: config } = useConfig();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    setError(null);
    const res =
      mode === "sign-in"
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name: email.split("@")[0] ?? email });
    setPending(false);
    if (res.error) setError(res.error.message ?? "Something went wrong");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "sign-in" ? "Sign in" : "Create account"}</CardTitle>
          <CardDescription>Welcome. Use your email or SSO.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {config?.auth.emailPassword && (
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  required
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" disabled={pending}>
                {mode === "sign-in" ? "Sign in" : "Sign up"}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              >
                {mode === "sign-in" ? "No account? Sign up" : "Have an account? Sign in"}
              </Button>
            </form>
          )}
          {config?.auth.providers.includes("keycloak") && (
            <Button
              variant="outline"
              onClick={() => signIn.social({ provider: "keycloak", callbackURL: "/" })}
            >
              Continue with SSO
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
