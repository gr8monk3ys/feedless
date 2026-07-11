import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  DEFAULT_SETTINGS,
  getSettings,
  setFeature,
  watchSettings,
  isEnabled,
  setIntention,
  setSnooze,
  isPlatformActive,
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

describe('intention & snooze (v0.2)', () => {
  beforeEach(() => fakeBrowser.reset());

  it('a v0.1 settings blob (no new fields) still parses and behaves', async () => {
    await fakeBrowser.storage.sync.set({
      settings: { v: 1, features: { 'ig.feed': false, 'ig._enabled': true } },
    });
    const s = await getSettings();
    expect(s.features['ig.feed']).toBe(false);
    expect(s.intention).toBeUndefined();
    expect(isPlatformActive(s, 'ig', 1_000)).toBe(true);
  });

  it('setIntention trims and stores; empty removes', async () => {
    await setIntention('  Reply to DMs, then leave.  ');
    expect((await getSettings()).intention).toBe('Reply to DMs, then leave.');
    await setIntention('   ');
    expect((await getSettings()).intention).toBeUndefined();
  });

  it('setSnooze stores per-platform and null clears', async () => {
    await setSnooze('ig', 5_000);
    let s = await getSettings();
    expect(s.snooze?.ig).toBe(5_000);
    expect(s.snooze?.fb).toBeUndefined();
    await setSnooze('ig', null);
    s = await getSettings();
    expect(s.snooze?.ig).toBeUndefined();
  });

  it('isPlatformActive: master off wins, snooze in future pauses, past ignores', () => {
    const base = { v: 1 as const, features: { 'ig._enabled': true } };
    expect(isPlatformActive(base, 'ig', 100)).toBe(true);
    expect(isPlatformActive({ ...base, snooze: { ig: 200 } }, 'ig', 100)).toBe(false);
    expect(isPlatformActive({ ...base, snooze: { ig: 200 } }, 'ig', 200)).toBe(true);
    expect(
      isPlatformActive({ v: 1, features: { 'ig._enabled': false } }, 'ig', 100),
    ).toBe(false);
  });

  it('setFeature preserves intention and snooze', async () => {
    await setIntention('stay focused');
    await setSnooze('fb', 9_999);
    await setFeature('ig.feed', false);
    const s = await getSettings();
    expect(s.intention).toBe('stay focused');
    expect(s.snooze?.fb).toBe(9_999);
  });
});
