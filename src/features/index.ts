import type { FeatureDef, Platform } from './types';
import { IG_FEATURES } from './instagram';
import { FB_FEATURES } from './facebook';

export * from './types';
export { IG_FEATURES, FB_FEATURES };

export const FEATURES: Record<Platform, FeatureDef[]> = {
  ig: IG_FEATURES,
  fb: FB_FEATURES,
};

/** Per-platform master switches ("pause on this site"). */
export const MASTER: Record<Platform, string> = {
  ig: 'ig._enabled',
  fb: 'fb._enabled',
};

export const DEFAULT_FEATURE_STATE: Record<string, boolean> = {
  [MASTER.ig]: true,
  [MASTER.fb]: true,
  ...Object.fromEntries(
    [...IG_FEATURES, ...FB_FEATURES].map((f) => [f.id, f.default]),
  ),
};
