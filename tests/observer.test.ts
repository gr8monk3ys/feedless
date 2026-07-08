import { describe, it, expect, beforeEach } from 'vitest';
import { markSuggestedUnits, startSuggestedObserver } from '../src/lib/observer';
import type { SuggestedConfig } from '../src/features/types';

const cfg: SuggestedConfig = {
  containerSelector: 'div[role="feed"]',
  unitSelector: ':scope > div',
  textAnchors: ['Suggested for you'],
};

function feedHtml(): string {
  return `
    <div role="feed">
      <div><span>Regular post from a friend</span></div>
      <div><span>Suggested for you</span><span>Someone random</span></div>
    </div>`;
}

describe('markSuggestedUnits', () => {
  beforeEach(() => (document.body.innerHTML = ''));

  it('marks only units containing an anchor phrase', () => {
    document.body.innerHTML = feedHtml();
    const marked = markSuggestedUnits(document, 'fb.suggested', cfg);
    expect(marked).toBe(1);
    const units = document.querySelectorAll('[data-df-fb-suggested-unit]');
    expect(units).toHaveLength(1);
    expect(units[0].textContent).toContain('Suggested for you');
  });

  it('is idempotent', () => {
    document.body.innerHTML = feedHtml();
    markSuggestedUnits(document, 'fb.suggested', cfg);
    expect(markSuggestedUnits(document, 'fb.suggested', cfg)).toBe(0);
  });

  it('returns 0 when container is absent', () => {
    document.body.innerHTML = '<main></main>';
    expect(markSuggestedUnits(document, 'fb.suggested', cfg)).toBe(0);
  });
});

describe('startSuggestedObserver', () => {
  it('marks units added after start', async () => {
    document.body.innerHTML = '<div role="feed"></div>';
    const stop = startSuggestedObserver('fb.suggested', cfg);
    const unit = document.createElement('div');
    unit.innerHTML = '<span>Suggested for you</span>';
    document.querySelector('[role="feed"]')!.appendChild(unit);
    await new Promise((r) => setTimeout(r, 300));
    expect(unit.hasAttribute('data-df-fb-suggested-unit')).toBe(true);
    stop();
  });
});
