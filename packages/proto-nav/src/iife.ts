// IIFE entry: tsup wraps this module's exports as `window.ProtoNav`
// (globalName: "ProtoNav"). Export only the named API so the global is exactly
// `{ init, open, close, destroy }` — usable as `ProtoNav.init({ ... })`.
export { init, open, close, destroy } from "./index";
