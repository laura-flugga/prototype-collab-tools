import { useEffect, useRef, useState } from "preact/hooks";
import type { NormalizedEntry } from "../types";
import { notesShown } from "../core/store";
import { Placeholder } from "./Placeholder";

// The iframe renders at a fixed logical width, then is CSS-scaled down to fill
// the card's thumbnail area — giving a live, always-current page preview.
const BASE_W = 1280;
const BASE_H = (BASE_W * 10) / 16; // 16:10, matches the .pn-thumb aspect ratio

// Each card frames a whole prototype page, so a gallery of a dozen would start a
// dozen full page loads at once and every one of them would crawl. Load a few at
// a time instead, and give up a slot after a while so one slow page can't hold
// the rest hostage (it keeps loading; it just stops blocking the queue).
const MAX_CONCURRENT = 3;
const SLOT_TIMEOUT_MS = 8000;

let active = 0;
const waiting: (() => void)[] = [];

/** Run `start` as soon as a load slot is free. Returns a release function that is
 *  safe to call whether or not `start` ever ran (e.g. the card unmounted first). */
function requestSlot(start: () => void): () => void {
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    const queued = waiting.indexOf(start);
    if (queued >= 0) {
      waiting.splice(queued, 1); // never started — no slot to hand back
      return;
    }
    active--;
    const next = waiting.shift();
    if (next) {
      active++;
      next();
    }
  };
  if (active < MAX_CONCURRENT) {
    active++;
    start();
  } else {
    waiting.push(start);
  }
  return release;
}

/** A live scaled-down `<iframe>` of the entry URL, used as a real page thumbnail.
 *  The frame is only created once the card is near the viewport and a load slot
 *  is free; until it has loaded, the entry's generated placeholder shows in its
 *  place so a card never sits blank.
 *
 *  When the menu's Show/Hide notes toggle changes, each preview is told to
 *  mirror it (via postMessage), so previews render with/without the notes.
 *  Note: pages that forbid framing (X-Frame-Options / CSP frame-ancestors, e.g.
 *  SSO-gated previews) will render blank — use a static `thumbnail` for those. */
export function LivePreview({ entry }: { entry: NormalizedEntry }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.18);
  const [phase, setPhase] = useState<"idle" | "loading" | "ready">("idle");
  const releaseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / BASE_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wait until the card is on (or near) screen, then queue the actual load.
  // Doing this ourselves rather than with `loading="lazy"`: the cards live in a
  // shadow root inside the overlay's own scroll container, where the native
  // heuristic is unreliable, and it gives us the concurrency cap for free.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        releaseRef.current = requestSlot(() => {
          setPhase("loading");
          timer = setTimeout(() => releaseRef.current?.(), SLOT_TIMEOUT_MS);
        });
      },
      // Viewport root: an observer rooted at the overlay never reports at all
      // from inside the shadow tree. The trade-off is that `rootMargin` can't
      // pre-load past the overlay's own clip — cards below the fold start
      // loading as the gallery scrolls them into view, which is the point.
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
      releaseRef.current?.();
    };
  }, []);

  // Mirror the menu's notes toggle into the previewed page on every change.
  const sendNotes = () =>
    frameRef.current?.contentWindow?.postMessage(
      { type: "proto-nav:notes", show: notesShown.value },
      "*",
    );
  useEffect(() => notesShown.subscribe(sendNotes), []);

  const onLoad = () => {
    setPhase("ready");
    releaseRef.current?.();
    sendNotes();
  };

  return (
    <div ref={wrapRef} class="pn-thumb pn-preview" aria-hidden="true">
      {phase !== "ready" ? (
        <div class={`pn-preview-fallback${phase === "loading" ? " pn-loading" : ""}`}>
          <Placeholder entry={entry} />
        </div>
      ) : null}
      {phase === "idle" ? null : (
        <iframe
          ref={frameRef}
          src={entry.url}
          width={BASE_W}
          height={BASE_H}
          scrolling="no"
          tabIndex={-1}
          title=""
          sandbox="allow-same-origin allow-scripts"
          onLoad={onLoad}
          style={{
            width: `${BASE_W}px`,
            height: `${BASE_H}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            opacity: phase === "ready" ? 1 : 0,
          }}
        />
      )}
    </div>
  );
}
