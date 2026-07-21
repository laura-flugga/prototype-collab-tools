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
    noExternal: ["@proto-collab/shared"],
    outExtension({ format }) {
      return { js: format === "cjs" ? ".cjs" : ".js" };
    },
    esbuildOptions: jsx,
  },
  // IIFE build: single minified file. Auto-boots from the <script> tag's
  // data-* attributes; also exposes window.Annotations for programmatic use.
  {
    entry: { "annotations.iife": "src/iife.ts" },
    format: ["iife"],
    globalName: "Annotations",
    minify: true,
    sourcemap: true,
    treeshake: true,
    noExternal: ["@proto-collab/shared"],
    outExtension: () => ({ js: ".js" }),
    esbuildOptions: jsx,
  },
]);
