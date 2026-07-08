import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { seedDefaults, getSettings } from '../src/lib/storage';

describe('seedDefaults', () => {
  beforeEach(() => fakeBrowser.reset());

  it('materializes defaults into sync storage', async () => {
    await seedDefaults();
    const raw = (await fakeBrowser.storage.sync.get('settings')) as Record<string, any>;
    expect(raw.settings.features['ig.feed']).toBe(true);
  });

  it('preserves existing user choices', async () => {
    const { setFeature } = await import('../src/lib/storage');
    await setFeature('ig.feed', false);
    await seedDefaults();
    expect((await getSettings()).features['ig.feed']).toBe(false);
  });
});
