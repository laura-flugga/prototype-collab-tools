# Contributing

Thanks for your interest! This is a small monorepo of drop-in prototype-handoff tools.

## Setup

```bash
npm install
npm run build
npm test
```

## Layout

```
packages/
  shared/        # @proto-collab/shared — Shadow-DOM mount primitive (bundled, not published)
  proto-nav/     # prototype navigator
  annotations/   # design-authored annotations
```

Each package is built with [tsup](https://tsup.egoist.dev/) into ESM + CJS + a minified IIFE (for the `<script>`/CDN path) + type declarations. Preact is bundled in — never add the host's framework as a peer dependency.

## Ground rules

- **Shadow DOM isolation is non-negotiable.** All UI renders inside the shadow root via `@proto-collab/shared`'s `createShadowHost`. Never inject styles into the host document.
- **Stay framework-agnostic.** No dependency on the host app's router, framework, or version.
- **Keep the runtime dependency-light.** Optional/heavy tooling (e.g. a thumbnail CLI) must stay out of the runtime bundle.
- **Add tests** for pure logic (parsing, config normalization). Run `npm test` before opening a PR.

## Before a PR

```bash
npm run typecheck && npm test && npm run build
```

Verify the demos still work over a static server (see the root README).

## Commit / PR

Keep PRs focused. Describe what changed and why, and note any change to a package's public API.
