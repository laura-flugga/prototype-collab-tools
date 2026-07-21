import type { NormalizedEntry } from "../types";

const PALETTE = [
  ["#6366f1", "#a855f7"],
  ["#0ea5e9", "#22d3ee"],
  ["#f59e0b", "#f43f5e"],
  ["#10b981", "#84cc16"],
  ["#ec4899", "#8b5cf6"],
  ["#14b8a6", "#3b82f6"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(title: string): string {
  const words = title.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Generated gradient thumbnail (initials on a deterministic color) used when an
 *  entry has no `thumbnail`. */
export function Placeholder({ entry }: { entry: NormalizedEntry }) {
  const [a, b] = PALETTE[hash(entry.id) % PALETTE.length];
  return (
    <div
      class="pn-thumb"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${a}, ${b})`,
        color: "#fff",
        fontSize: "28px",
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
      aria-hidden="true"
    >
      {initials(entry.title)}
    </div>
  );
}
