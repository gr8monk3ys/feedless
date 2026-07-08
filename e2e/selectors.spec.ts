import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { IG_FEATURES } from '../src/features/instagram';
import { FB_FEATURES } from '../src/features/facebook';
import { generateCss, countRules } from '../src/lib/css';
import type { FeatureDef } from '../src/features/types';

const CASES: { name: string; fixture: string; features: FeatureDef[] }[] = [
  { name: 'instagram', fixture: 'e2e/fixtures/ig.html', features: IG_FEATURES },
  { name: 'facebook', fixture: 'e2e/fixtures/fb.html', features: FB_FEATURES },
];

for (const c of CASES) {
  test.describe(c.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pathToFileURL(resolve(c.fixture)).href);
    });

    for (const f of c.features.filter((f) => f.rules.length > 0)) {
      test(`${f.id} selectors match fixture`, async ({ page }) => {
        for (const r of f.rules) {
          expect(
            await page.locator(r.selector).count(),
            `${f.id}: ${r.selector}`,
          ).toBeGreaterThan(0);
        }
      });
    }

    test('generated CSS parses with zero dropped rules', async ({ page }) => {
      const css = generateCss(c.features);
      const parsed = await page.evaluate((cssText) => {
        const style = document.createElement('style');
        style.textContent = cssText;
        document.head.appendChild(style);
        return style.sheet ? style.sheet.cssRules.length : -1;
      }, css);
      expect(parsed).toBe(countRules(c.features));
    });
  });
}
