# Feedless

Hide the distracting parts of Instagram and Facebook — feeds, Reels, Stories,
suggested posts, notification badges, and more. Each surface is an individual
toggle. Like [Unhook](https://unhook.app/) for YouTube, but for Meta.

## Features

- 19 independent toggles across Instagram (9) and Facebook (10)
- Instant apply — no page reload, no flash of hidden content
- Per-site pause switch
- Settings sync across your browsers
- **Zero tracking**: no analytics, no network requests, `storage` permission only

## Install (dev)

```bash
bun install
bun run dev          # Chrome with the extension loaded
bun run dev:firefox
```

## Architecture

Feature definitions in `src/features/*.ts` are the single source of truth:
the popup UI, the generated hiding CSS (`bun run generate`), and the test
suite all derive from them. Content scripts stamp `data-df-*` attributes on
`<html>` at `document_start`; attribute-gated CSS does all hiding. See
`docs/superpowers/specs/` for the full design.

## Tests

```bash
bun run test   # unit (Vitest)
bun run e2e    # selector fixtures (Playwright)
```

Live-site verification before each release: `docs/verify-checklist.md`.

## License

MIT
