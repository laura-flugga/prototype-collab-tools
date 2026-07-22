import { signal } from "@preact/signals";
import type { NormalizedConfig } from "../types";

/** Reactive UI state shared between the imperative API and the Preact tree. */
export const isOpen = signal(false);
export const config = signal<NormalizedConfig | null>(null);
/** Mirrors whether the sibling `annotations` widget currently shows notes, so
 *  the toolbar/gallery controls and the live previews can all react to it. */
export const notesShown = signal(false);

interface AnnotationsApi {
  toggle?: () => void;
  isVisible?: () => boolean;
}
function annotationsApi(): AnnotationsApi | undefined {
  return (window as unknown as { Annotations?: AnnotationsApi }).Annotations;
}

/** Read the current notes visibility from the annotations widget into the signal. */
export function syncNotes(): void {
  notesShown.value = annotationsApi()?.isVisible?.() ?? false;
}

/** Toggle the annotations widget and update `notesShown` (drives the previews). */
export function toggleNotes(): void {
  annotationsApi()?.toggle?.();
  notesShown.value = annotationsApi()?.isVisible?.() ?? !notesShown.value;
}

export function openGallery(): void {
  isOpen.value = true;
}

export function closeGallery(): void {
  isOpen.value = false;
}

export function toggleGallery(): void {
  isOpen.value = !isOpen.value;
}
