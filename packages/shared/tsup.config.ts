import { defineConfig } from "tsup";

// ESM + CJS + declarations. No IIFE build: this package is a library of
// primitives, not a drop-in widget — proto-nav and annotations inline it into
// their own bundles (see their `noExternal`), and other consumers import it.
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
