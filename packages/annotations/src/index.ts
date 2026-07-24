import { normalizeConfig, resolveConfig } from "./config";
import { mount, unmount } from "./core/mount";
import {
  allCollapsed,
  annotations as annStore,
  collapseAll as collapseAllStore,
  config as cfgStore,
  expandAll as expandAllStore,
  expandedIds,
  hide as hideStore,
  minimizedIds,
  picking,
  rescan,
  setMinimizedIds as setMinimizedIdsStore,
  show as showStore,
  startPicking as startPickingStore,
  stopPicking as stopPickingStore,
  toggle as toggleStore,
  toggleCollapseAll as toggleCollapseAllStore,
  toast,
  visible,
} from "./core/store";
import { coerceAnnotations, fetchSheet, fetchSnapshot } from "./sheet";
import type { Annotation, AnnotationsConfig } from "./types";

export type { Annotation, AnnotationsConfig, Placement } from "./types";

let pollTimer: ReturnType<typeof setInterval> | null = null;
let observer: MutationObserver | null = null;
let rescanQueued = false;
let parentControlAdded = false;

/** Let an embedding parent frame (e.g. a proto-nav live preview) mirror its
 *  show/hide-notes state into this widget, so previews reflect the notes toggle.
 *  Only responds to the specific message type and only toggles visibility. */
function setupParentControl(): void {
  if (parentControlAdded || typeof window === "undefined") return;
  parentControlAdded = true;
  window.addEventListener("message", (e: MessageEvent) => {
    const d = e.data as { type?: unknown; show?: unknown } | null;
    if (!d || typeof d !== "object" || d.type !== "proto-nav:notes") return;
    if (d.show) showStore();
    else hideStore();
  });
}

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
  setupParentControl();
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

/** Collapse every annotation to its number badge — notes stay on the page and
 *  anchored, just out of the way. Driven by external UIs such as proto-nav. */
export function collapseAll(): void {
  collapseAllStore();
}

/** Expand every annotation back to a full callout. */
export function expandAll(): void {
  expandAllStore();
}

/** Flip between collapsed-to-badges and fully expanded. */
export function toggleCollapseAll(): void {
  toggleCollapseAllStore();
}

/** Whether annotations are currently collapsed to badges. */
export function isCollapsed(): boolean {
  return allCollapsed.value;
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

/** Replace which annotations are collapsed to just their number badge. Lets a
 *  host app draw attention to a subset of callouts in response to its own
 *  state changes (e.g. a modal opening) — pass every other loaded id to
 *  collapse, or an empty array to expand everything. Takes precedence over
 *  `collapseAll()`, exiting that mode if it was on. */
export function setMinimized(ids: Iterable<string>): void {
  setMinimizedIdsStore(ids);
}

/** Enter target-picking mode: click a host element to copy its `target` string
 *  (for pasting into the sheet). Driven by external UIs such as proto-nav. */
export function startPicking(): void {
  startPickingStore();
}

/** Leave target-picking mode. */
export function stopPicking(): void {
  stopPickingStore();
}

/** Whether target-picking mode is currently active. */
export function isPicking(): boolean {
  return picking.value;
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
  picking.value = false;
  toast.value = null;
  allCollapsed.value = false;
  expandedIds.value = new Set();
  minimizedIds.value = new Set();
  unmount();
}

export const Annotations = {
  init,
  show,
  hide,
  toggle,
  collapseAll,
  expandAll,
  toggleCollapseAll,
  isCollapsed,
  setMinimized,
  refresh,
  isVisible,
  startPicking,
  stopPicking,
  isPicking,
  destroy,
};
export default Annotations;
