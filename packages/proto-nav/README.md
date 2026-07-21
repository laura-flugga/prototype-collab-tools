# proto-nav

A tiny, **framework-agnostic** prototype navigator. Drop it into any web prototype and it renders a landing **gallery of flow cards** (grouped as flows / requirements / edge cases) that deep-link into each flow, plus a **persistent, draggable floating toolbar** on every page — a Menu button to open the gallery, and (with `notesToggle`) a Show/Hide notes button — that you can drag anywhere by its grip.

![proto-nav gallery](../../docs/images/proto-nav.png)

- **Works anywhere** — plain HTML, React, Vue, Svelte, any version. Preact is bundled in; it never touches the host's framework.
- **Style-isolated** — the whole UI renders inside a Shadow DOM root, so host CSS can't bleed in and its styles can't leak out.
- **No backend** — navigation is a full page load; you only provide a list of `{ title, url }`.

## Install

**CDN / script tag (zero install):**

```html
<script src="https://cdn.jsdelivr.net/npm/proto-nav"></script>
<script>
  ProtoNav.init({
    title: "My Prototype",
    entries: [
      { title: "Chat Intake", url: "/ui/chat", type: "flow" },
      { title: "Consent required", url: "/ui/consent", type: "requirement" },
      { title: "Emergency interstitial", url: "/ui/911", type: "edge-case" }
    ]
  });
</script>
```

**npm:**

```bash
npm install proto-nav
```

```ts
import { ProtoNav } from "proto-nav";

ProtoNav.init({ src: "/proto-nav.json" }); // or inline `entries`
```

## API

```ts
ProtoNav.init(config: ProtoNavConfig): void  // mount button + gallery (idempotent)
ProtoNav.open(): void
ProtoNav.close(): void
ProtoNav.destroy(): void
```

### `ProtoNavConfig`

| Option            | Type                                                          | Default          | Description |
| ----------------- | ------------------------------------------------------------ | ---------------- | ----------- |
| `entries`         | `Entry[]`                                                    | —                | Inline entries. Takes precedence over `src`. |
| `src`             | `string`                                                    | —                | URL to fetch a JSON config: an `Entry[]` or `{ entries, title }`. |
| `title`           | `string`                                                    | `"Prototypes"`   | Gallery heading. |
| `position`        | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `"bottom-right"` | Toolbar corner. |
| `draggable`       | `boolean`                                                    | `true`           | Drag the toolbar by its grip; position persists in `localStorage`. |
| `startOpen`       | `boolean`                                                    | `false`          | Open the gallery immediately on load, every time. |
| `openOnFirstLoad` | `boolean`                                                    | `false`          | Open the gallery on load only if no entry URL matches the current page. |
| `previews`        | `boolean`                                                    | `true`           | Use a live iframe preview of each flow as its card thumbnail (a per-entry `thumbnail` always wins). Pages that forbid framing render blank — set a `thumbnail` for those, or `previews: false` for placeholders. |
| `notesToggle`     | `boolean`                                                    | `false`          | Add a "Show / Hide notes" button to the floating toolbar (and a matching control in the gallery) that drives the [`annotations`](../annotations) widget via its `window.Annotations` global. Pair with the annotations widget's `toggleButton: false`. |

### `Entry`

```ts
interface Entry {
  title: string;        // card title
  url: string;          // navigated to via a full page load
  id?: string;          // defaults to a slug of `title`
  type?: string;        // grouping bucket; default "flow"
  description?: string; // supporting copy under the title
  thumbnail?: string;   // image URL; falls back to a generated placeholder
}
```

Entries are grouped by `type`. `flow`, `requirement`, and `edge-case` get friendly section headings; any other value is title-cased and used as its own section. The card matching the current URL is highlighted automatically.

## License

MIT
