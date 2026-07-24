// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { buildTarget } from "./selector";

/** Build a fixture body from an HTML string without touching innerHTML. */
function setBody(html: string): void {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  document.body.replaceChildren(...Array.from(parsed.body.childNodes));
}

afterEach(() => {
  document.body.replaceChildren();
});

/** Assert the generated target round-trips back to the same element. */
function expectResolves(el: Element, attr = "data-annote"): string {
  const target = buildTarget(el, attr);
  // Attribute values (step 1) aren't selectors — resolve via the [attr="…"] form.
  const sel = el.hasAttribute(attr) ? `[${attr}="${target.replace(/"/g, '\\"')}"]` : target;
  expect(document.querySelectorAll(sel).length).toBe(1);
  expect(document.querySelector(sel)).toBe(el);
  return target;
}

describe("buildTarget", () => {
  it("returns the raw hook-attribute value when present", () => {
    setBody(`<button data-annote="start-visit">Go</button>`);
    const el = document.querySelector("button")!;
    expect(buildTarget(el, "data-annote")).toBe("start-visit");
    expectResolves(el);
  });

  it("respects a custom hook attribute", () => {
    setBody(`<div data-note="hero">x</div>`);
    const el = document.querySelector("div")!;
    expect(buildTarget(el, "data-note")).toBe("hero");
  });

  it("uses a unique #id", () => {
    setBody(`<section id="cta"><span>x</span></section>`);
    const el = document.querySelector("#cta")!;
    expect(buildTarget(el, "data-annote")).toBe("#cta");
    expectResolves(el);
  });

  it("escapes ids that need it and still resolves", () => {
    setBody(`<div id="a.b:c">x</div>`);
    const el = document.querySelector("div")!;
    const target = buildTarget(el, "data-annote");
    expect(target.startsWith("#")).toBe(true);
    expectResolves(el);
  });

  it("handles an id starting with a digit", () => {
    setBody(`<div id="123">x</div>`);
    const el = document.getElementById("123")!;
    expectResolves(el); // CSS.escape rescues the leading digit
  });

  it("falls through a duplicated id to a unique structural selector", () => {
    setBody(`<div id="dup">a</div><div id="dup">b</div>`);
    const second = document.querySelectorAll("div")[1];
    const target = buildTarget(second, "data-annote");
    expect(target).not.toBe("#dup"); // #dup matches two elements
    expectResolves(second);
  });

  it("prefers data-testid over other data-* and other anchors", () => {
    setBody(`<button data-testid="save" data-foo="x">Save</button>`);
    const el = document.querySelector("button")!;
    expect(buildTarget(el, "data-annote")).toBe('[data-testid="save"]');
    expectResolves(el);
  });

  it("uses another data-* attribute when no test-id is present", () => {
    setBody(`<a data-track="hero-link">L</a>`);
    const el = document.querySelector("a")!;
    expect(buildTarget(el, "data-annote")).toBe('[data-track="hero-link"]');
    expectResolves(el);
  });

  it("escapes quotes in attribute values", () => {
    setBody(`<div data-testid='he said "hi"'>x</div>`);
    const el = document.querySelector("div")!;
    const target = buildTarget(el, "data-annote");
    expect(target).toBe('[data-testid="he said \\"hi\\""]');
    expectResolves(el);
  });

  it("disambiguates same-tag siblings with nth-of-type", () => {
    setBody(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
    const items = document.querySelectorAll("li");
    const targets = new Set([0, 1, 2].map((i) => buildTarget(items[i], "data-annote")));
    expect(targets.size).toBe(3); // each item gets a distinct selector
    items.forEach((li) => expectResolves(li));
  });

  it("anchors a structural path on an ancestor id when a bare path is ambiguous", () => {
    // Two spans → `span:nth-of-type(1)` is ambiguous, forcing the climb to #panel.
    setBody(`<section id="panel"><div><span>x</span></div></section><div><span>y</span></div>`);
    const span = document.querySelector("#panel span")!;
    const target = buildTarget(span, "data-annote");
    expect(target.startsWith("#panel")).toBe(true);
    expectResolves(span);
  });
});
