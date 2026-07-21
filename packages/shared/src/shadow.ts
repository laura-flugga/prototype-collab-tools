/** Shadow-DOM host primitive shared by every prototype-collab widget.
 *
 *  Each widget mounts exactly one zero-size host `<div>` at `document.body`,
 *  attaches an open shadow root, injects its CSS, and renders its Preact tree
 *  into the returned root element. The shadow root is what isolates the widget's
 *  styles from the host page (and the host's from the widget). */

export interface ShadowHost {
  /** The host element appended to `document.body`. */
  host: HTMLDivElement;
  /** The element inside the shadow root to render the Preact tree into. */
  root: HTMLDivElement;
}

/** Create the host + shadow root once. Returns `null` if a host with `id`
 *  already exists (idempotent mount guard). */
export function createShadowHost(id: string, css: string, rootClass: string): ShadowHost | null {
  if (document.getElementById(id)) return null;

  const host = document.createElement("div");
  host.id = id;
  // Keep the host out of layout; all visible UI is position:fixed inside.
  host.style.position = "absolute";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "0";
  host.style.height = "0";

  const shadow = host.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  shadow.appendChild(styleEl);

  const root = document.createElement("div");
  root.className = rootClass;
  shadow.appendChild(root);

  document.body.appendChild(host);
  return { host, root };
}

/** Look up an existing host's render root, if mounted. */
export function getShadowRoot(id: string, rootClass: string): HTMLElement | null {
  const host = document.getElementById(id);
  return (host?.shadowRoot?.querySelector(`.${rootClass}`) as HTMLElement | null) ?? null;
}

/** Remove a host element (and its shadow tree) from the DOM. */
export function removeShadowHost(id: string): HTMLElement | null {
  const host = document.getElementById(id);
  if (!host) return null;
  const root = host.shadowRoot?.querySelector(":scope > *:not(style)") as HTMLElement | null;
  host.remove();
  return root;
}
