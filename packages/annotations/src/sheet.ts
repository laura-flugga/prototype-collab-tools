import { parseCsv } from "@proto-collab/shared";
import type { Annotation, Placement } from "./types";

const PLACEMENTS: Placement[] = ["top", "bottom", "left", "right"];

function isFalsey(v: string): boolean {
  const s = v.trim().toLowerCase();
  return s === "false" || s === "no" || s === "0" || s === "off";
}

/** Map CSV rows (with a header row) into annotations, dropping disabled rows. */
export function rowsToAnnotations(rows: string[][]): Annotation[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);

  const iId = col("id");
  const iTarget = col("target");
  const iNumber = col("number");
  const iTitle = col("title");
  const iBody = col("body");
  const iPlacement = col("placement");
  const iOrder = col("order");
  const iEnabled = col("enabled");

  const at = (row: string[], idx: number) => (idx >= 0 ? (row[idx] ?? "").trim() : "");

  const out: Annotation[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.every((c) => c.trim() === "")) continue; // skip blank rows

    const target = at(row, iTarget);
    const title = at(row, iTitle);
    if (!target && !title) continue; // nothing to anchor/show

    const enabledRaw = at(row, iEnabled);
    if (enabledRaw && isFalsey(enabledRaw)) continue; // explicitly disabled

    const placementRaw = at(row, iPlacement).toLowerCase() as Placement;
    const orderRaw = at(row, iOrder);
    const order = orderRaw ? Number(orderRaw) : undefined;

    out.push({
      id: at(row, iId) || `${target || "annotation"}-${r}`,
      target,
      number: at(row, iNumber) || undefined,
      title,
      body: at(row, iBody),
      placement: PLACEMENTS.includes(placementRaw) ? placementRaw : undefined,
      order: order !== undefined && !Number.isNaN(order) ? order : undefined,
    });
  }

  // Stable order: by `order` when present, otherwise sheet order.
  return out.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
}

/** Coerce arbitrary JSON (snapshot / inline) into validated annotations. */
export function coerceAnnotations(data: unknown): Annotation[] {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray((data as { annotations?: unknown })?.annotations)
      ? (data as { annotations: unknown[] }).annotations
      : [];
  const out: Annotation[] = [];
  for (const raw of arr) {
    const a = raw as Partial<Annotation>;
    if (!a || typeof a.target !== "string") continue;
    if (a.enabled === false) continue;
    out.push({
      id: a.id || `${a.target}-${out.length}`,
      target: a.target,
      number: a.number,
      title: a.title ?? "",
      body: a.body ?? "",
      placement: a.placement,
      order: a.order,
    });
  }
  return out.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
}

/** Fetch + parse a published Google Sheet CSV into annotations. */
export async function fetchSheet(url: string): Promise<Annotation[]> {
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`annotations: failed to fetch sheet (${res.status})`);
  return rowsToAnnotations(parseCsv(await res.text()));
}

/** Fetch a committed JSON snapshot into annotations. */
export async function fetchSnapshot(url: string): Promise<Annotation[]> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`annotations: failed to fetch snapshot (${res.status})`);
  return coerceAnnotations(await res.json());
}
