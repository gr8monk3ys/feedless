# Feedless — Design Spec

**Date:** 2026-07-06
**Status:** Approved pending final user review

## Overview

Feedless is a browser extension that removes distracting surfaces from Instagram and
Facebook — the equivalent of Unhook (YouTube) for Meta's platforms. Users toggle
individual features (feed, Reels, Stories, notification badges, …) from a popup;
hidden surfaces disappear instantly and never flash on page load.

**Audience:** published product — Chrome Web Store, Firefox AMO, Safari App Store.
**Browsers:** Chrome (primary), Firefox, Safari — one codebase via WXT.
**Non-goals (v1):** element picker (uBlock-style click-to-hide), scheduling/time
limits, mobile-web layouts (m.facebook.com), Threads, Messenger.com, analytics of
any kind.

## Feature set (the toggles)

Each toggle is a `FeatureDef` in a per-platform selector map. Grouped as shown in
the popup. Defaults: **Addictive core ON at install, everything else OFF.**

### Instagram

| ID | Label | Group | Default |
|----|-------|-------|---------|
| `ig.feed` | Hide home feed | Addictive core | on |
| `ig.reels` | Hide Reels (nav + pages) | Addictive core | on |
| `ig.explore` | Hide Explore (nav + page) | Addictive core | on |
| `ig.stories` | Hide Stories tray | Addictive core | on |
| `ig.suggested` | Hide suggested posts & users | Engagement bait | off |
| `ig.likeCounts` | Hide like/view counts | Engagement bait | off |
| `ig.comments` | Hide comments | Engagement bait | off |
| `ig.notifBadges` | Hide notification badges | Notification pressure | off |
| `ig.sidebar` | Hide right-rail suggestions | Sidebars & chrome | off |

### Facebook

| ID | Label | Group | Default |
|----|-------|-------|---------|
| `fb.feed` | Hide news feed | Addictive core | on |
| `fb.reels` | Hide Reels | Addictive core | on |
| `fb.stories` | Hide Stories | Addictive core | on |
| `fb.watch` | Hide Watch/Video | Addictive core | on |
| `fb.suggested` | Hide suggested posts / People You May Know | Engagement bait | off |
| `fb.likeCounts` | Hide reaction counts (best-effort) | Engagement bait | off |
| `fb.comments` | Hide comments | Engagement bait | off |
| `fb.notifBadges` | Hide notification badges | Notification pressure | off |
| `fb.rightRail` | Hide right rail (sponsored, contacts) | Sidebars & chrome | off |
| `fb.leftNav` | Hide left-nav shortcuts | Sidebars & chrome | off |

Plus per-platform master switches `ig._enabled` / `fb._enabled` (both default on);
when off, no attributes are stamped and the platform renders untouched.

## Architecture

WXT + React + TypeScript. Package manager: Bun.

```
wxt.config.ts               one config → chrome / firefox / safari builds
entrypoints/
  popup/                    React toggle UI (grouped toggles, IG/FB tabs, master pause)
  instagram.content.ts      document_start; stamps html[data-df-*]; SPA route watcher
  facebook.content.ts       same for facebook.com
  background.ts             install-time default seeding only
src/
  features/instagram.ts     FeatureDef[] — THE selector map (single source of truth)
  features/facebook.ts
  css/                      per-platform stylesheets GENERATED from the maps at build time
  lib/storage.ts            typed settings schema over browser.storage.sync
  lib/router.ts             URL → data-df-path classification (pure function)
```

### Hiding pipeline

1. Settings persist in `browser.storage.sync` as a flat record
   `{ "ig.feed": true, … }` — synced across the user's browsers.
2. Content scripts run at `document_start`, read settings, and stamp attributes on
   the root element (`<html data-df-ig-feed …>`). They subscribe to
   `storage.onChanged`, so popup toggles apply instantly to open tabs, no reload.
3. Per-platform CSS (injected at `document_start`, generated from the feature maps)
   gates every rule on those attributes:
   `html[data-df-ig-feed] main [role="feed"] { display: none !important; }`
   CSS present before first paint ⇒ no flash of hidden content.
4. Both sites are SPAs: content scripts watch URL changes and stamp
   `data-df-path="home|reels|explore|profile|…"` so rules can scope per page.
5. MutationObserver JS fallback ONLY where CSS cannot express a rule (e.g.
   suggested posts interleaved in the FB feed). Kept minimal.

### Selector rules

- Anchor only on stable signals: `aria-label`, `role`, `href` patterns
  (`a[href^="/reels/"]`), URL-scoped `data-df-path`. **Never** Meta's obfuscated
  class names (`x1lliihq` etc.).
- Hide, never remove: `display:none` keeps React's virtual DOM consistent;
  removing nodes crashes Meta's scripts (white-screen error boundaries).
- Each `FeatureDef` carries a `verify` hint (page + expected element) used as the
  manual pre-release checklist.

### Failure mode

A selector Meta breaks fails silently: that one feature stops hiding, nothing else
breaks, no console errors, no layout damage. Fix = one selector string + patch
release.

## Popup UI

React. Two platform tabs (Instagram / Facebook), each: master pause switch on top,
then the four groups as labelled sections of toggle switches. Rendered directly
from the feature maps — adding a feature is one map entry, never a UI edit.
Reads/writes `storage.sync` directly; no background messaging.

## Permissions & privacy

`storage` + host permissions on `*://*.instagram.com/*` and `*://*.facebook.com/*`
only. No analytics, no remote code, no network requests. This is a store-listing
selling point and keeps review fast.

## Testing

1. **Vitest (unit):** settings schema, attribute-stamping logic, URL→path router —
   pure functions.
2. **Playwright (fixture E2E):** sanitized snapshots of real IG/FB DOM committed as
   fixture HTML; every selector must match ≥1 element in its fixture. Catches our
   regressions, not Meta's live changes.
3. **Manual pre-release checklist:** walk each feature's `verify` hint against the
   live sites (CI against logged-in Meta properties is infeasible: bot detection).

## CI / Releases

- Public GitHub repo (`gr8monk3ys/feedless`) — public repos have unlimited free
  Actions minutes.
- PR CI: lint, typecheck, Vitest, Playwright fixtures.
- Tag push: `wxt build` + `wxt zip` for chrome/firefox/safari, zips attached to a
  GitHub Release.
- Store submission manual for v1 (Chrome Web Store + AMO dashboards).
- Safari: same codebase via `xcrun safari-web-extension-converter`, but App Store
  distribution requires an Apple Developer account ($99/yr) — separate, deferrable
  milestone; never blocks Chrome/Firefox.

## Milestones

1. **M1 — Skeleton:** WXT scaffold, storage schema, popup rendering from feature
   maps, CI green.
2. **M2 — Instagram:** all 9 IG features working live, fixtures committed.
3. **M3 — Facebook:** all 10 FB features working live, fixtures committed.
4. **M4 — Ship:** store assets (icons, screenshots, listing copy), privacy policy
   page, Chrome + Firefox submission.
5. **M5 — Safari (deferrable):** Xcode wrapper, App Store submission.
