import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  applicableRules,
  findSuspects,
  recordDiagnosis,
  getFlagged,
} from '../src/lib/diagnosis';
import { DEFAULT_SETTINGS } from '../src/lib/storage';
import type { FeatureDef } from '../src/features/types';

const featA: FeatureDef = {
  id: 'ig.a', label: 'A', group: 'core', default: true,
  rules: [
    { selector: '.exists', paths: ['home'] },
    { selector: '.badge', mayBeAbsent: true },
  ],
  verify: 'placeholder verify', confidence: 'high',
};
const featB: FeatureDef = {
  id: 'ig.b', label: 'B', group: 'core', default: true,
  rules: [{ selector: '.gone', paths: ['home'] }],
  verify: 'placeholder verify', confidence: 'high',
};
const featOff: FeatureDef = { ...featB, id: 'ig.off', default: false };

function settings(overrides: Record<string, boolean> = {}) {
  return {
    v: 1 as const,
    features: { ...DEFAULT_SETTINGS.features, 'ig.a': true, 'ig.b': true, 'ig.off': false, ...overrides },
  };
}

describe('applicableRules', () => {
  it('filters by path and mayBeAbsent', () => {
    expect(applicableRules(featA, 'home')).toHaveLength(1);
    expect(applicableRules(featA, 'reels')).toHaveLength(0);
  });
});

describe('findSuspects', () => {
  beforeEach(() => (document.body.innerHTML = '<div class="exists"></div>'));

  it('flags only enabled features whose applicable rules all miss', () => {
    const { suspects, checked } = findSuspects(
      [featA, featB, featOff], settings(), 'home', document,
    );
    expect(checked.sort()).toEqual(['ig.a', 'ig.b']); // ig.off disabled
    expect(suspects).toEqual(['ig.b']); // .exists matches, .gone does not
  });

  it('features with no applicable rules on this page are not checked', () => {
    const { checked } = findSuspects([featA], settings(), 'reels', document);
    expect(checked).toEqual([]);
  });
});

describe('recordDiagnosis + getFlagged', () => {
  beforeEach(() => fakeBrowser.reset());

  it('accumulates distinct days and flags at 3', async () => {
    for (const day of ['2026-07-10', '2026-07-10', '2026-07-11']) {
      await recordDiagnosis({ suspects: ['ig.b'], checked: ['ig.b'] }, day);
    }
    expect(await getFlagged()).toEqual([]); // only 2 distinct days
    await recordDiagnosis({ suspects: ['ig.b'], checked: ['ig.b'] }, '2026-07-12');
    expect(await getFlagged()).toEqual(['ig.b']);
  });

  it('a clean check resets the record', async () => {
    for (const day of ['2026-07-10', '2026-07-11', '2026-07-12']) {
      await recordDiagnosis({ suspects: ['ig.b'], checked: ['ig.b'] }, day);
    }
    expect(await getFlagged()).toEqual(['ig.b']);
    await recordDiagnosis({ suspects: [], checked: ['ig.b'] }, '2026-07-13');
    expect(await getFlagged()).toEqual([]);
  });

  it('keeps only the 5 most recent days', async () => {
    for (let d = 1; d <= 7; d++) {
      await recordDiagnosis({ suspects: ['ig.b'], checked: ['ig.b'] }, `2026-07-0${d}`);
    }
    const flagged = await getFlagged(5);
    expect(flagged).toEqual(['ig.b']);
  });
});
