import { signal } from "@preact/signals";
import type { NormalizedConfig } from "../types";

/** Reactive UI state shared between the imperative API and the Preact tree. */
export const isOpen = signal(false);
export const config = signal<NormalizedConfig | null>(null);
/** Mirrors whether the sibling `annotations` widget currently shows notes, so
 *  the toolbar/gallery controls and the live previews can all react to it. */
export const notesShown = signal(false);
/** Mirrors whether the annotations widget has every note collapsed to a badge. */
export const notesCollapsed = signal(false);

interface AnnotationsApi {
  toggle?: () => void;
  isVisible?: () => boolean;
  toggleCollapseAll?: () => void;
  isCollapsed?: () => boolean;
}
function annotationsApi(): AnnotationsApi | undefined {
  return (window as unknown as { Annotations?: AnnotationsApi }).Annotations;
}

/** Read the current notes visibility/collapse state from the annotations widget. */
export function syncNotes(): void {
  const api = annotationsApi();
  // With no sibling widget there is nothing to reconcile against — keep the
  // state we already have rather than resetting it.
  if (!api) return;
  notesShown.value = api.isVisible?.() ?? notesShown.value;
  notesCollapsed.value = api.isCollapsed?.() ?? notesCollapsed.value;
}

/** Toggle the annotations widget and update `notesShown` (drives the previews). */
export function toggleNotes(): void {
  // Flip our own state first so the toolbar/gallery/previews react immediately,
  // then reconcile with whatever the widget actually reports.
  notesShown.value = !notesShown.value;
  annotationsApi()?.toggle?.();
  syncNotes();
}

/** Collapse every note to its badge, or expand them all again. Only meaningful
 *  while notes are showing — the toolbar disables its button otherwise. */
export function toggleCollapsed(): void {
  notesCollapsed.value = !notesCollapsed.value;
  annotationsApi()?.toggleCollapseAll?.();
  syncNotes();
}

export function openGallery(): void {
  // Notes can also be toggled from outside this widget (the annotations
  // widget's own button, an embedding frame) — re-read before showing controls.
  syncNotes();
  isOpen.value = true;
}

export function closeGallery(): void {
  isOpen.value = false;
}

export function toggleGallery(): void {
  if (isOpen.value) closeGallery();
  else openGallery();
}
