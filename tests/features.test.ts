import { describe, it, expect } from 'vitest';
import { attrForFeature, attrForMarker } from '../src/features/types';
import { IG_FEATURES } from '../src/features/instagram';
import { FB_FEATURES } from '../src/features/facebook';
import { DEFAULT_FEATURE_STATE, FEATURES, MASTER } from '../src/features/index';

describe('feature maps', () => {
  const all = [...IG_FEATURES, ...FB_FEATURES];

  it('has 9 IG and 10 FB features', () => {
    expect(IG_FEATURES).toHaveLength(9);
    expect(FB_FEATURES).toHaveLength(10);
  });

  it('ids are unique and platform-prefixed', () => {
    const ids = all.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of IG_FEATURES) expect(f.id).toMatch(/^ig\.[a-zA-Z]+$/);
    for (const f of FB_FEATURES) expect(f.id).toMatch(/^fb\.[a-zA-Z]+$/);
  });

  it('every feature has rules or a js matcher, and a verify hint', () => {
    for (const f of all) {
      expect(f.rules.length > 0 || f.js != null, f.id).toBe(true);
      expect(f.verify.length, f.id).toBeGreaterThan(10);
    }
  });

  it('addictive-core features default ON, everything else OFF', () => {
    for (const f of all) expect(f.default, f.id).toBe(f.group === 'core');
  });

  it('no selector uses obfuscated class names', () => {
    for (const f of all)
      for (const r of f.rules)
        expect(r.selector, f.id).not.toMatch(/\.x[0-9a-z]{4,}/);
  });

  it('attr helpers produce valid lowercase kebab attributes', () => {
    expect(attrForFeature('ig.likeCounts')).toBe('data-df-ig-like-counts');
    expect(attrForMarker('fb.suggested')).toBe('data-df-fb-suggested-unit');
  });

  it('defaults include master switches ON', () => {
    expect(DEFAULT_FEATURE_STATE[MASTER.ig]).toBe(true);
    expect(DEFAULT_FEATURE_STATE[MASTER.fb]).toBe(true);
    expect(DEFAULT_FEATURE_STATE['ig.feed']).toBe(true);
    expect(DEFAULT_FEATURE_STATE['fb.comments']).toBe(false);
    expect(FEATURES.ig).toBe(IG_FEATURES);
  });
});
