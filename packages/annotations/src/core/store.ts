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

/** Collapse/expand an annotation between full callout and number-only badge. */
export function toggleMinimized(id: string): void {
  const next = new Set(minimizedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  // A manual expand/collapse should not be undone by the auto-restore.
  autoCollapsed.delete(id);
  minimizedIds.value = next;
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
