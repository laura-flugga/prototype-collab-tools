import { useEffect, useRef, useState } from "preact/hooks";
import type { ButtonPosition } from "../types";
import { toggleGallery } from "../core/store";

const STORAGE_KEY = "proto-nav:toolbar-pos";
const DRAG_THRESHOLD = 4; // px before a press on the grip/background becomes a drag

interface Pos {
  left: number;
  top: number;
}

function loadPos(): Pos | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pos;
    if (typeof p?.left === "number" && typeof p?.top === "number") return p;
  } catch {
    /* ignore */
  }
  return null;
}

function savePos(p: Pos): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/** Keep the toolbar within the viewport. */
function clamp(p: Pos, el: HTMLElement | null): Pos {
  const w = el?.offsetWidth ?? 160;
  const h = el?.offsetHeight ?? 44;
  return {
    left: Math.min(Math.max(0, p.left), Math.max(0, window.innerWidth - w)),
    top: Math.min(Math.max(0, p.top), Math.max(0, window.innerHeight - h)),
  };
}

interface AnnotationsApi {
  toggle?: () => void;
  isVisible?: () => boolean;
}
function annotationsApi(): AnnotationsApi | undefined {
  return (window as unknown as { Annotations?: AnnotationsApi }).Annotations;
}

/** Show/Hide notes button that drives the sibling `annotations` widget. */
function NotesButton() {
  const [, force] = useState(0);
  const on = annotationsApi()?.isVisible?.() ?? false;
  return (
    <button
      type="button"
      class="pn-tool-btn"
      aria-pressed={on}
      title={on ? "Hide notes" : "Show notes"}
      onClick={() => {
        annotationsApi()?.toggle?.();
        force((n) => n + 1);
      }}
    >
      <span class={`pn-tool-dot${on ? " pn-dot-on" : ""}`} aria-hidden="true" />
      {on ? "Hide notes" : "Show notes"}
    </button>
  );
}

/** Floating, draggable toolbar grouping the Menu button and (optionally) a
 *  Show/Hide notes button. Drag by the grip or the toolbar background; the
 *  buttons stay pure click targets. Position persists in localStorage. */
export function Toolbar({
  position,
  draggable,
  notesToggle,
}: {
  position: ButtonPosition;
  draggable: boolean;
  notesToggle: boolean;
}) {
  const [pos, setPos] = useState<Pos | null>(() => (draggable ? loadPos() : null));
  const [dragging, setDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    dx: number;
    dy: number;
    startX: number;
    startY: number;
    moved: boolean;
    last: Pos | null;
  } | null>(null);

  // Keep a restored/dragged position in-bounds across viewport resizes.
  useEffect(() => {
    if (!pos) return;
    const onResize = () => setPos((p) => (p ? clamp(p, barRef.current) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  const onPointerDown = (e: PointerEvent) => {
    if (!draggable || e.button !== 0) return;
    // Presses on a button are clicks, not drags.
    if ((e.target as HTMLElement).closest(".pn-tool-btn")) return;
    const rect = barRef.current!.getBoundingClientRect();
    drag.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      last: null,
    };
    barRef.current!.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) {
      return;
    }
    d.moved = true;
    if (!dragging) setDragging(true);
    const next = clamp({ left: e.clientX - d.dx, top: e.clientY - d.dy }, barRef.current);
    d.last = next;
    setPos(next);
  };

  const endDrag = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    try {
      barRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    drag.current = null;
    setDragging(false);
    if (d.moved && d.last) savePos(d.last);
  };

  const style = pos
    ? { left: `${pos.left}px`, top: `${pos.top}px`, right: "auto", bottom: "auto" }
    : undefined;

  return (
    <div
      ref={barRef}
      class={`pn-toolbar pn-pos-${position}${dragging ? " pn-dragging" : ""}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {draggable ? (
        <span class="pn-grip" aria-hidden="true" title="Drag to move">
          ⠿
        </span>
      ) : null}
      <button
        type="button"
        class="pn-tool-btn"
        aria-label="Open prototype menu"
        onClick={toggleGallery}
      >
        <svg class="pn-tool-ico" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M2 4h12M2 8h12M2 12h12"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        </svg>
        Menu
      </button>
      {notesToggle ? <NotesButton /> : null}
    </div>
  );
}
