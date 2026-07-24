/** Build the best `target` string for an authored annotation from a live element.
 *
 *  Preference order (most stable first); every generated selector is verified to
 *  resolve back to exactly `el`, so the result always round-trips through
 *  `querySelector`:
 *    1. the configured hook attribute's value (e.g. `data-annote`) — copied raw;
 *    2. a unique `#id`;
 *    3. a `data-*` attribute selector (test-id style names preferred);
 *    4. a structural `tag:nth-of-type(n)` path, optionally anchored on an
 *       ancestor's unique id.
 */

/** `data-*` attribute names that tend to be stable, tried before other data-*. */
const STABLE_DATA_ATTRS = ["data-testid", "data-test", "data-cy", "data-qa"];

/** Escape a value for use inside `[attr="…"]` (mirrors resolve.ts `selectorFor`). */
function cssAttrValue(v: string): string {
  return v.replace(/"/g, '\\"');
}

/** `CSS.escape` for an id token, with a fallback for environments that lack the
 *  `CSS` interface (e.g. jsdom). Escapes a leading digit and any non-ident char. */
function escapeIdent(s: string): string {
  const g = globalThis as { CSS?: { escape?(v: string): string } };
  if (typeof g.CSS?.escape === "function") return g.CSS.escape(s);
  let out = s.replace(/[^\w-]/g, (c) => `\\${c}`);
  if (/^\d/.test(out)) out = `\\3${out[0]} ${out.slice(1)}`;
  return out;
}

/** True iff `sel` resolves to exactly `el` within its document. */
function isUnique(el: Element, sel: string): boolean {
  try {
    const found = el.ownerDocument.querySelectorAll(sel);
    return found.length === 1 && found[0] === el;
  } catch {
    return false; // invalid selector (e.g. an id CSS.escape can't rescue)
  }
}

/** 1-based index of `el` among its same-tag siblings (for `:nth-of-type`). */
function nthOfType(el: Element): number {
  let i = 1;
  let sib = el.previousElementSibling;
  while (sib) {
    if (sib.localName === el.localName) i++;
    sib = sib.previousElementSibling;
  }
  return i;
}

/** A `tag:nth-of-type(n)` step for one element (localName keeps SVG lowercase). */
function step(el: Element): string {
  return `${el.localName}:nth-of-type(${nthOfType(el)})`;
}

/** Shortest structural path that uniquely resolves to `el`, climbing until the
 *  joined path is unique or an ancestor's unique id can anchor it. */
function structuralSelector(el: Element): string {
  const doc = el.ownerDocument;
  const parts: string[] = [step(el)];
  if (isUnique(el, parts.join(" > "))) return parts.join(" > ");

  let node = el.parentElement;
  while (node && node !== doc.documentElement) {
    const id = node.getAttribute("id");
    if (id) {
      const anchored = `#${escapeIdent(id)}`;
      if (isUnique(node, anchored)) {
        const candidate = [anchored, ...parts].join(" > ");
        if (isUnique(el, candidate)) return candidate;
      }
    }
    parts.unshift(step(node));
    const candidate = parts.join(" > ");
    if (isUnique(el, candidate)) return candidate;
    node = node.parentElement;
  }
  return parts.join(" > ");
}

/** Best target string for `el`. `attribute` is the configured hook attribute. */
export function buildTarget(el: Element, attribute: string): string {
  // 1. Configured hook attribute wins — copy the raw value the resolver re-wraps.
  const attrVal = el.getAttribute(attribute);
  if (attrVal) return attrVal;

  // 2. Unique id.
  const id = el.getAttribute("id");
  if (id) {
    const sel = `#${escapeIdent(id)}`;
    if (isUnique(el, sel)) return sel;
  }

  // 3. Stable data-* attributes (preferred names first, then any other data-*).
  const dataNames: string[] = [];
  for (const name of STABLE_DATA_ATTRS) {
    if (el.hasAttribute(name)) dataNames.push(name);
  }
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("data-") && !dataNames.includes(attr.name)) {
      dataNames.push(attr.name);
    }
  }
  for (const name of dataNames) {
    const sel = `[${name}="${cssAttrValue(el.getAttribute(name) ?? "")}"]`;
    if (isUnique(el, sel)) return sel;
  }

  // 4. Structural path.
  return structuralSelector(el);
}
