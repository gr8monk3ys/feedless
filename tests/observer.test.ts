import { describe, it, expect, beforeEach } from 'vitest';
import { markSuggestedUnits, startSuggestedObserver } from '../src/lib/observer';
import { FB_FEATURES } from '../src/features/facebook';
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

  it('marks the FB feed container via its screen-reader heading (fb.feed js config)', () => {
    // Mirrors the live 2026 layout: role="feed" is gone; the container is the
    // div whose direct child is <h3>Feed posts</h3>.
    document.body.innerHTML = `
      <div role="main">
        <div><h3>Create a post</h3><div>composer</div></div>
        <div><h3>Stories</h3><div>stories cards</div></div>
        <div>
          <h3>Feed posts</h3>
          <div aria-hidden="true"></div>
          <div><div>post one</div><div>post two</div></div>
        </div>
      </div>`;
    const fbFeed = FB_FEATURES.find((f) => f.id === 'fb.feed')!;
    const marked = markSuggestedUnits(document, 'fb.feed', fbFeed.js!);
    expect(marked).toBe(1);
    const unit = document.querySelector('[data-df-fb-feed-unit]')!;
    expect(unit.querySelector('h3')!.textContent).toBe('Feed posts');
    // composer and stories sections must NOT be marked
    expect(document.querySelectorAll('[data-df-fb-feed-unit]')).toHaveLength(1);
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
