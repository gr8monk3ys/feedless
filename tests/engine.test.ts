import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  computeAttrs,
  applyAttrs,
  readCache,
  writeCache,
  startEngine,
} from '../src/lib/engine';
import { DEFAULT_SETTINGS, setFeature } from '../src/lib/storage';
import { IG_FEATURES } from '../src/features/instagram';
import type { Settings } from '../src/lib/storage';

function settingsWith(overrides: Record<string, boolean>): Settings {
  return { v: 1, features: { ...DEFAULT_SETTINGS.features, ...overrides } };
}

describe('computeAttrs', () => {
  it('returns attrs for enabled features only', () => {
    const attrs = computeAttrs(
      settingsWith({ 'ig.feed': true, 'ig.reels': false }),
      'ig',
      IG_FEATURES,
    );
    expect(attrs).toContain('data-df-ig-feed');
    expect(attrs).not.toContain('data-df-ig-reels');
  });

  it('returns [] when the master switch is off', () => {
    const attrs = computeAttrs(
      settingsWith({ 'ig._enabled': false, 'ig.feed': true }),
      'ig',
      IG_FEATURES,
    );
    expect(attrs).toEqual([]);
  });
});

describe('applyAttrs', () => {
  it('sets listed attrs and removes stale ones', () => {
    const root = document.documentElement;
    applyAttrs(root, IG_FEATURES, ['data-df-ig-feed']);
    expect(root.hasAttribute('data-df-ig-feed')).toBe(true);
    applyAttrs(root, IG_FEATURES, ['data-df-ig-reels']);
    expect(root.hasAttribute('data-df-ig-feed')).toBe(false);
    expect(root.hasAttribute('data-df-ig-reels')).toBe(true);
  });
});

describe('cache', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips settings and survives garbage', () => {
    writeCache(DEFAULT_SETTINGS);
    expect(readCache()).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem('feedless:settings', '{not json');
    expect(readCache()).toBeNull();
    localStorage.setItem('feedless:settings', '{"v":1,"features":null}');
    expect(readCache()).toBeNull();
    localStorage.setItem('feedless:settings', '{"v":1,"features":[]}');
    expect(readCache()).toBeNull();
  });
});

describe('startEngine', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    localStorage.clear();
    for (const a of [...document.documentElement.attributes])
      if (a.name.startsWith('data-df')) document.documentElement.removeAttribute(a.name);
  });

  it('stamps defaults, updates cache, and reacts to settings changes', async () => {
    const { restampPath } = await startEngine('ig', IG_FEATURES);
    const root = document.documentElement;
    expect(root.hasAttribute('data-df-ig-feed')).toBe(true); // default ON
    expect(root.getAttribute('data-df-path')).toBeTruthy();
    expect(readCache()).not.toBeNull();

    await setFeature('ig.feed', false);
    expect(root.hasAttribute('data-df-ig-feed')).toBe(false);
    expect(readCache()!.features['ig.feed']).toBe(false);
    restampPath(); // must not throw
  });

  it('ignores a poisoned cache and still stamps defaults', async () => {
    localStorage.setItem('feedless:settings', '{"v":1,"features":null}');
    await expect(startEngine('ig', IG_FEATURES)).resolves.toBeDefined();
    const root = document.documentElement;
    expect(root.hasAttribute('data-df-ig-feed')).toBe(true); // default ON
  });

  it('restampPath prefers the wxt:locationchange newUrl over the stale location', async () => {
    // WXT fires the event before the URL change lands, so the handler must
    // classify the event's newUrl, not location.pathname.
    const { restampPath } = await startEngine('ig', IG_FEATURES);
    const root = document.documentElement;

    restampPath({ newUrl: new URL('https://www.instagram.com/reels/') });
    expect(root.getAttribute('data-df-path')).toBe('reels');

    restampPath({ newUrl: 'https://www.instagram.com/p/abc123/' });
    expect(root.getAttribute('data-df-path')).toBe('post');

    restampPath({ newUrl: 'not a url' }); // falls back to location, no throw
    expect(root.getAttribute('data-df-path')).toBeTruthy();

    restampPath(); // no event at all still works
    expect(root.getAttribute('data-df-path')).toBeTruthy();
  });
});
