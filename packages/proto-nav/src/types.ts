/** A grouping bucket for entries. Known buckets get friendly section headings;
 *  any other string is allowed and used verbatim as its own section. */
export type EntryType = "flow" | "requirement" | "edge-case" | (string & {});

export interface Entry {
  /** Human-readable card title. */
  title: string;
  /** Destination URL. Navigated to via a full page load. */
  url: string;
  /** Stable id; defaults to a slug of `title`. */
  id?: string;
  /** Grouping bucket; defaults to `"flow"`. */
  type?: EntryType;
  /** Optional supporting copy shown under the title. */
  description?: string;
  /** Optional thumbnail image URL; falls back to a generated placeholder. */
  thumbnail?: string;
}

export type ButtonPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface ProtoNavConfig {
  /** Inline entries. Mutually usable with `src` (inline wins if both given). */
  entries?: Entry[];
  /** URL to fetch a config from: JSON (`Entry[]` or `{ entries, title }`) or a
   *  published-sheet CSV — the format is auto-detected. Inline `entries` win. */
  src?: string;
  /** URL of a published Google Sheet (or any CSV) to build entries from. Header
   *  columns map to entry fields: `title`, `url`, `type`, `description`, `id`,
   *  `thumbnail`, `enabled`. Takes precedence over `src`; `entries` win over both. */
  sheet?: string;
  /** Gallery heading. Default: "Prototypes". */
  title?: string;
  /** Anchor corner for the floating Menu button. Default: "bottom-right". */
  position?: ButtonPosition;
  /** Allow dragging the Menu button; position persists in localStorage. Default: true. */
  draggable?: boolean;
  /** Open the gallery immediately on load, every time. Default: false. */
  startOpen?: boolean;
  /** Open the gallery on load only when no entry URL matches the current location. Default: false. */
  openOnFirstLoad?: boolean;
  /** Render the notes controls driven by the `annotations` widget (via its
   *  `window.Annotations` global): Show/Hide notes and Collapse/Expand all
   *  (collapsing leaves each note on the page as a number badge) in the
   *  toolbar, plus a Show/Hide control in the gallery header. Default: false. */
  notesToggle?: boolean;
  /** Render a "Pick target" button in the toolbar. Clicking a host element copies
   *  its annotation `target` string (via the `annotations` widget's picker) so
   *  authors can grab it without hand-writing selectors. An authoring aid — off
   *  by default so reviewers never see it. Default: false. */
  picker?: boolean;
  /** Show a live iframe preview of each flow as its card thumbnail (falls back to
   *  a generated placeholder per entry). A per-entry `thumbnail` always wins.
   *  Pages that forbid framing render blank — use `thumbnail` for those. Default: true. */
  previews?: boolean;
}

/** Internal normalized entry: `id` and `type` are always resolved. */
export interface NormalizedEntry extends Entry {
  id: string;
  type: EntryType;
}

export interface NormalizedConfig {
  entries: NormalizedEntry[];
  title: string;
  position: ButtonPosition;
  draggable: boolean;
  startOpen: boolean;
  openOnFirstLoad: boolean;
  notesToggle: boolean;
  picker: boolean;
  previews: boolean;
}
