import { describe, expect, it } from "vitest";
import { parseCsv } from "@proto-collab/shared";
import { coerceAnnotations, rowsToAnnotations } from "./sheet";

const rows = (csv: string) => rowsToAnnotations(parseCsv(csv));

describe("rowsToAnnotations", () => {
  it("maps header-named columns regardless of order", () => {
    const out = rows("title,target,body\nHeading,btn,Some copy");
    expect(out).toEqual([
      { id: "btn-1", target: "btn", title: "Heading", body: "Some copy", placement: undefined, order: undefined },
    ]);
  });

  it("drops rows explicitly disabled", () => {
    const out = rows("target,title,enabled\na,A,TRUE\nb,B,FALSE\nc,C,no\nd,D,");
    expect(out.map((a) => a.target)).toEqual(["a", "d"]);
  });

  it("keeps only valid placements", () => {
    const out = rows("target,title,placement\na,A,left\nb,B,sideways");
    expect(out[0].placement).toBe("left");
    expect(out[1].placement).toBeUndefined();
  });

  it("sorts by order when present", () => {
    const out = rows("target,title,order\na,A,3\nb,B,1\nc,C,2");
    expect(out.map((a) => a.target)).toEqual(["b", "c", "a"]);
  });

  it("skips blank rows and rows with neither target nor title", () => {
    const out = rows("target,title\n,\na,A\n,");
    expect(out).toHaveLength(1);
  });

  it("uses an explicit id when provided", () => {
    expect(rows("id,target,title\nx1,a,A")[0].id).toBe("x1");
  });

  it("reads a dotted/suffixed display number from the sheet", () => {
    const out = rows("target,title,number\na,A,1.2\nb,B,3.4a\nc,C,");
    expect(out.map((x) => x.number)).toEqual(["1.2", "3.4a", undefined]);
  });
});

describe("coerceAnnotations", () => {
  it("accepts an array and filters disabled + invalid entries", () => {
    const out = coerceAnnotations([
      { target: "a", title: "A" },
      { title: "no target" },
      { target: "b", title: "B", enabled: false },
    ]);
    expect(out.map((a) => a.target)).toEqual(["a"]);
  });

  it("accepts an { annotations } wrapper object", () => {
    const out = coerceAnnotations({ annotations: [{ target: "a", title: "A" }] });
    expect(out).toHaveLength(1);
  });
});
