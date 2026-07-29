import type { FeatureDef, Platform } from '../features/types';
import { attrForFeature } from '../features/types';
import { classifyPath } from './router';
import {
  DEFAULT_SETTINGS,
  getSettings,
  isEnabled,
  isPlatformActive,
  watchSettings,
  type Settings,
} from './storage';

const CACHE_KEY = 'feedless:settings';

export function computeAttrs(
  s: Settings,
  platform: Platform,
  features: FeatureDef[],
  now: number,
): string[] {
  if (!isPlatformActive(s, platform, now)) return [];
  return features.filter((f) => isEnabled(s, f.id)).map((f) => attrForFeature(f.id));
}

export function applyAttrs(
  root: HTMLElement,
  features: FeatureDef[],
  attrs: string[],
): void {
  for (const f of features) {
    const attr = attrForFeature(f.id);
    if (attrs.includes(attr)) root.setAttribute(attr, '');
    else root.removeAttribute(attr);
  }
}

export function readCache(): Settings | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const featuresOk =
      parsed?.features !== null &&
      typeof parsed?.features === 'object' &&
      !Array.isArray(parsed?.features);
    return parsed?.v === 1 && featuresOk ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCache(s: Settings): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s));
  } catch {
    // localStorage unavailable (e.g. blocked third-party context) — cache is
    // an optimization only; async storage still stamps correctly.
  }
}

export async function startEngine(
  platform: Platform,
  features: FeatureDef[],
): Promise<{ restampPath: (ev?: unknown) => void }> {
  const root = document.documentElement;
  let latest: Settings = DEFAULT_SETTINGS;
  let snoozeTimer: ReturnType<typeof setTimeout> | undefined;

  const stamp = (s: Settings) => {
    latest = s;
    applyAttrs(root, features, computeAttrs(s, platform, features, Date.now()));
    // If snoozed, restamp shortly after expiry so open tabs auto-restore.
    clearTimeout(snoozeTimer);
    const remaining = (s.snooze?.[platform] ?? 0) - Date.now();
    if (remaining > 0 && remaining < 2 ** 31 - 1_000) {
      snoozeTimer = setTimeout(() => stamp(latest), remaining + 250);
    }
  };
  // WXT's wxt:locationchange event fires before the URL change is applied,
  // so location.pathname still holds the OLD path inside the handler. The
  // event carries the destination as `newUrl` — prefer it when present.
  const restampPath = (ev?: unknown) => {
    let pathname = location.pathname;
    const newUrl = (ev as { newUrl?: string | URL } | undefined)?.newUrl;
    if (newUrl) {
      try {
        pathname = newUrl instanceof URL ? newUrl.pathname : new URL(newUrl).pathname;
      } catch {
        // unparseable newUrl — fall back to the current location
      }
    }
    root.setAttribute('data-df-path', classifyPath(platform, pathname));
  };

  // 1. Synchronous, pre-paint: last-known settings (or defaults).
  // The cache is page-writable (regular localStorage), so a hostile or
  // malformed value must never be able to throw here and block the
  // authoritative async stamp below — swallow and fall through to defaults.
  restampPath();
  try {
    stamp(readCache() ?? DEFAULT_SETTINGS);
  } catch {
    stamp(DEFAULT_SETTINGS);
  }

  // 2. Authoritative async settings, then keep following changes.
  const live = await getSettings();
  stamp(live);
  writeCache(live);
  watchSettings((s) => {
    stamp(s);
    writeCache(s);
  });

  return { restampPath };
}
