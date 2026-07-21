import { fetchConfig, normalizeConfig } from "./core/config";
import { mount, unmount } from "./core/mount";
import {
  closeGallery,
  config as configSignal,
  openGallery,
  isOpen,
} from "./core/store";
import { isActive } from "./nav";
import type { ProtoNavConfig } from "./types";

export type {
  ButtonPosition,
  Entry,
  EntryType,
  ProtoNavConfig,
} from "./types";

/** Mount the Menu button + gallery. Idempotent: calling `init` again replaces
 *  the active config. Inline `entries` take precedence; if only `src` is given,
 *  config is fetched asynchronously and applied when ready. */
function init(raw: ProtoNavConfig = {}): void {
  mount();

  const apply = (cfg: ProtoNavConfig) => {
    const normalized = normalizeConfig(cfg);
    configSignal.value = normalized;
    if (
      normalized.startOpen ||
      (normalized.openOnFirstLoad && !normalized.entries.some((e) => isActive(e.url)))
    ) {
      openGallery();
    }
  };

  if (raw.entries && raw.entries.length > 0) {
    apply(raw);
  } else if (raw.src) {
    void fetchConfig(raw.src)
      .then(({ entries, title }) => apply({ ...raw, entries, title: raw.title ?? title }))
      .catch((err) => console.error("[proto-nav]", err));
  } else {
    apply(raw); // empty config → button + "no prototypes configured" state
  }
}

/** Open the gallery overlay. */
function open(): void {
  openGallery();
}

/** Close the gallery overlay. */
function close(): void {
  closeGallery();
}

/** Remove the widget entirely (host element + listeners). */
function destroy(): void {
  configSignal.value = null;
  isOpen.value = false;
  unmount();
}

export const ProtoNav = { init, open, close, destroy };
export { init, open, close, destroy };
export default ProtoNav;
