import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "./setup";

let t: Awaited<ReturnType<typeof createTestApp>>;
beforeAll(async () => {
  t = await createTestApp();
});
afterAll(() => t.close());

describe("notes", () => {
  it("rejects anonymous requests", async () => {
    const res = await t.request("/api/notes");
    expect(res.status).toBe(401);
  });

  it("creates, lists and aggregates notes for the current user", async () => {
    const alice = await t.signUp("alice@example.com");
    const created = await t.request(
      "/api/notes",
      { method: "POST", body: JSON.stringify({ title: "Hello", body: "World" }) },
      alice,
    );
    expect(created.status).toBe(201);

    const list = await (await t.request("/api/notes", {}, alice)).json();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Hello");

    const stats = await (await t.request("/api/notes/stats", {}, alice)).json();
    expect(stats).toEqual([{ day: expect.any(String), count: 1 }]);
  });

  it("validates input", async () => {
    const bob = await t.signUp("bob@example.com");
    const res = await t.request(
      "/api/notes",
      { method: "POST", body: JSON.stringify({ title: "" }) },
      bob,
    );
    expect(res.status).toBe(400);
  });

  it("isolates users: no reading or deleting other users' notes", async () => {
    const carol = await t.signUp("carol@example.com");
    const dave = await t.signUp("dave@example.com");
    const note = await (
      await t.request("/api/notes", { method: "POST", body: JSON.stringify({ title: "c" }) }, carol)
    ).json();

    expect(await (await t.request("/api/notes", {}, dave)).json()).toEqual([]);
    const del = await t.request(`/api/notes/${note.id}`, { method: "DELETE" }, dave);
    expect(del.status).toBe(404);
    const own = await t.request(`/api/notes/${note.id}`, { method: "DELETE" }, carol);
    expect(own.status).toBe(204);
  });
});

describe("meta", () => {
  it("exposes public config without secrets", async () => {
    const cfg = await (await t.request("/api/config")).json();
    expect(cfg.auth).toEqual({ emailPassword: true, providers: [] });
  });

  it("issues verifiable JWTs for other backends", async () => {
    const eve = await t.signUp("eve@example.com");
    const token = await t.request("/api/auth/token", {}, eve);
    expect(token.status).toBe(200);
    expect((await token.json()).token).toMatch(/^ey/);
    const jwks = await (await t.request("/api/auth/jwks")).json();
    expect(jwks.keys.length).toBeGreaterThan(0);
  });
});

describe("keycloak toggle", () => {
  it("advertises keycloak when configured", async () => {
    const k = await createTestApp({
      KEYCLOAK_ISSUER: "https://sso.example.com/realms/demo",
      KEYCLOAK_CLIENT_ID: "app",
      KEYCLOAK_CLIENT_SECRET: "secret",
    });
    const cfg = await (await k.request("/api/config")).json();
    expect(cfg.auth.providers).toEqual(["keycloak"]);
    await k.close();
  });
});
