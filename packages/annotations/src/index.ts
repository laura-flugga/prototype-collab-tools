import { normalizeConfig, resolveConfig } from "./config";
import { mount, unmount } from "./core/mount";
import {
  annotations as annStore,
  config as cfgStore,
  hide as hideStore,
  rescan,
  show as showStore,
  toggle as toggleStore,
  visible,
} from "./core/store";
import { coerceAnnotations, fetchSheet, fetchSnapshot } from "./sheet";
import type { Annotation, AnnotationsConfig } from "./types";

export type { Annotation, AnnotationsConfig, Placement } from "./types";

let pollTimer: ReturnType<typeof setInterval> | null = null;
let observer: MutationObserver | null = null;
let rescanQueued = false;

/** Resolve the annotation set for a raw config, by precedence:
 *  inline `annotations` > `snapshotUrl` > `sheetUrl`. */
async function load(raw: AnnotationsConfig): Promise<Annotation[]> {
  if (raw.annotations && raw.annotations.length > 0) return coerceAnnotations(raw.annotations);
  if (raw.snapshotUrl) return fetchSnapshot(raw.snapshotUrl);
  if (raw.sheetUrl) return fetchSheet(raw.sheetUrl);
  return [];
}

/** Coalesce rapid re-scan requests (e.g. MutationObserver bursts) into one per frame. */
function queueRescan(): void {
  if (rescanQueued) return;
  rescanQueued = true;
  requestAnimationFrame(() => {
    rescanQueued = false;
    if (visible.value) rescan();
  });
}

/** Mount the widget and begin loading annotations. Idempotent: calling again
 *  re-resolves config and reloads. */
export function init(arg?: AnnotationsConfig): void {
  const raw = resolveConfig(arg);
  const norm = normalizeConfig(raw);

  mount();
  cfgStore.value = norm;
  if (norm.startVisible) visible.value = true;

  const refresh = () =>
    load(raw)
      .then((a) => {
        annStore.value = a;
        rescan();
      })
      .catch((err) => {
        if (norm.debug) console.error("[annotations]", err);
      });
  void refresh();

  // Optional polling so an open prototype picks up sheet edits without reload.
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = norm.pollMs > 0 ? setInterval(refresh, norm.pollMs) : null;

  // Watch the DOM so late-mounting SPA targets get anchored when they appear.
  observer?.disconnect();
  observer = null;
  if (norm.observe && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(queueRescan);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

/** Show annotations (re-scans targets). */
export function show(): void {
  showStore();
}

/** Hide annotations. */
export function hide(): void {
  hideStore();
}

/** Toggle annotation visibility. */
export function toggle(): void {
  toggleStore();
}

/** Force an immediate re-scan of anchor targets. */
export function refresh(): void {
  rescan();
}

/** Whether annotations are currently shown. Lets external UIs (e.g. proto-nav)
 *  reflect the current state. */
export function isVisible(): boolean {
  return visible.value;
}

/** Remove the widget entirely and stop polling/observing. */
export function destroy(): void {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  observer?.disconnect();
  observer = null;
  annStore.value = [];
  cfgStore.value = null;
  visible.value = false;
  unmount();
}

export const Annotations = { init, show, hide, toggle, refresh, isVisible, destroy };
export default Annotations;
