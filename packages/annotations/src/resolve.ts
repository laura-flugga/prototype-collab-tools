/** Build an attribute selector, escaping the value so quotes can't break out. */
export function selectorFor(attr: string, value: string): string {
  return `[${attr}="${value.replace(/"/g, '\\"')}"]`;
}

/** Resolve an annotation `target` to a live element.
 *
 *  Tries the configured hook attribute first (`[attr="target"]`), preserving the
 *  original attribute-name anchoring; when nothing matches, falls back to treating
 *  `target` as a raw CSS selector (so the picker can target un-tagged elements).
 *  Returns null on miss or on an invalid selector string. */
export function resolveTarget(
  doc: Document,
  attr: string,
  target: string,
): HTMLElement | null {
  const byAttr = doc.querySelector<HTMLElement>(selectorFor(attr, target));
  if (byAttr) return byAttr;
  try {
    return doc.querySelector<HTMLElement>(target);
  } catch {
    return null; // hand-authored target may be an invalid CSS selector
  }
}
