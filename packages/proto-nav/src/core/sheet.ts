import { parseCsv } from "@proto-collab/shared";
import type { Entry } from "../types";

function isFalsey(v: string): boolean {
  const s = v.trim().toLowerCase();
  return s === "false" || s === "no" || s === "0" || s === "off";
}

/** Map CSV rows (with a header row) into entries, dropping disabled/blank rows.
 *  Recognized columns (header-named, any order): `title`, `url`, `type`,
 *  `description` (alias `desc`), `id`, `thumbnail` (alias `thumb`), `enabled`.
 *  `title` and `url` are both required for a row to become an entry. */
export function rowsToEntries(rows: string[][]): Entry[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const iTitle = col("title");
  const iUrl = col("url");
  const iType = col("type");
  const iDesc = col("description", "desc");
  const iId = col("id");
  const iThumb = col("thumbnail", "thumb");
  const iEnabled = col("enabled");

  const at = (row: string[], idx: number) => (idx >= 0 ? (row[idx] ?? "").trim() : "");

  const out: Entry[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.every((c) => c.trim() === "")) continue; // skip blank rows

    const title = at(row, iTitle);
    const url = at(row, iUrl);
    if (!title || !url) continue; // a nav entry needs both

    const enabledRaw = at(row, iEnabled);
    if (enabledRaw && isFalsey(enabledRaw)) continue; // explicitly disabled

    const entry: Entry = { title, url };
    const id = at(row, iId);
    if (id) entry.id = id;
    const type = at(row, iType);
    if (type) entry.type = type;
    const description = at(row, iDesc);
    if (description) entry.description = description;
    const thumbnail = at(row, iThumb);
    if (thumbnail) entry.thumbnail = thumbnail;
    out.push(entry);
  }
  return out;
}

/** Fetch + parse a published Google Sheet (or any CSV) into entries. */
export async function fetchSheet(url: string): Promise<Entry[]> {
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`proto-nav: failed to fetch sheet (${res.status})`);
  return rowsToEntries(parseCsv(await res.text()));
}
