import { signal } from "@preact/signals";
import type { Annotation, NormalizedConfig } from "../types";

/** Reactive state shared between the imperative API and the Preact tree. */
export const annotations = signal<Annotation[]>([]);
export const config = signal<NormalizedConfig | null>(null);
export const visible = signal(false);
/** Bumped to force a re-scan of the DOM for anchor targets (toggle / mutations). */
export const scanTick = signal(0);
/** Id of the annotation raised to the front (clicked last). */
export const focusedId = signal<string | null>(null);
/** Ids of annotations collapsed to just their number badge. */
export const minimizedIds = signal<Set<string>>(new Set());
/** "Collapse all" mode: every marker renders as a badge — including ones that
 *  appear later (new targets, re-clustering) — unless expanded individually. */
export const allCollapsed = signal(false);
/** Ids expanded one-by-one while `allCollapsed` is on. */
export const expandedIds = signal<Set<string>>(new Set());
/** True while the author is in target-picking mode (an authoring aid). */
export const picking = signal(false);
/** Transient confirmation message (e.g. "Copied: save"); null when hidden. It
 *  outlives pick mode so the toast survives the auto-exit after a pick. */
export const toast = signal<string | null>(null);

// Ids we auto-collapsed to un-obscure the current selection, so we can restore
// exactly those (and not user-minimized ones) when the selection changes/clears.
let autoCollapsed = new Set<string>();

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
function intersects(a: Box, b: Box): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function restoreAutoCollapsed(): void {
  if (autoCollapsed.size === 0) return;
  const next = new Set(minimizedIds.value);
  autoCollapsed.forEach((id) => next.delete(id));
  autoCollapsed = new Set();
  minimizedIds.value = next;
}

/** Collapse any OTHER expanded callouts overlapping the focused one, so the
 *  selection is never obscured. Measured synchronously from the live DOM — the
 *  callouts are already positioned by the time a user clicks one, and raising
 *  z-index doesn't change geometry. */
function collapseOverlapping(id: string): void {
  // In collapse-all mode a click expands exactly one marker; nothing to un-obscure.
  if (allCollapsed.value) return;
  const root = document.getElementById("annotations-host")?.shadowRoot;
  if (!root) return;
  const els = [...root.querySelectorAll<HTMLElement>(".an-callout[data-ann-id]")];
  const focusedEl = els.find((el) => el.dataset.annId === id);
  if (!focusedEl) return;
  const fr = focusedEl.getBoundingClientRect();
  const collapse = new Set<string>();
  for (const el of els) {
    const oid = el.dataset.annId;
    if (!oid || oid === id) continue;
    if (intersects(fr, el.getBoundingClientRect())) collapse.add(oid);
  }
  if (collapse.size === 0) return;
  autoCollapsed = collapse;
  const next = new Set(minimizedIds.value);
  collapse.forEach((x) => next.add(x));
  minimizedIds.value = next;
}

/** Select an annotation: raise it to the front and collapse overlapping others. */
export function focus(id: string): void {
  restoreAutoCollapsed();
  focusedId.value = id;
  collapseOverlapping(id);
}

/** Clear the selection and restore any auto-collapsed callouts. */
export function clearFocus(): void {
  restoreAutoCollapsed();
  focusedId.value = null;
}

/** Whether a marker currently renders as a badge rather than a full callout. */
export function isMinimized(id: string): boolean {
  return allCollapsed.value ? !expandedIds.value.has(id) : minimizedIds.value.has(id);
}

/** Collapse/expand an annotation between full callout and number-only badge. */
export function toggleMinimized(id: string): void {
  // While collapsed-all, per-marker toggling tracks the exceptions instead.
  if (allCollapsed.value) {
    const next = new Set(expandedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedIds.value = next;
    return;
  }
  const next = new Set(minimizedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  // A manual expand/collapse should not be undone by the auto-restore.
  autoCollapsed.delete(id);
  minimizedIds.value = next;
}

/** Collapse every annotation to its number badge. */
export function collapseAll(): void {
  autoCollapsed = new Set();
  expandedIds.value = new Set();
  focusedId.value = null;
  allCollapsed.value = true;
}

/** Expand every annotation back to a full callout, including any the reviewer
 *  had minimized one at a time. */
export function expandAll(): void {
  autoCollapsed = new Set();
  expandedIds.value = new Set();
  minimizedIds.value = new Set();
  allCollapsed.value = false;
}

export function toggleCollapseAll(): void {
  if (allCollapsed.value) expandAll();
  else collapseAll();
}

/** Replace the collapsed set outright. Leaves "collapse all" mode if it was on:
 *  while that mode is active `isMinimized` reads `expandedIds` and ignores
 *  `minimizedIds`, so an explicit list from the host app would otherwise be
 *  silently dropped. An explicit list wins. */
export function setMinimizedIds(ids: Iterable<string>): void {
  autoCollapsed = new Set();
  expandedIds.value = new Set();
  allCollapsed.value = false;
  minimizedIds.value = new Set(ids);
}

export function show(): void {
  visible.value = true;
  rescan();
}

export function hide(): void {
  clearFocus();
  visible.value = false;
}

export function toggle(): void {
  if (visible.value) hide();
  else show();
}

/** Trigger a re-scan of anchor targets on the next render. */
export function rescan(): void {
  scanTick.value = scanTick.value + 1;
}

/** Enter target-picking mode. Independent of notes visibility. */
export function startPicking(): void {
  picking.value = true;
}

/** Leave target-picking mode. */
export function stopPicking(): void {
  picking.value = false;
}

/** Show a transient confirmation message. */
export function showToast(text: string): void {
  toast.value = text;
}
