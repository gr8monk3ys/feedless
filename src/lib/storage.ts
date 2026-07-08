import { storage } from '#imports';
import { DEFAULT_FEATURE_STATE } from '../features/index';

export interface Settings {
  v: 1;
  features: Record<string, boolean>;
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
