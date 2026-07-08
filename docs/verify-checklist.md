# Pre-release live verification

Run before EVERY release. Load the dev build (`bun run dev` opens a Chrome
profile with the extension), log into Instagram and Facebook, then walk each
feature's `verify` hint from `src/features/*.ts`:

For each feature:
1. Toggle it ON in the popup → surface disappears without reload.
2. Toggle OFF → surface reappears without reload.
3. Navigate away and back (SPA nav) → hiding still correct.

Also verify globally:
- [ ] No flash of hidden content on hard reload (Cmd+Shift+R).
- [ ] Master pause restores each site to stock appearance.
- [ ] No console errors from the extension on either site.
- [ ] DMs (instagram.com/direct, messenger via facebook.com) unaffected.
- [ ] Profile pages, search, and settings pages unaffected.

When a selector is wrong: fix it in src/features/*.ts, run
`bun run generate`, update the e2e fixture to the real structure,
re-run `bun run test && bun run e2e`, and re-verify live.
