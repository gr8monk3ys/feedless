import type { Platform } from '../features/types';
import { attrForFeature } from '../features/types';
import type { Settings } from './storage';

const HOSTS: Record<Platform, string> = { ig: 'main', fb: 'div[role="main"]' };

const CARD_CSS = `
  .card {
    margin: 24px auto; padding: 40px 32px; max-width: 420px;
    text-align: center; border-radius: 16px;
    font-family: system-ui, sans-serif;
    background: rgba(127, 127, 127, 0.08); color: #444;
  }
  .leaf { font-size: 28px; }
  .title { margin-top: 8px; font-size: 15px; font-weight: 600; }
  .intention { margin-top: 12px; font-size: 17px; font-style: italic; }
  @media (prefers-color-scheme: dark) { .card { color: #ccc; } }
`;

export function syncCard(platform: Platform, s: Settings): void {
  const html = document.documentElement;
  const host = document.querySelector(HOSTS[platform]);
  const shouldShow =
    html.hasAttribute(attrForFeature(`${platform}.feed`)) &&
    html.getAttribute('data-df-path') === 'home' &&
    host != null;

  let card = document.querySelector<HTMLElement & { _set?: (t: string) => void }>(
    '[data-feedless-card]',
  );

  if (!shouldShow) {
    card?.remove();
    return;
  }

  // An element wearing our attribute but missing our internals was planted by
  // the page (or left by an older version). Discard it and build a real one.
  if (card && typeof card._set !== 'function') {
    card.remove();
    card = null;
  }

  if (!card) {
    card = document.createElement('div');
    card.setAttribute('data-feedless-card', '');
    const shadow = card.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = CARD_CSS;
    const box = document.createElement('div');
    box.className = 'card';
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.textContent = '🌿';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'Feed hidden';
    const intention = document.createElement('div');
    intention.className = 'intention';
    box.append(leaf, title, intention);
    shadow.append(style, box);
    // user text goes through textContent only — never markup
    card._set = (t: string) => {
      intention.textContent = t ? `"${t}"` : '';
      intention.style.display = t ? '' : 'none';
    };
  }
  card._set!(s.intention ?? '');
  if (card.parentElement !== host || host.firstElementChild !== card) {
    host.prepend(card);
  }
}
