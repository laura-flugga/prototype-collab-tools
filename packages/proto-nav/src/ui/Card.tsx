import type { NormalizedEntry } from "../types";
import { isActive, navigate } from "../nav";
import { LivePreview } from "./LivePreview";
import { Placeholder } from "./Placeholder";

/** A single flow card. Thumbnail precedence: explicit `thumbnail` image >
 *  live iframe preview (when enabled) > generated placeholder. Clicking
 *  navigates to the entry's URL via a full page load. */
export function Card({ entry, previews }: { entry: NormalizedEntry; previews: boolean }) {
  const active = isActive(entry.url);
  return (
    <button
      type="button"
      class={`pn-card${active ? " pn-active" : ""}`}
      onClick={() => navigate(entry.url)}
      title={entry.url}
    >
      {entry.thumbnail ? (
        <img class="pn-thumb" src={entry.thumbnail} alt="" loading="lazy" />
      ) : previews ? (
        <LivePreview entry={entry} />
      ) : (
        <Placeholder entry={entry} />
      )}
      <span class="pn-card-body">
        <span class="pn-card-title">{entry.title}</span>
        {entry.description ? <span class="pn-card-desc">{entry.description}</span> : null}
      </span>
    </button>
  );
}
