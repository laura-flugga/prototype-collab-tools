import { useEffect } from "preact/hooks";
import type { NormalizedConfig, NormalizedEntry } from "../types";
import { closeGallery, notesShown, toggleNotes } from "../core/store";
import { Card } from "./Card";

/** Control that toggles the sibling `annotations` widget via the shared state. */
function NotesToggle() {
  const on = notesShown.value;
  return (
    <button
      type="button"
      class={`pn-notes${on ? " pn-notes-on" : ""}`}
      onClick={toggleNotes}
    >
      {on ? "Hide notes" : "Show notes"}
    </button>
  );
}

const KNOWN_LABELS: Record<string, string> = {
  flow: "Flows",
  requirement: "Requirements",
  "edge-case": "Edge Cases",
};

function sectionLabel(type: string): string {
  if (KNOWN_LABELS[type]) return KNOWN_LABELS[type];
  // Title-case an unknown bucket verbatim (e.g. "smoke-test" -> "Smoke Test").
  return type
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Group entries by `type`, preserving first-seen order of both groups and items. */
function groupByType(entries: NormalizedEntry[]): [string, NormalizedEntry[]][] {
  const groups = new Map<string, NormalizedEntry[]>();
  for (const e of entries) {
    const list = groups.get(e.type) ?? [];
    list.push(e);
    groups.set(e.type, list);
  }
  return [...groups.entries()];
}

export function Gallery({ config }: { config: NormalizedConfig }) {
  // Close on Escape while the gallery is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeGallery();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const sections = groupByType(config.entries);

  return (
    <div
      class="pn-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={config.title}
      onClick={(e) => {
        // Backdrop click (but not clicks inside the panel) closes.
        if (e.target === e.currentTarget) closeGallery();
      }}
    >
      <div class="pn-panel">
        <div class="pn-header">
          <h2 class="pn-title">{config.title}</h2>
          <div class="pn-header-actions">
            {config.notesToggle ? <NotesToggle /> : null}
            <button type="button" class="pn-close" aria-label="Close" onClick={closeGallery}>
              ×
            </button>
          </div>
        </div>
        <div class="pn-body">
          {config.entries.length === 0 ? (
            <div class="pn-empty">No prototypes configured yet.</div>
          ) : (
            sections.map(([type, items]) => (
              <section key={type}>
                <div class="pn-section-title">{sectionLabel(type)}</div>
                <div class="pn-grid">
                  {items.map((entry) => (
                    <Card key={entry.id} entry={entry} previews={config.previews} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
