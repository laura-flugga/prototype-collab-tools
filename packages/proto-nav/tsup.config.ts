import { defineConfig } from "tsup";

const jsx = (o: Record<string, unknown>) => {
  o.jsx = "automatic";
  o.jsxImportSource = "preact";
};

export default defineConfig([
  // Library build: ESM + CJS + type declarations for npm consumers.
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    // Bundle the private workspace package into the output (never published).
    noExternal: ["@proto-collab/shared"],
    outExtension({ format }) {
      return { js: format === "cjs" ? ".cjs" : ".js" };
    },
    esbuildOptions: jsx,
  },
  // IIFE build: single minified file exposing window.ProtoNav for a zero-install <script> / CDN drop-in.
  {
    entry: { "proto-nav.iife": "src/iife.ts" },
    format: ["iife"],
    globalName: "ProtoNav",
    minify: true,
    sourcemap: true,
    treeshake: true,
    noExternal: ["@proto-collab/shared"],
    // Emit dist/proto-nav.iife.js (override tsup's default ".global.js" suffix).
    outExtension: () => ({ js: ".js" }),
    esbuildOptions: jsx,
  },
]);
