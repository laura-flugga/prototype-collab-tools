import { describe, expect, it } from "vitest";
import { clusterByProximity, type Positioned } from "./cluster";

const box = (id: string, left: number, top: number, w = 20, h = 20): Positioned<string> => ({
  value: id,
  rect: { left, top, right: left + w, bottom: top + h },
});

describe("clusterByProximity", () => {
  it("groups two adjacent (near-touching) rects", () => {
    // b starts 8px to the right of a's right edge → within distance 16.
    const groups = clusterByProximity([box("a", 0, 0), box("b", 28, 0)], 16);
    expect(groups).toHaveLength(1);
    expect(groups[0].sort()).toEqual(["a", "b"]);
  });

  it("groups overlapping rects", () => {
    const groups = clusterByProximity([box("a", 0, 0), box("b", 10, 10)], 4);
    expect(groups).toEqual([["a", "b"]]);
  });

  it("keeps far-apart rects in separate groups", () => {
    const groups = clusterByProximity([box("a", 0, 0), box("b", 500, 0)], 16);
    expect(groups).toEqual([["a"], ["b"]]);
  });

  it("merges transitive chains (a~b, b~c ⇒ one group)", () => {
    const groups = clusterByProximity([box("a", 0, 0), box("b", 30, 0), box("c", 60, 0)], 16);
    expect(groups).toHaveLength(1);
    expect(groups[0].sort()).toEqual(["a", "b", "c"]);
  });

  it("does not merge across a diagonal gap larger than distance", () => {
    // b is offset far on Y, so despite X-nearness they don't cluster.
    const groups = clusterByProximity([box("a", 0, 0), box("b", 28, 200)], 16);
    expect(groups).toEqual([["a"], ["b"]]);
  });

  it("clusters when corner-pinned badges would collide, even past the rect gap", () => {
    // Two short stacked elements with a 20px gap (> distance 16), but their
    // top-left corners are only 24px apart → their corner-pinned badges would
    // overlap, so they must cluster.
    const groups = clusterByProximity(
      [box("a", 0, 0, 20, 4), box("b", 0, 24, 20, 4)],
      16,
    );
    expect(groups).toEqual([["a", "b"]]);
  });

  it("disables grouping when distance <= 0", () => {
    const groups = clusterByProximity([box("a", 0, 0), box("b", 5, 0)], 0);
    expect(groups).toEqual([["a"], ["b"]]);
  });

  it("preserves first-seen order of groups and members", () => {
    const groups = clusterByProximity(
      [box("a", 0, 0), box("z", 500, 0), box("b", 28, 0)],
      16,
    );
    expect(groups).toEqual([["a", "b"], ["z"]]);
  });
});
