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
