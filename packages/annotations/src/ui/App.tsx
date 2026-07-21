import { useEffect } from "preact/hooks";
import {
  annotations,
  clearFocus,
  config,
  focusedId,
  minimizedIds,
  scanTick,
  visible,
} from "../core/store";
import { Marker } from "./Marker";
import { ToggleButton } from "./ToggleButton";

function selectorFor(attr: string, value: string): string {
  return `[${attr}="${value.replace(/"/g, '\\"')}"]`;
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
  const minimized = minimizedIds.value;
  const markers = visible.value
    ? annotations.value
        .map((a, i) => {
          const el = a.target
            ? document.querySelector<HTMLElement>(selectorFor(cfg.attribute, a.target))
            : null;
          if (!el) {
            if (cfg.debug && a.target) {
              console.warn(`[annotations] no target for "${a.target}" (${cfg.attribute})`);
            }
            return null;
          }
          return (
            <Marker
              key={a.id}
              annotation={a}
              target={el}
              num={i + 1}
              focused={a.id === focused}
              minimized={minimized.has(a.id)}
            />
          );
        })
        .filter(Boolean)
    : null;

  return (
    <>
      {cfg.toggleButton ? <ToggleButton /> : null}
      {markers}
    </>
  );
}
