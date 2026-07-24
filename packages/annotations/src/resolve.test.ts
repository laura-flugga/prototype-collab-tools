// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { resolveTarget, selectorFor } from "./resolve";

function setBody(html: string): void {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  document.body.replaceChildren(...Array.from(parsed.body.childNodes));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("selectorFor", () => {
  it("escapes quotes in the value", () => {
    expect(selectorFor("data-annote", 'a"b')).toBe('[data-annote="a\\"b"]');
  });
});

describe("resolveTarget", () => {
  it("resolves a data-annote value via the attribute selector", () => {
    setBody(`<button data-annote="save">Save</button>`);
    const el = document.querySelector("button");
    expect(resolveTarget(document, "data-annote", "save")).toBe(el);
  });

  it("prefers the attribute match over a same-named element", () => {
    // A raw `button` selector would match the <button>, but the attribute wins.
    setBody(`<div data-annote="button">tagged</div><button>real</button>`);
    expect(resolveTarget(document, "data-annote", "button")).toBe(
      document.querySelector("div"),
    );
  });

  it("falls back to a raw CSS selector when no attribute matches", () => {
    setBody(`<section id="cta"><span>x</span></section>`);
    expect(resolveTarget(document, "data-annote", "#cta")).toBe(
      document.querySelector("#cta"),
    );
    expect(resolveTarget(document, "data-annote", "section > span")).toBe(
      document.querySelector("span"),
    );
  });

  it("returns null for an invalid selector string instead of throwing", () => {
    setBody(`<div>x</div>`);
    expect(resolveTarget(document, "data-annote", "::::nope")).toBeNull();
  });

  it("returns null when nothing matches", () => {
    setBody(`<div>x</div>`);
    expect(resolveTarget(document, "data-annote", "missing")).toBeNull();
  });
});
