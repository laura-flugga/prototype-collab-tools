import { useEffect, useRef, useState } from "preact/hooks";
import { arrow, autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import type { Annotation } from "../types";
import { focus, toggleMinimized } from "../core/store";

const RING_BASE_Z = 2147483000;
const BADGE_Z = 2147483001; // dots (minimized) — low band
const CALLOUT_Z = 2147483040; // bubbles (expanded) — high band, above a focused dot
const FOCUS_BUMP = 20; // clicking raises a marker above same-kind neighbours
const PAD = 8;

const OPPOSITE: Record<string, string> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

export interface ClusterMember {
  annotation: Annotation;
  num: number;
  target: HTMLElement;
}

/** Union of the members' viewport boxes. */
function unionRect(els: HTMLElement[]): DOMRect {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  const width = right - left;
  const height = bottom - top;
  return { x: left, y: top, left, top, right, bottom, width, height, toJSON() {} } as DOMRect;
}

function placeRing(ring: HTMLElement, r: DOMRect, inset: number): void {
  ring.style.left = `${r.left - inset}px`;
  ring.style.top = `${r.top - inset}px`;
  ring.style.width = `${r.width + inset * 2}px`;
  ring.style.height = `${r.height + inset * 2}px`;
}

/** Several annotations whose targets sit close together, rendered as one marker:
 *  a ring over the union of their targets and one bubble listing every note.
 *  Hovering a row highlights that member's own element. */
export function ClusterMarker({
  clusterId,
  members,
  focused,
  minimized,
}: {
  clusterId: string;
  members: ClusterMember[];
  focused: boolean;
  minimized: boolean;
}) {
  const calloutRef = useRef<HTMLElement | null>(null);
  const setCallout = (el: HTMLElement | null) => {
    calloutRef.current = el;
  };
  const arrowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const memberRingRef = useRef<HTMLDivElement>(null);
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const targets = members.map((m) => m.target);

  useEffect(() => {
    const callout = calloutRef.current;
    const ring = ringRef.current;
    if (!callout || !ring) return;
    const arrowEl = arrowRef.current; // absent while minimized
    const memberRing = memberRingRef.current;

    const update = () => {
      const u = unionRect(targets);
      placeRing(ring, u, 3);

      if (!arrowEl) {
        // Minimized: pin the count badge on the group's top-left corner.
        const bw = callout.offsetWidth;
        const bh = callout.offsetHeight;
        const bx = Math.max(PAD, Math.min(u.left - bw / 2, window.innerWidth - bw - PAD));
        const by = Math.max(PAD, Math.min(u.top - bh / 2, window.innerHeight - bh - PAD));
        callout.style.left = `${bx}px`;
        callout.style.top = `${by}px`;
        if (memberRing) {
          const hel = hoveredElRef.current;
          if (hel) {
            memberRing.style.display = "block";
            placeRing(memberRing, hel.getBoundingClientRect(), 2);
          } else {
            memberRing.style.display = "none";
          }
        }
        return;
      }

      const virtual = { getBoundingClientRect: () => unionRect(targets) };
      computePosition(virtual, callout, {
        strategy: "fixed",
        placement: "bottom",
        middleware: [
          offset(12),
          flip(),
          shift({ padding: PAD, crossAxis: true }),
          ...(arrowEl ? [arrow({ element: arrowEl })] : []),
        ],
      }).then(({ x, y, placement, middlewareData }) => {
        const cw = callout.offsetWidth;
        const ch = callout.offsetHeight;
        const cx = Math.max(PAD, Math.min(x, window.innerWidth - cw - PAD));
        const cy = Math.max(PAD, Math.min(y, window.innerHeight - ch - PAD));
        callout.style.left = `${cx}px`;
        callout.style.top = `${cy}px`;

        if (arrowEl) {
          const side = placement.split("-")[0];
          const { x: ax, y: ay } = middlewareData.arrow ?? {};
          const s = arrowEl.style;
          s.left = ax != null ? `${ax}px` : "";
          s.top = ay != null ? `${ay}px` : "";
          s.right = "";
          s.bottom = "";
          s.setProperty(OPPOSITE[side], "-4px");
        }
      });

      // Keep the per-member highlight ring on the hovered element as things move.
      if (memberRing) {
        const hel = hoveredElRef.current;
        if (hel) {
          memberRing.style.display = "block";
          placeRing(memberRing, hel.getBoundingClientRect(), 2);
        } else {
          memberRing.style.display = "none";
        }
      }
    };

    // autoUpdate on any real member element; update() recomputes the union.
    const cleanup = autoUpdate(targets[0], callout, update);
    return cleanup;
  }, [clusterId, minimized]);

  // Point the per-member ring at the hovered row's element.
  useEffect(() => {
    const memberRing = memberRingRef.current;
    if (!memberRing) return;
    const m = members.find((mm) => mm.annotation.id === hovered);
    hoveredElRef.current = m ? m.target : null;
    if (m) {
      memberRing.style.display = "block";
      placeRing(memberRing, m.target.getBoundingClientRect(), 2);
    } else {
      memberRing.style.display = "none";
    }
  }, [hovered]);

  // Bubbles always sit in a higher band than dots; focus raises a marker above
  // its same-kind neighbours without ever letting a dot cross above a bubble.
  const bandBase = minimized ? BADGE_Z : CALLOUT_Z;
  const calloutZ = bandBase + (focused ? FOCUS_BUMP : 0);
  const ringZ = RING_BASE_Z + (focused ? FOCUS_BUMP : 0);

  return (
    <>
      <div
        ref={ringRef}
        class={`an-ring an-cluster-ring${focused ? " an-focused" : ""}`}
        style={{ zIndex: ringZ }}
      />
      <div ref={memberRingRef} class="an-ring an-focused an-member-ring" style={{ zIndex: ringZ + 1, display: "none" }} />
      {minimized ? (
        <button
          ref={setCallout}
          type="button"
          data-ann-id={clusterId}
          class={`an-badge an-cluster-badge${focused ? " an-focused" : ""}`}
          style={{ zIndex: calloutZ }}
          title={`${members.length} notes here — click to expand`}
          onPointerDown={() => focus(clusterId)}
          onClick={() => toggleMinimized(clusterId)}
        >
          {members.length}
        </button>
      ) : (
        <div
          ref={setCallout}
          data-ann-id={clusterId}
          class={`an-callout an-cluster${focused ? " an-focused" : ""}`}
          role="note"
          style={{ zIndex: calloutZ }}
          onPointerDown={() => focus(clusterId)}
        >
          <div class="an-callout-head">
            <p class="an-cluster-count">{members.length} notes here</p>
            <button
              type="button"
              class="an-min"
              aria-label="Minimize"
              title="Minimize"
              onClick={() => toggleMinimized(clusterId)}
            >
              &minus;
            </button>
          </div>
          <div class="an-cluster-list">
            {members.map((m) => (
              <div
                key={m.annotation.id}
                class="an-cluster-item"
                onMouseEnter={() => setHovered(m.annotation.id)}
                onMouseLeave={() => setHovered((h) => (h === m.annotation.id ? null : h))}
              >
                <p class="an-callout-title">
                  <span class="an-callout-num">{m.annotation.number?.trim() || String(m.num)}</span>
                  {m.annotation.title}
                </p>
                {m.annotation.body ? <p class="an-callout-body">{m.annotation.body}</p> : null}
              </div>
            ))}
          </div>
          <div ref={arrowRef} class="an-arrow" />
        </div>
      )}
    </>
  );
}
