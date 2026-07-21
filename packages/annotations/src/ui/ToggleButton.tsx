import { annotations, toggle, visible } from "../core/store";

/** Floating on/off button. Annotations are hidden until toggled on so the tool
 *  never clutters the host app unprompted. */
export function ToggleButton() {
  const on = visible.value;
  const count = annotations.value.length;
  return (
    <button
      type="button"
      class={`an-toggle${on ? " an-on" : ""}`}
      aria-pressed={on}
      onClick={toggle}
    >
      {on ? "Hide notes" : "Show notes"}
      {count > 0 ? <span class="an-toggle-count">{count}</span> : null}
    </button>
  );
}
