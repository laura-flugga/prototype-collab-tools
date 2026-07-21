import { render } from "preact";
import { createShadowHost, getShadowRoot, removeShadowHost } from "@proto-collab/shared";
import { App } from "../ui/App";
import { styles } from "./styles";

const HOST_ID = "proto-nav-host";
const ROOT_CLASS = "pn-root";

/** Create (once) an isolated shadow host and render the Preact tree inside it.
 *  Idempotent — a second call is a no-op guarded by the singleton host id. */
export function mount(): void {
  const created = createShadowHost(HOST_ID, styles, ROOT_CLASS);
  if (!created) return; // already mounted
  render(<App />, created.root);
}

/** Tear down the widget entirely and remove its host from the DOM. */
export function unmount(): void {
  const root = getShadowRoot(HOST_ID, ROOT_CLASS);
  if (root) render(null, root);
  removeShadowHost(HOST_ID);
}
