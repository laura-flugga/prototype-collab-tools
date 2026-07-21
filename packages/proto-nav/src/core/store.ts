import { signal } from "@preact/signals";
import type { NormalizedConfig } from "../types";

/** Reactive UI state shared between the imperative API and the Preact tree. */
export const isOpen = signal(false);
export const config = signal<NormalizedConfig | null>(null);

export function openGallery(): void {
  isOpen.value = true;
}

export function closeGallery(): void {
  isOpen.value = false;
}

export function toggleGallery(): void {
  isOpen.value = !isOpen.value;
}
