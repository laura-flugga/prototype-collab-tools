import { describe, expect, it } from "vitest";
import { normalizeConfig, slug } from "./config";

describe("slug", () => {
  it("lowercases and hyphenates", () => {
    expect(slug("Chat Intake")).toBe("chat-intake");
  });
  it("strips punctuation and collapses separators", () => {
    expect(slug("Emergency 911 — interstitial!")).toBe("emergency-911-interstitial");
  });
  it("falls back for empty-ish input", () => {
    expect(slug("!!!")).toBe("entry");
  });
});

describe("normalizeConfig", () => {
  it("applies defaults", () => {
    const c = normalizeConfig({});
    expect(c.title).toBe("Prototypes");
    expect(c.position).toBe("bottom-right");
    expect(c.draggable).toBe(true);
    expect(c.openOnFirstLoad).toBe(false);
    expect(c.entries).toEqual([]);
  });

  it("assigns ids from titles and enforces uniqueness", () => {
    const c = normalizeConfig({
      entries: [
        { title: "Flow A", url: "/a" },
        { title: "Flow A", url: "/a2" },
      ],
    });
    expect(c.entries.map((e) => e.id)).toEqual(["flow-a", "flow-a-2"]);
  });

  it("defaults entry type to flow and drops malformed entries", () => {
    const c = normalizeConfig({
      entries: [
        { title: "Ok", url: "/ok" },
        { title: "No url" } as never,
      ],
    });
    expect(c.entries).toHaveLength(1);
    expect(c.entries[0].type).toBe("flow");
  });

  it("rejects an invalid position", () => {
    expect(normalizeConfig({ position: "middle" as never }).position).toBe("bottom-right");
  });
});
