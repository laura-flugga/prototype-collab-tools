import { config, isOpen } from "../core/store";
import { MenuButton } from "./MenuButton";
import { Gallery } from "./Gallery";

/** Root component rendered into the shadow root. Reactive to the `config` and
 *  `isOpen` signals, so the imperative API (init/open/close) drives the UI. */
export function App() {
  const cfg = config.value;
  if (!cfg) return null;
  return (
    <>
      <MenuButton position={cfg.position} draggable={cfg.draggable} />
      {isOpen.value ? <Gallery config={cfg} /> : null}
    </>
  );
}
