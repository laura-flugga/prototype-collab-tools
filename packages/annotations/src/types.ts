import type { Placement } from "@proto-collab/shared";

export type { Placement };

/** One annotation, authored as a row in the source sheet. */
export interface Annotation {
  /** Stable unique id. */
  id: string;
  /** Value of the host element's anchor attribute this points at (`data-annote`). */
  target: string;
  /** Optional display number/label, authored in the sheet (e.g. "1.2", "1.2a").
   *  Falls back to an auto-incrementing index when absent. */
  number?: string;
  /** Short heading. */
  title: string;
  /** Annotation copy (plain text). */
  body: string;
  /** Preferred callout side. Default "bottom". */
  placement?: Placement;
  /** Optional sequence number (reserved for a future guided-walkthrough mode). */
  order?: number;
  /** FALSE hides the row without deleting it. Default true. */
  enabled?: boolean;
}

export interface AnnotationsConfig {
  /** Published Google Sheet CSV URL (…/pub?output=csv or gviz …tqx=out:csv). */
  sheetUrl?: string;
  /** Alternative to `sheetUrl`: a committed JSON file (`Annotation[]`) for
   *  network-independent demos. Takes precedence if both are set. */
  snapshotUrl?: string;
  /** Inline annotations (skip fetching entirely). Highest precedence. */
  annotations?: Annotation[];
  /** Re-fetch the source every N ms so an open prototype picks up edits. 0 = off. */
  pollMs?: number;
  /** Show annotations immediately instead of waiting for the toggle. Default false. */
  startVisible?: boolean;
  /** Host element hook attribute. Default "data-annote". */
  attribute?: string;
  /** Watch the DOM (MutationObserver) and re-anchor as targets mount/unmount. Default true. */
  observe?: boolean;
  /** Render the built-in floating show/hide button. Set false when another UI
   *  (e.g. proto-nav's nav menu) controls visibility instead. Default true. */
  toggleButton?: boolean;
  /** Log skipped/missing targets and fetch errors to the console. Default false. */
  debug?: boolean;
}

/** Internal fully-resolved config. */
export interface NormalizedConfig {
  attribute: string;
  pollMs: number;
  startVisible: boolean;
  observe: boolean;
  toggleButton: boolean;
  debug: boolean;
}
