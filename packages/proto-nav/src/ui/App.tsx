import { config, isOpen } from "../core/store";
import { Toolbar } from "./Toolbar";
import { Gallery } from "./Gallery";

/** Root component rendered into the shadow root. Reactive to the `config` and
 *  `isOpen` signals, so the imperative API (init/open/close) drives the UI. */
export function App() {
  const cfg = config.value;
  if (!cfg) return null;
  return (
    <>
      <Toolbar position={cfg.position} draggable={cfg.draggable} notesToggle={cfg.notesToggle} />
      {isOpen.value ? <Gallery config={cfg} /> : null}
    </>
  );
}
