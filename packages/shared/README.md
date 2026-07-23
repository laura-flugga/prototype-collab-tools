# @proto-collab/shared

Shared primitives behind the [prototype-collab tools](https://github.com/laura-flugga/prototype-collab-tools) — the pieces [`@proto-collab/nav`](../proto-nav) and [`@proto-collab/annotations`](../annotations) both need.

Both widgets **inline this package** into their own bundles, so you don't install it to use them. It's published for direct reuse: if you're building a drop-in widget of your own, the Shadow-DOM host and CSV parser are the fiddly parts.

```bash
npm install @proto-collab/shared
```

## Shadow-DOM host

Every widget mounts exactly one zero-size host `<div>` on `document.body`, attaches an open shadow root, injects its CSS, and renders into the returned element. The shadow root is what isolates the widget's styles from the host page — and the host's from the widget.

```ts
import { createShadowHost, getShadowRoot, removeShadowHost } from "@proto-collab/shared";

const host = createShadowHost("my-widget-host", css, "my-root");
if (host) render(<App />, host.root); // null when that id is already mounted
```

| Export                              | Purpose |
| ----------------------------------- | ------- |
| `createShadowHost(id, css, rootClass)` | Create host + shadow root once; returns `{ host, root }`, or `null` if `id` already exists (idempotent mount guard). |
| `getShadowRoot(id, rootClass)`      | Look up an existing host's render root, if mounted. |
| `removeShadowHost(id)`              | Remove a host element and its shadow tree. |

The host is `position: absolute` at the top-left with zero size, so it never affects layout — all visible UI inside is `position: fixed`.

## CSV

`parseCsv(text)` returns `Record<string, string>[]`, keyed by the header row. It handles quoted fields, embedded commas and newlines, and `""` escapes — enough for published Google Sheets, which is what both widgets author their content in.

```ts
import { parseCsv } from "@proto-collab/shared";

const rows = parseCsv(await (await fetch(publishedSheetUrl)).text());
```

## Types

`Placement` — `"top" | "bottom" | "left" | "right"`, the callout/anchor sides shared across the widgets.

## License

MIT
