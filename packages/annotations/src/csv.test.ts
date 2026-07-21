import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a simple table", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with commas and newlines", () => {
    const csv = 'id,body\n1,"hello, world"\n2,"line one\nline two"';
    expect(parseCsv(csv)).toEqual([
      ["id", "body"],
      ["1", "hello, world"],
      ["2", "line one\nline two"],
    ]);
  });

  it("handles escaped quotes", () => {
    expect(parseCsv('x\n"she said ""hi"""')).toEqual([["x"], ['she said "hi"']]);
  });

  it("normalizes CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});
