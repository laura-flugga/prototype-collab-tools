import type { AnnotationsConfig, NormalizedConfig } from "./types";

/** Read config from a script tag's data-* attributes (auto-boot path). */
export function configFromScript(script: HTMLScriptElement | null): AnnotationsConfig {
  if (!script) return {};
  const d = script.dataset;
  const cfg: AnnotationsConfig = {};
  if (d.sheet) cfg.sheetUrl = d.sheet;
  if (d.snapshot) cfg.snapshotUrl = d.snapshot;
  if (d.attribute) cfg.attribute = d.attribute;
  if (d.poll != null) cfg.pollMs = Number(d.poll) || 0;
  if (d.startVisible != null) cfg.startVisible = d.startVisible !== "false";
  if (d.observe != null) cfg.observe = d.observe !== "false";
  if (d.toggleButton != null) cfg.toggleButton = d.toggleButton !== "false";
  if (d.debug != null) cfg.debug = d.debug !== "false";
  return cfg;
}

/** Merge sources by precedence: arg > window.AnnotationsConfig > script data-*. */
export function resolveConfig(arg: AnnotationsConfig | undefined): AnnotationsConfig {
  const fromScript = configFromScript(
    (document.currentScript as HTMLScriptElement | null) ??
      document.querySelector<HTMLScriptElement>("script[data-sheet],script[data-snapshot]"),
  );
  const fromGlobal =
    (window as unknown as { AnnotationsConfig?: AnnotationsConfig }).AnnotationsConfig ?? {};
  return { ...fromScript, ...fromGlobal, ...(arg ?? {}) };
}

/** Apply defaults to the runtime-behavior fields. */
export function normalizeConfig(cfg: AnnotationsConfig): NormalizedConfig {
  return {
    attribute: cfg.attribute?.trim() || "data-annote",
    pollMs: Math.max(0, cfg.pollMs ?? 0),
    startVisible: cfg.startVisible ?? false,
    observe: cfg.observe ?? true,
    toggleButton: cfg.toggleButton ?? true,
    debug: cfg.debug ?? false,
  };
}
