import { storage } from '#imports';
import { DEFAULT_FEATURE_STATE } from '../features/index';
import type { Platform } from '../features/types';

export interface Settings {
  v: 1;
  features: Record<string, boolean>;
  /** One-line user intention shown on the card. Absent = none set. */
  intention?: string;
  /** Per-platform pause-until epoch ms. Absent/past = not snoozed. */
  snooze?: Partial<Record<Platform, number>>;
}

export const DEFAULT_SETTINGS: Settings = {
  v: 1,
  features: { ...DEFAULT_FEATURE_STATE },
};

const settingsItem = storage.defineItem<Settings>('sync:settings', {
  fallback: DEFAULT_SETTINGS,
});

export function getSettings(): Promise<Settings> {
  return settingsItem.getValue();
}

export async function setFeature(id: string, value: boolean): Promise<void> {
  const current = await getSettings();
  await settingsItem.setValue({
    ...current,
    features: { ...current.features, [id]: value },
  });
}

export function watchSettings(cb: (s: Settings) => void): () => void {
  return settingsItem.watch((next) => {
    if (next) cb(next);
  });
}

export function isEnabled(s: Settings, id: string): boolean {
  return s.features[id] ?? DEFAULT_SETTINGS.features[id] ?? false;
}

/** Used by background to materialize defaults on install. */
export async function seedDefaults(): Promise<void> {
  await settingsItem.setValue(await settingsItem.getValue());
}

export async function setIntention(text: string): Promise<void> {
  const current = await getSettings();
  const trimmed = text.trim();
  const next: Settings = { ...current };
  if (trimmed) next.intention = trimmed;
  else delete next.intention;
  await settingsItem.setValue(next);
}

export async function setSnooze(
  platform: Platform,
  until: number | null,
): Promise<void> {
  const current = await getSettings();
  const snooze = { ...current.snooze };
  if (until != null) snooze[platform] = until;
  else delete snooze[platform];
  const next: Settings = { ...current };
  if (Object.keys(snooze).length) next.snooze = snooze;
  else delete next.snooze;
  await settingsItem.setValue(next);
}

export function isPlatformActive(
  s: Settings,
  platform: Platform,
  now: number,
): boolean {
  return isEnabled(s, `${platform}._enabled`) && (s.snooze?.[platform] ?? 0) <= now;
}
