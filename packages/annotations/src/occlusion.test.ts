// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { isCovered } from "./occlusion";

const setup = (stack: (doc: Document, target: HTMLElement) => Element[]) => {
  document.body.innerHTML =
    '<div id="annotations-host"></div><div id="page"><button id="t">Go</button></div><div id="backdrop"></div>';
  const target = document.getElementById("t")!;
  target.getBoundingClientRect = () =>
    ({ left: 10, top: 10, width: 20, height: 20, right: 30, bottom: 30 }) as DOMRect;
  document.elementsFromPoint = () => stack(document, target);
  return target;
};

describe("isCovered", () => {
  it("is false when the target is on top", () => {
    const t = setup((_, target) => [target, document.body]);
    expect(isCovered(document, t, "annotations-host")).toBe(false);
  });

  it("is false when a child of the target or an ancestor is on top", () => {
    const t = setup((doc) => [doc.getElementById("page")!, doc.body]);
    expect(isCovered(document, t, "annotations-host")).toBe(false);
  });

  it("ignores our own callouts", () => {
    const t = setup((doc, target) => [doc.getElementById("annotations-host")!, target]);
    expect(isCovered(document, t, "annotations-host")).toBe(false);
  });

  it("is true when an overlay is drawn over the target", () => {
    const t = setup((doc, target) => [doc.getElementById("backdrop")!, target]);
    expect(isCovered(document, t, "annotations-host")).toBe(true);
  });

  it("is false when the target is scrolled out of view", () => {
    const t = setup((doc) => [doc.getElementById("backdrop")!]);
    t.getBoundingClientRect = () =>
      ({ left: 10, top: -500, width: 20, height: 20, right: 30, bottom: -480 }) as DOMRect;
    expect(isCovered(document, t, "annotations-host")).toBe(false);
  });
});
