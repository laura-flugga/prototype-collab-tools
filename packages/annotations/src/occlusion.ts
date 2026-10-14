/** Whether something else is drawn over the middle of `el`, such as a modal,
 *  a drawer or its backdrop. A note on a covered target would float above the
 *  overlay, pointing at something the reviewer can't see, so it is skipped.
 *
 *  Our own callouts (inside `hostId`) are ignored. A target scrolled out of the
 *  viewport has nothing to hit-test, so it counts as not covered. */
export function isCovered(doc: Document, el: Element, hostId: string): boolean {
  if (typeof doc.elementsFromPoint !== "function") return false;
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const view = doc.defaultView;
  if (!view || x < 0 || y < 0 || x > view.innerWidth || y > view.innerHeight) {
    return false;
  }
  const host = doc.getElementById(hostId);
  const top = doc
    .elementsFromPoint(x, y)
    .find((hit) => !(host && (hit === host || host.contains(hit))));
  if (!top) return false;
  return !(el === top || el.contains(top) || top.contains(el));
}

const CLIPS = /(auto|scroll|hidden|clip)/;

/** Whether `el` is scrolled out of sight inside a scrolling ancestor (a side
 *  panel's list, say). Its note would otherwise pin to the panel's edge. The
 *  page's own scroll is not counted: a note below the fold still follows the
 *  page as it scrolls. */
export function isClipped(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const view = el.ownerDocument.defaultView;
  if (!view) return false;
  for (let p = el.parentElement; p && p !== el.ownerDocument.body; p = p.parentElement) {
    const s = view.getComputedStyle(p);
    if (!CLIPS.test(s.overflow + s.overflowX + s.overflowY)) continue;
    const b = p.getBoundingClientRect();
    if (r.bottom <= b.top || r.top >= b.bottom || r.right <= b.left || r.left >= b.right) {
      return true;
    }
  }
  return false;
}
