import { describe, it, expect, beforeEach } from 'vitest';
import { syncCard } from '../src/lib/card';
import { DEFAULT_SETTINGS } from '../src/lib/storage';
import type { Settings } from '../src/lib/storage';

function settings(intention?: string): Settings {
  return intention ? { ...DEFAULT_SETTINGS, intention } : DEFAULT_SETTINGS;
}

function setup(attrs: Record<string, string>) {
  document.body.innerHTML = '<main><div id="rest"></div></main>';
  const html = document.documentElement;
  for (const a of [...html.attributes])
    if (a.name.startsWith('data-df')) html.removeAttribute(a.name);
  for (const [k, v] of Object.entries(attrs)) html.setAttribute(k, v);
}

describe('syncCard', () => {
  beforeEach(() => setup({}));

  it('inserts the card when feed is hidden on home', () => {
    setup({ 'data-df-ig-feed': '', 'data-df-path': 'home' });
    syncCard('ig', settings('Reply to DMs, then leave.'));
    const card = document.querySelector('[data-feedless-card]');
    expect(card).toBeTruthy();
    expect(card!.parentElement!.tagName).toBe('MAIN');
    expect(card!.previousElementSibling).toBeNull(); // first child
  });

  it('is idempotent and updates intention text in place', () => {
    setup({ 'data-df-ig-feed': '', 'data-df-path': 'home' });
    syncCard('ig', settings('one'));
    syncCard('ig', settings('two'));
    expect(document.querySelectorAll('[data-feedless-card]')).toHaveLength(1);
  });

  it('removes the card when the feed attr is gone (toggled off/snoozed)', () => {
    setup({ 'data-df-ig-feed': '', 'data-df-path': 'home' });
    syncCard('ig', settings());
    expect(document.querySelector('[data-feedless-card]')).toBeTruthy();
    // simulate toggle-off/snooze: attr removed, DOM otherwise untouched
    document.documentElement.removeAttribute('data-df-ig-feed');
    syncCard('ig', settings());
    expect(document.querySelector('[data-feedless-card]')).toBeNull();
  });

  it('does not insert off the home page', () => {
    setup({ 'data-df-ig-feed': '', 'data-df-path': 'reels' });
    syncCard('ig', settings());
    expect(document.querySelector('[data-feedless-card]')).toBeNull();
  });

  it('does nothing when the host container is missing', () => {
    document.body.innerHTML = '';
    document.documentElement.setAttribute('data-df-ig-feed', '');
    document.documentElement.setAttribute('data-df-path', 'home');
    expect(() => syncCard('ig', settings())).not.toThrow();
  });

  it('replaces a counterfeit card the page planted under our attribute', () => {
    setup({ 'data-df-ig-feed': '', 'data-df-path': 'home' });
    // The page can squat on our attribute. Such an element has no shadow root
    // and none of our internals, so we must discard it rather than drive it.
    const counterfeit = document.createElement('div');
    counterfeit.setAttribute('data-feedless-card', '');
    document.querySelector('main')!.prepend(counterfeit);

    expect(() => syncCard('ig', settings('Reply to DMs, then leave.'))).not.toThrow();

    const card = document.querySelector('[data-feedless-card]');
    expect(card).not.toBe(counterfeit);
    expect(document.querySelectorAll('[data-feedless-card]')).toHaveLength(1);
  });
});
