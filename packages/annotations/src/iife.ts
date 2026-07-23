// IIFE entry: tsup exposes these named exports as `window.Annotations`
// (globalName: "Annotations"), so `Annotations.init({ ... })` works.
import { init } from "./index";

export {
  init,
  show,
  hide,
  toggle,
  collapseAll,
  expandAll,
  toggleCollapseAll,
  isCollapsed,
  refresh,
  isVisible,
  destroy,
} from "./index";

// Auto-boot: if the loading <script> tag carries data-sheet / data-snapshot,
// initialize immediately with no code (`<script src=… data-sheet=…>`).
const current = document.currentScript as HTMLScriptElement | null;
if (current && (current.dataset.sheet || current.dataset.snapshot)) {
  init();
}
