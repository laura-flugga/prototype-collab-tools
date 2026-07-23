import type { VNode } from "preact";
import { useEffect } from "preact/hooks";
import {
  annotations,
  clearFocus,
  config,
  focusedId,
  isMinimized,
  scanTick,
  visible,
} from "../core/store";
import { clusterByProximity, type Positioned } from "../cluster";
import { Marker } from "./Marker";
import { ClusterMarker, type ClusterMember } from "./ClusterMarker";
import { ToggleButton } from "./ToggleButton";

function selectorFor(attr: string, value: string): string {
  return `[${attr}="${value.replace(/"/g, '\\"')}"]`;
}

/** Stable id for a cluster, independent of member order. */
function clusterId(members: ClusterMember[]): string {
  return "cl:" + members.map((m) => m.annotation.id).sort().join("|");
}

/** Root component. Renders the toggle always; when visible, resolves each
 *  annotation's `[data-annote]` target and renders an anchored Marker for the
 *  ones present in the DOM (missing targets are skipped, logged in debug mode). */
export function App() {
  const cfg = config.value;
  // Subscribe to re-scan bumps so late-mounting targets get picked up.
  scanTick.value;

  // Clicking anywhere outside the annotation UI clears the selected (focused)
  // annotation, so its neon outline goes away — not only when another is clicked.
  useEffect(() => {
    const host = document.getElementById("annotations-host");
    const onDown = (e: Event) => {
      if (focusedId.value == null) return;
      // Clicks on our own callouts/badges live inside the shadow host — keep focus.
      if (host && e.composedPath().includes(host)) return;
      clearFocus();
    };
    // Capture phase so this runs regardless of stopPropagation elsewhere.
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, []);

  if (!cfg) return null;

  const focused = focusedId.value;

  let markers: VNode[] | null = null;
  if (visible.value) {
    // Resolve each annotation's target element and measure it.
    const resolved: Positioned<ClusterMember>[] = [];
    annotations.value.forEach((a, i) => {
      const el = a.target
        ? document.querySelector<HTMLElement>(selectorFor(cfg.attribute, a.target))
        : null;
      if (!el) {
        if (cfg.debug && a.target) {
          console.warn(`[annotations] no target for "${a.target}" (${cfg.attribute})`);
        }
        return;
      }
      const r = el.getBoundingClientRect();
      resolved.push({
        rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
        value: { annotation: a, num: i + 1, target: el },
      });
    });

    // Merge annotations on close-together elements into one grouped marker.
    markers = clusterByProximity(resolved, cfg.clusterDistance).map((group) => {
      if (group.length === 1) {
        const { annotation: a, num, target } = group[0];
        return (
          <Marker
            key={a.id}
            annotation={a}
            target={target}
            num={num}
            focused={a.id === focused}
            minimized={isMinimized(a.id)}
          />
        );
      }
      const id = clusterId(group);
      return (
        <ClusterMarker
          key={id}
          clusterId={id}
          members={group}
          focused={id === focused}
          minimized={isMinimized(id)}
        />
      );
    });
  }

  return (
    <>
      {cfg.toggleButton ? <ToggleButton /> : null}
      {markers}
    </>
  );
}
