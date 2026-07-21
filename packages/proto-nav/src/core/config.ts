import type {
  ButtonPosition,
  Entry,
  NormalizedConfig,
  NormalizedEntry,
  ProtoNavConfig,
} from "../types";

const VALID_POSITIONS: ButtonPosition[] = [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
];

/** URL-safe slug from an arbitrary string; used as a fallback entry id. */
export function slug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "entry";
}

function normalizeEntries(entries: Entry[]): NormalizedEntry[] {
  const seen = new Set<string>();
  return entries
    .filter((e) => e && typeof e.title === "string" && typeof e.url === "string")
    .map((e) => {
      let id = e.id?.trim() || slug(e.title);
      // Guarantee uniqueness so ids are safe as keys / anchors.
      let n = 2;
      const base = id;
      while (seen.has(id)) id = `${base}-${n++}`;
      seen.add(id);
      return { ...e, id, type: e.type || "flow" };
    });
}

/** Apply defaults and normalize a raw config into a fully-resolved shape. */
export function normalizeConfig(raw: ProtoNavConfig): NormalizedConfig {
  const position =
    raw.position && VALID_POSITIONS.includes(raw.position)
      ? raw.position
      : "bottom-right";
  return {
    entries: normalizeEntries(raw.entries ?? []),
    title: raw.title?.trim() || "Prototypes",
    position,
    draggable: raw.draggable ?? true,
    startOpen: raw.startOpen ?? false,
    openOnFirstLoad: raw.openOnFirstLoad ?? false,
    notesToggle: raw.notesToggle ?? false,
    previews: raw.previews ?? true,
  };
}

/** Fetch a JSON config from `src`. Accepts either an `Entry[]` or a
 *  `{ entries, title? }` object. Returns entries + optional title. */
export async function fetchConfig(
  src: string,
): Promise<{ entries: Entry[]; title?: string }> {
  const res = await fetch(src, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`proto-nav: failed to fetch config (${res.status})`);
  const data = (await res.json()) as unknown;
  if (Array.isArray(data)) return { entries: data as Entry[] };
  if (data && typeof data === "object") {
    const obj = data as { entries?: Entry[]; title?: string };
    return { entries: obj.entries ?? [], title: obj.title };
  }
  throw new Error("proto-nav: config JSON must be an array or { entries } object");
}
