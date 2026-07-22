/** Proximity clustering for annotation anchors. Pure and DOM-free so it can be
 *  unit-tested; callers pass in the measured rects. */

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Positioned<T> {
  rect: Rect;
  value: T;
}

// A minimized note collapses to a number badge pinned on its target's top-left
// corner. Two such badges would overlap if those corners are within roughly a
// badge's footprint — so annotations that close ALWAYS cluster, guaranteeing
// badges can never overlap regardless of `clusterDistance`.
const BADGE_FOOTPRINT = 34;

/** True when the two anchors are close enough to cluster: either rect `a`
 *  inflated by `d` intersects `b` (visual proximity), or their top-left corners
 *  are within a badge footprint (so corner-pinned badges can't collide). */
function near(a: Rect, b: Rect, d: number): boolean {
  const rectClose =
    a.left - d < b.right &&
    a.right + d > b.left &&
    a.top - d < b.bottom &&
    a.bottom + d > b.top;
  const cornerClose =
    Math.abs(a.left - b.left) < BADGE_FOOTPRINT && Math.abs(a.top - b.top) < BADGE_FOOTPRINT;
  return rectClose || cornerClose;
}

/** Group items whose rects are within `distance` px of each other, transitively
 *  (a chain of near items forms one group). Groups and their members preserve
 *  first-seen order. `distance <= 0` disables grouping (every item is its own
 *  group). */
export function clusterByProximity<T>(items: Positioned<T>[], distance: number): T[][] {
  const n = items.length;

  // Union-find over item indices.
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== root) {
      const next = parent[x];
      parent[x] = root;
      x = next;
    }
    return root;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  if (distance > 0) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (near(items[i].rect, items[j].rect, distance)) union(i, j);
      }
    }
  }

  // Bucket by root, preserving first-seen order of both groups and members.
  const groups = new Map<number, T[]>();
  const order: number[] = [];
  for (let i = 0; i < n; i++) {
    const root = find(i);
    let bucket = groups.get(root);
    if (!bucket) {
      bucket = [];
      groups.set(root, bucket);
      order.push(root);
    }
    bucket.push(items[i].value);
  }
  return order.map((root) => groups.get(root)!);
}
