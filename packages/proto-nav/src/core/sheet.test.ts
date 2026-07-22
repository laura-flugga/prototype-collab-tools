import { parseCsv } from "@proto-collab/shared";
import { describe, expect, it } from "vitest";
import { isCsvSource } from "./config";
import { rowsToEntries } from "./sheet";

const rows = (csv: string) => rowsToEntries(parseCsv(csv));

describe("rowsToEntries", () => {
  it("maps header-named columns regardless of order", () => {
    const out = rows("url,title,description\n/chat,Chat Intake,Where users land");
    expect(out).toEqual([
      { title: "Chat Intake", url: "/chat", description: "Where users land" },
    ]);
  });

  it("requires both title and url", () => {
    const out = rows("title,url\nNo url,\n,/orphan\nOk,/ok");
    expect(out.map((e) => e.url)).toEqual(["/ok"]);
  });

  it("drops rows explicitly disabled", () => {
    const out = rows("title,url,enabled\nA,/a,TRUE\nB,/b,FALSE\nC,/c,no\nD,/d,");
    expect(out.map((e) => e.title)).toEqual(["A", "D"]);
  });

  it("carries optional id, type and thumbnail through", () => {
    const out = rows("title,url,type,id,thumbnail\nEdge,/e,edge-case,e1,/t.png");
    expect(out[0]).toEqual({
      title: "Edge",
      url: "/e",
      type: "edge-case",
      id: "e1",
      thumbnail: "/t.png",
    });
  });

  it("accepts desc/thumb column aliases", () => {
    const out = rows("title,url,desc,thumb\nA,/a,Short copy,/t.png");
    expect(out[0].description).toBe("Short copy");
    expect(out[0].thumbnail).toBe("/t.png");
  });

  it("skips blank rows", () => {
    const out = rows("title,url\n,\nA,/a\n,");
    expect(out).toHaveLength(1);
  });

  it("returns an empty array for empty input", () => {
    expect(rowsToEntries([])).toEqual([]);
  });
});

describe("isCsvSource", () => {
  it("detects Google's published-CSV URL", () => {
    expect(isCsvSource("https://docs.google.com/.../pub?output=csv")).toBe(true);
  });

  it("detects a .csv extension, with or without query/hash", () => {
    expect(isCsvSource("/config.csv")).toBe(true);
    expect(isCsvSource("/config.csv?v=2")).toBe(true);
  });

  it("detects a text/csv content-type", () => {
    expect(isCsvSource("/config", "text/csv; charset=utf-8")).toBe(true);
  });

  it("treats a plain .json src as not CSV", () => {
    expect(isCsvSource("/proto-nav.json", "application/json")).toBe(false);
  });
});
