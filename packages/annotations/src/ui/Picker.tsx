import { useEffect, useRef } from "preact/hooks";
import { buildTarget } from "../selector";
import { config, showToast, stopPicking } from "../core/store";

const HOST_ID = "annotations-host";
const CURSOR_STYLE_ID = "an-picking-cursor";

/** Topmost host-page element under the cursor, skipping the widget's own host. */
function elementUnder(x: number, y: number): HTMLElement | null {
  const host = document.getElementById(HOST_ID);
  for (const el of document.elementsFromPoint(x, y)) {
    if (host && el === host) continue; // our overlay/toast/buttons live in here
    return el as HTMLElement;
  }
  return null;
}

/** Copy text via the async Clipboard API, falling back to execCommand. The pick
 *  click is a user gesture, so writeText is permitted in secure contexts. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Force a crosshair cursor across the host page while picking (the only style
 *  that must live outside the shadow root). Idempotent; removed on unmount. */
function addCursorStyle(): HTMLStyleElement {
  let el = document.getElementById(CURSOR_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = CURSOR_STYLE_ID;
    el.textContent = `*, *::before, *::after { cursor: crosshair !important; }`;
    document.head.appendChild(el);
  }
  return el;
}

/** Active only while picking. Highlights the element under the cursor and, on
 *  click, copies its best `target` string to the clipboard and exits pick mode. */
export function Picker() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const hovered = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const place = (el: HTMLElement | null) => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      if (!el) {
        overlay.style.display = "none";
        return;
      }
      const r = el.getBoundingClientRect();
      overlay.style.display = "block";
      overlay.style.left = `${r.left - 2}px`;
      overlay.style.top = `${r.top - 2}px`;
      overlay.style.width = `${r.width + 4}px`;
      overlay.style.height = `${r.height + 4}px`;
    };

    const onMove = (e: PointerEvent) => {
      const el = elementUnder(e.clientX, e.clientY);
      hovered.current = el;
      place(el);
    };

    // Select on click (capture) so we can suppress the host app's own click —
    // picking a real button/link must not fire its navigation.
    const onClick = (e: MouseEvent) => {
      const host = document.getElementById(HOST_ID);
      if (host && e.composedPath().includes(host)) return; // clicks on our own UI
      const el = elementUnder(e.clientX, e.clientY) ?? hovered.current;
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const attr = config.value?.attribute ?? "data-annote";
      const target = buildTarget(el, attr);
      void copyText(target).then((ok) =>
        showToast(ok ? `Copied: ${target}` : `Copy failed — ${target}`),
      );
      stopPicking();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stopPicking();
      }
    };

    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    const styleEl = addCursorStyle();

    return () => {
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
      styleEl.remove();
    };
  }, []);

  return <div ref={overlayRef} class="an-pick-overlay" style={{ display: "none" }} />;
}
