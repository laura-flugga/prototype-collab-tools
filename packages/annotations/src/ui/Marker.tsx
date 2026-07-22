import { useEffect, useRef } from "preact/hooks";
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import type { Annotation, Placement } from "../types";
import { focus, toggleMinimized } from "../core/store";

const RING_BASE_Z = 2147483000;
const BADGE_Z = 2147483001; // dots (minimized) — low band
const CALLOUT_Z = 2147483040; // bubbles (expanded) — high band, above a focused dot
const FOCUS_BUMP = 20; // clicking raises a marker above same-kind neighbours
const PAD = 8; // min viewport gap kept around a callout

const OPPOSITE: Record<string, string> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/** A single anchored annotation: a highlight ring around the target element plus
 *  a callout positioned by `@floating-ui/dom`, kept in sync via `autoUpdate`.
 *  When `minimized`, the callout collapses to just its number badge. */
export function Marker({
  annotation,
  target,
  num,
  focused,
  minimized,
}: {
  annotation: Annotation;
  target: HTMLElement;
  num: number;
  focused: boolean;
  minimized: boolean;
}) {
  // Callback ref: `calloutRef` may point at a <div> (expanded) or a <button>
  // (minimized), so a plain typed ref can't attach to both.
  const calloutRef = useRef<HTMLElement | null>(null);
  const setCallout = (el: HTMLElement | null) => {
    calloutRef.current = el;
  };
  const arrowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Sheet-authored number/label (e.g. "1.2a") wins over the auto index.
  const label = annotation.number?.trim() || String(num);

  useEffect(() => {
    const callout = calloutRef.current;
    const ring = ringRef.current;
    if (!callout || !ring) return;
    const arrowEl = arrowRef.current; // absent while minimized

    const placement = (annotation.placement ?? "bottom") as Placement;

    const update = () => {
      // Highlight ring tracks the target's viewport box (callout uses fixed strategy).
      const r = target.getBoundingClientRect();
      ring.style.left = `${r.left - 2}px`;
      ring.style.top = `${r.top - 2}px`;
      ring.style.width = `${r.width + 4}px`;
      ring.style.height = `${r.height + 4}px`;

      if (!arrowEl) {
        // Minimized: pin the number badge on the target's top-left corner so it
        // stays on its own element and never floats into the gap between two
        // neighbours (where it could overlap another badge/ring).
        const bw = callout.offsetWidth;
        const bh = callout.offsetHeight;
        const bx = Math.max(PAD, Math.min(r.left - bw / 2, window.innerWidth - bw - PAD));
        const by = Math.max(PAD, Math.min(r.top - bh / 2, window.innerHeight - bh - PAD));
        callout.style.left = `${bx}px`;
        callout.style.top = `${by}px`;
        return;
      }

      computePosition(target, callout, {
        strategy: "fixed",
        placement,
        middleware: [
          offset(10),
          flip(),
          // Shift on both axes to pull the callout back into view near edges.
          shift({ padding: PAD, crossAxis: true }),
          ...(arrowEl ? [arrow({ element: arrowEl })] : []),
        ],
      }).then(({ x, y, placement: finalPlacement, middlewareData }) => {
        // Final guarantee: clamp fully inside the viewport so a callout can
        // never render off-screen, whatever the placement/flip result.
        const cw = callout.offsetWidth;
        const ch = callout.offsetHeight;
        const cx = Math.max(PAD, Math.min(x, window.innerWidth - cw - PAD));
        const cy = Math.max(PAD, Math.min(y, window.innerHeight - ch - PAD));
        callout.style.left = `${cx}px`;
        callout.style.top = `${cy}px`;

        if (!arrowEl) return;
        const side = finalPlacement.split("-")[0];
        const { x: ax, y: ay } = middlewareData.arrow ?? {};
        const s = arrowEl.style;
        s.left = ax != null ? `${ax}px` : "";
        s.top = ay != null ? `${ay}px` : "";
        s.right = "";
        s.bottom = "";
        // Anchor the arrow to the side of the callout that faces the target.
        s.setProperty(OPPOSITE[side], "-4px");
      });
    };

    // autoUpdate recomputes on scroll, resize, and layout shifts.
    // `minimized` is a dependency because it swaps which element `calloutRef` points at.
    const cleanup = autoUpdate(target, callout, update);
    return cleanup;
  }, [annotation, target, minimized]);

  // Bubbles always sit in a higher band than dots; focus raises a marker above
  // its same-kind neighbours without ever letting a dot cross above a bubble.
  const bandBase = minimized ? BADGE_Z : CALLOUT_Z;
  const calloutZ = bandBase + (focused ? FOCUS_BUMP : 0);
  const ringZ = RING_BASE_Z + (focused ? FOCUS_BUMP : 0);

  return (
    <>
      <div
        ref={ringRef}
        class={`an-ring${focused ? " an-focused" : ""}`}
        style={{ zIndex: ringZ }}
      />
      {minimized ? (
        <button
          ref={setCallout}
          type="button"
          data-ann-id={annotation.id}
          class={`an-badge${focused ? " an-focused" : ""}`}
          style={{ zIndex: calloutZ }}
          title={`${label}. ${annotation.title} — click to expand`}
          onPointerDown={() => focus(annotation.id)}
          onClick={() => toggleMinimized(annotation.id)}
        >
          {label}
        </button>
      ) : (
        <div
          ref={setCallout}
          data-ann-id={annotation.id}
          class={`an-callout${focused ? " an-focused" : ""}`}
          role="note"
          style={{ zIndex: calloutZ }}
          onPointerDown={() => focus(annotation.id)}
        >
          <div class="an-callout-head">
            <p class="an-callout-title">
              <span class="an-callout-num">{label}</span>
              {annotation.title}
            </p>
            <button
              type="button"
              class="an-min"
              aria-label="Minimize"
              title="Minimize"
              onClick={() => toggleMinimized(annotation.id)}
            >
              &minus;
            </button>
          </div>
          {annotation.body ? <p class="an-callout-body">{annotation.body}</p> : null}
          <div ref={arrowRef} class="an-arrow" />
        </div>
      )}
    </>
  );
}
