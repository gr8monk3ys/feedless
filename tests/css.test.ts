import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { generateCss, countRules } from '../src/lib/css';
import { IG_FEATURES } from '../src/features/instagram';
import { FB_FEATURES } from '../src/features/facebook';
import type { FeatureDef } from '../src/features/types';

const sample: FeatureDef[] = [
  {
    id: 'ig.feed',
    label: 'x',
    group: 'core',
    default: true,
    rules: [
      { selector: 'main article', paths: ['home'] },
      { selector: 'a[href^="/x"]' },
    ],
    verify: 'placeholder verify',
    confidence: 'high',
  },
  {
    id: 'ig.suggested',
    label: 'x',
    group: 'engagement',
    default: false,
    rules: [],
    js: { containerSelector: 'main', unitSelector: 'article', textAnchors: ['S'] },
    verify: 'placeholder verify',
    confidence: 'low',
  },
];

describe('generateCss', () => {
  it('emits attribute-gated, path-scoped rules', () => {
    const css = generateCss(sample);
    expect(css).toContain(
      'html[data-df-ig-feed][data-df-path="home"] main article { display: none !important; }',
    );
    expect(css).toContain('html[data-df-ig-feed] a[href^="/x"] { display: none !important; }');
  });

  it('emits a marker rule for js features', () => {
    expect(generateCss(sample)).toContain(
      'html[data-df-ig-suggested] [data-df-ig-suggested-unit] { display: none !important; }',
    );
  });

  it('countRules matches emitted rule count', () => {
    const css = generateCss(sample);
    expect((css.match(/display: none/g) ?? []).length).toBe(countRules(sample));
    expect(countRules(sample)).toBe(3);
  });

  it('committed generated CSS is up to date (run: bun run generate)', () => {
    expect(readFileSync('src/css/instagram.generated.css', 'utf8')).toBe(
      generateCss(IG_FEATURES),
    );
    expect(readFileSync('src/css/facebook.generated.css', 'utf8')).toBe(
      generateCss(FB_FEATURES),
    );
  });
});
