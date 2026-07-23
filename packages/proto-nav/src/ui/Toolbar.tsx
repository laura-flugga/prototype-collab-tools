import { useEffect, useRef, useState } from "preact/hooks";
import type { ButtonPosition } from "../types";
import type { ComponentChildren } from "preact";
import {
  notesCollapsed,
  notesShown,
  syncNotes,
  toggleCollapsed,
  toggleGallery,
  toggleNotes,
} from "../core/store";

const STORAGE_KEY = "proto-nav:toolbar-pos";
const DRAG_THRESHOLD = 4; // px before a press on the grip/background becomes a drag
const TIP_FLIP_PX = 60; // above this from the viewport top, tooltips point up

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

/** Icon-only toolbar button. The label lives in the hover/focus tooltip
 *  (`data-tip`, drawn in CSS) and in `aria-label`, so the bar stays compact as
 *  controls are added. */
function ToolButton({
  label,
  onClick,
  pressed,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  children: ComponentChildren;
}) {
  return (
    <button
      type="button"
      class="pn-tool-btn"
      data-tip={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <svg class="pn-tool-ico" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 1.7,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
} as const;

/** Show/Hide notes: the sibling `annotations` widget's visibility. */
function NotesButton() {
  const on = notesShown.value;
  return (
    <ToolButton label={on ? "Hide notes" : "Show notes"} pressed={on} onClick={toggleNotes}>
      <path d="M1.6 8S3.9 3.8 8 3.8 14.4 8 14.4 8 12.1 12.2 8 12.2 1.6 8 1.6 8Z" {...STROKE} />
      <circle cx="8" cy="8" r="1.9" {...STROKE} />
      {on ? null : <path d="M3 13 13 3" {...STROKE} />}
    </ToolButton>
  );
}

/** Collapse/expand all: collapsing keeps every note on the page as a numbered
 *  badge instead of hiding it, so reviewers see the UI underneath without
 *  losing their place. Needs notes to be showing in the first place. */
function CollapseButton() {
  // Collapse state survives hiding the notes, but with nothing on screen it
  // isn't in effect — show the button plain rather than lit up and dead.
  const collapsed = notesCollapsed.value && notesShown.value;
  return (
    <ToolButton
      label={collapsed ? "Expand all notes" : "Collapse all notes"}
      pressed={collapsed}
      disabled={!notesShown.value}
      onClick={toggleCollapsed}
    >
      {/* Chevrons pulling in to a line (collapse) or pushing out from it (expand). */}
      <path
        d={
          collapsed
            ? "M5 5.6 8 2.6 11 5.6M5 10.4 8 13.4 11 10.4"
            : "M5 2.6 8 5.6 11 2.6M5 13.4 8 10.4 11 13.4"
        }
        {...STROKE}
      />
      <path d="M2.6 8h10.8" {...STROKE} />
    </ToolButton>
  );
}

/** Floating, draggable toolbar grouping the Menu button and (optionally) the
 *  notes controls. Every control is icon-only with a hover
 *  tooltip, so the bar stays small however many there are. Drag by the grip or
 *  the toolbar background; the buttons stay pure click targets. Position
 *  persists in localStorage. */
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

  // Tooltips sit above the bar; near the top of the viewport they'd be clipped,
  // so flip them underneath instead.
  const tipBelow = pos ? pos.top < TIP_FLIP_PX : position.startsWith("top");

  return (
    <div
      ref={barRef}
      class={`pn-toolbar pn-pos-${position}${dragging ? " pn-dragging" : ""}${
        tipBelow ? " pn-tip-below" : ""
      }`}
      style={style}
      // Cheap re-read just before the user can click anything, so the notes
      // buttons never show stale state after an outside toggle.
      onPointerEnter={syncNotes}
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
      <ToolButton label="Menu" onClick={toggleGallery}>
        <path d="M2 4h12M2 8h12M2 12h12" {...STROKE} />
      </ToolButton>
      {notesToggle ? (
        <>
          <NotesButton />
          <CollapseButton />
        </>
      ) : null}
    </div>
  );
}
