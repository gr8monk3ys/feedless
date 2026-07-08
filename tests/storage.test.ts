import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  DEFAULT_SETTINGS,
  getSettings,
  setFeature,
  watchSettings,
  isEnabled,
} from '../src/lib/storage';

describe('settings storage', () => {
  beforeEach(() => fakeBrowser.reset());

  it('returns defaults when storage is empty', async () => {
    const s = await getSettings();
    expect(s.v).toBe(1);
    expect(s.features['ig.feed']).toBe(true);
    expect(s.features['fb.comments']).toBe(false);
  });

  it('setFeature persists a single toggle', async () => {
    await setFeature('ig.feed', false);
    const s = await getSettings();
    expect(s.features['ig.feed']).toBe(false);
    expect(s.features['fb.feed']).toBe(true); // untouched
  });

  it('watchSettings fires on change and unwatch stops it', async () => {
    const seen: boolean[] = [];
    const unwatch = watchSettings((s) => seen.push(s.features['ig.reels']));
    await setFeature('ig.reels', false);
    expect(seen).toEqual([false]);
    unwatch();
    await setFeature('ig.reels', true);
    expect(seen).toEqual([false]);
  });

  it('isEnabled falls back to defaults for keys missing from stored settings', () => {
    const s = { v: 1 as const, features: {} };
    expect(isEnabled(s, 'ig.feed')).toBe(true);
    expect(isEnabled(s, 'ig.comments')).toBe(false);
    expect(isEnabled(s, 'nonsense.key')).toBe(false);
  });

  it('DEFAULT_SETTINGS is never mutated by setFeature', async () => {
    await setFeature('ig.feed', false);
    expect(DEFAULT_SETTINGS.features['ig.feed']).toBe(true);
  });
});
