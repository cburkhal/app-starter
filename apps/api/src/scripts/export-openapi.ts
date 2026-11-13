// Writes the OpenAPI spec to packages/contract. The spec is the contract between web and API:
// any backend (TypeScript today, Rust tomorrow) must serve exactly this.
import { writeFileSync } from "node:fs";
import { createApp } from "../app";
import { createAuth } from "../auth";
import type { Db } from "../db";
import { loadEnv } from "../env";

const out = process.argv[2] ?? "openapi.json";
const env = loadEnv({ NODE_ENV: "test" });
const db = {} as Db; // never queried while generating the document
const app = createApp({ db, env, auth: createAuth(db, env) });
const doc = app.getOpenAPI31Document({
  openapi: "3.1.0",
  info: { title: "App API", version: "0.1.0" },
});
writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote ${out}`);
