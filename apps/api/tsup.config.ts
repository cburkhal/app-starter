import { defineConfig } from "tsup";

// Bundles the API and all dependencies into dist/index.js: the runtime image needs no node_modules.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  noExternal: [/.*/],
  // Optional/native/dev-only modules that must not be bundled.
  external: ["pg-native", "@electric-sql/pglite", "kysely", "drizzle-kit"],
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
});
