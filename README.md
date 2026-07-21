# prototype-collab-tools

**Drop-in, framework-agnostic tools for handing off web prototypes from design to engineering & QA.**

When product/design finish a prototype, they need engineering and QA to *understand* it — which screens exist, how they connect, and what each part of the UI is meant to do. These tools add that context on top of any prototype without changing how it's built:

- **Navigate** between flows (a menu of every screen/state, with live thumbnails).
- **Annotate** the UI (labelled callouts explaining intent), authored in a Google Sheet.

Everything renders inside a **Shadow DOM** root, so it drops into *any* app — plain HTML, React, Vue, Svelte, any framework or version — with no style collisions and no build step. It's a **read-only handoff**: design authors the content, engineering & QA read it. There's no backend and no account.

## The packages

| Package | What it does |
| ------- | ------------ |
| **[proto-nav](packages/proto-nav)** | A **prototype navigator** — a gallery of flow cards (grouped as flows / requirements / edge cases) with live iframe thumbnails, plus a persistent floating **Menu** button on every page that deep-links across your prototype. |
| **[annotations](packages/annotations)** | **Design-authored annotations** — numbered callouts anchored to UI elements via a `data-annote` attribute, with copy authored in a **Google Sheet**. Each callout can be minimized to just its number; overlapping ones can be clicked to the front. |
| `@proto-collab/shared` | Internal Shadow-DOM mount primitive, bundled into both (not published). |

The two are independent — use either alone — but integrate: proto-nav can host the annotations show/hide control right in its menu.

## Screenshots

**proto-nav** — a gallery of flow cards with a persistent Menu button:

![proto-nav gallery](docs/images/proto-nav.png)

**annotations** — numbered callouts anchored to `data-annote` elements; the selected one shows a neon highlight ring:

![annotations callouts](docs/images/annotations.png)

<sub>Regenerate with `./scripts/screenshots.sh` (see the script header for prerequisites).</sub>

## Quick start

Zero-install via CDN — drop a script tag into any prototype:

```html
<!-- Navigator: a menu of your flows -->
<script src="https://cdn.jsdelivr.net/npm/proto-nav"></script>
<script>
  ProtoNav.init({
    startOpen: true,            // open the menu on load
    entries: [
      { title: "Chat Intake",   url: "/ui/chat",    type: "flow" },
      { title: "Consent gate",  url: "/ui/consent", type: "requirement" },
      { title: "Emergency 911", url: "/ui/911",     type: "edge-case" }
    ]
  });
</script>

<!-- Annotations: auto-boots from a published Google Sheet -->
<script
  src="https://cdn.jsdelivr.net/npm/annotations"
  data-sheet="https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv"
></script>
```

Or install from npm: `npm install proto-nav annotations`.

## How to use it

### 1. Navigator (proto-nav)

Give it a list of `{ title, url }` entries (inline, or fetched from a JSON `src`). It renders a floating **Menu** button on every page; clicking it opens a gallery that deep-links into each flow. Cards show a **live preview** of each page by default (set a per-entry `thumbnail` image, or `previews: false`, for pages that block iframing). Full options and API: **[packages/proto-nav](packages/proto-nav)**.

### 2. Annotations

Two steps:

**a. Mark up the prototype.** Add a `data-annote="<name>"` attribute to any element you want to annotate:

```html
<button data-annote="start-visit">Start visit</button>
```

**b. Write the notes in a Google Sheet** (File → Share → **Publish to web** → CSV), one row per annotation:

| target | number | title | body | placement |
| ------ | ------ | ----- | ---- | --------- |
| start-visit | 1.2 | Primary CTA | Disabled until the form is valid. | bottom |

Point the widget at the published CSV URL (`data-sheet=…` or `Annotations.init({ sheetUrl })`) and the callouts appear, anchored to your elements. The `number` column is free-form so **dotted / suffixed labels like `1.2` or `1.2a` work**. Annotations are **off by default** behind a "Show notes" toggle; each callout can be **minimized** to just its number badge. Full column reference and API: **[packages/annotations](packages/annotations)**.

### Combining them

Set proto-nav's `notesToggle: true` and annotations' `toggleButton: false` — the "Show / Hide notes" control then lives inside the nav menu instead of a separate floating button. A complete working example is in **[examples/combined.html](examples/combined.html)**.

## Develop

Requires Node 18+. Uses npm workspaces.

```bash
npm install
npm run build       # build all packages
npm test            # run all unit tests
npm run typecheck   # typecheck all packages
```

Try the demos over a static server (Shadow-DOM widgets need HTTP, not `file://`):

```bash
npm run build
npx http-server . -p 8080
# then open:
#   http://localhost:8080/examples/combined.html
#   http://localhost:8080/packages/proto-nav/demo/script-demo.html
#   http://localhost:8080/packages/annotations/demo/index.html
```

## Design principles

- **Framework-agnostic.** Preact is bundled into each package; the host's framework (or lack of one) is irrelevant. Never peer-depend on the host's React.
- **Shadow DOM isolation** is non-negotiable — it's what makes these safe to drop into any app.
- **Navigation is a full page load**, deliberately router-agnostic.
- **No backend.** proto-nav takes an inline/JSON list; annotations reads a published sheet or a committed JSON snapshot.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Laura Flugga
