import { useEffect, useRef, useState } from "preact/hooks";
import type { ButtonPosition } from "../types";
import { toggleGallery } from "../core/store";

const STORAGE_KEY = "proto-nav:button-pos";
const DRAG_THRESHOLD = 4; // px moved before a press becomes a drag (not a click)

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

/** Clamp a position so the button stays within the viewport. */
function clamp(p: Pos, el: HTMLElement | null): Pos {
  const w = el?.offsetWidth ?? 120;
  const h = el?.offsetHeight ?? 40;
  const maxLeft = Math.max(0, window.innerWidth - w);
  const maxTop = Math.max(0, window.innerHeight - h);
  return {
    left: Math.min(Math.max(0, p.left), maxLeft),
    top: Math.min(Math.max(0, p.top), maxTop),
  };
}

export function MenuButton({
  position,
  draggable,
}: {
  position: ButtonPosition;
  draggable: boolean;
}) {
  const [pos, setPos] = useState<Pos | null>(() => (draggable ? loadPos() : null));
  const [dragging, setDragging] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  // Drag session: pointer offset within the button, the press origin, whether it
  // has moved past the threshold, and the latest position (for save on release).
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
    const onResize = () => setPos((p) => (p ? clamp(p, btnRef.current) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  const onPointerDown = (e: PointerEvent) => {
    if (!draggable || e.button !== 0) return;
    const rect = btnRef.current!.getBoundingClientRect();
    drag.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      last: null,
    };
    btnRef.current!.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) {
      return; // still within the click tolerance — don't start dragging yet
    }
    d.moved = true;
    if (!dragging) setDragging(true);
    const next = clamp({ left: e.clientX - d.dx, top: e.clientY - d.dy }, btnRef.current);
    d.last = next;
    setPos(next);
  };

  const endDrag = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    try {
      btnRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    drag.current = null;
    setDragging(false);
    if (d.moved) {
      if (d.last) savePos(d.last);
    } else {
      // A press that never crossed the threshold is a click → toggle.
      toggleGallery();
    }
  };

  const style = pos
    ? { left: `${pos.left}px`, top: `${pos.top}px`, right: "auto", bottom: "auto" }
    : undefined;

  return (
    <button
      ref={btnRef}
      type="button"
      class={`pn-button pn-pos-${position}${dragging ? " pn-dragging" : ""}`}
      style={style}
      aria-label="Open prototype menu"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      // Non-draggable fallback: plain click toggles.
      onClick={draggable ? undefined : toggleGallery}
    >
      <span class="pn-button-dot" />
      Menu
    </button>
  );
}
