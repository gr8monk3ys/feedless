import { useEffect, useState } from 'react';
import {
  FEATURES,
  GROUP_LABELS,
  GROUP_ORDER,
  MASTER,
  type Platform,
} from '../../src/features/index';
import {
  getSettings,
  isEnabled,
  setFeature,
  watchSettings,
  type Settings,
} from '../../src/lib/storage';

const PLATFORM_LABELS: Record<Platform, string> = {
  ig: 'Instagram',
  fb: 'Facebook',
};

export default function App() {
  const [platform, setPlatform] = useState<Platform>('ig');
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
    return watchSettings(setSettings);
  }, []);

  if (!settings) return null;

  const features = FEATURES[platform];
  const masterId = MASTER[platform];
  const masterOn = isEnabled(settings, masterId);

  return (
    <main>
      <div role="tablist" className="tabs">
        {(['ig', 'fb'] as Platform[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={platform === p}
            onClick={() => setPlatform(p)}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      <label className="master">
        <input
          type="checkbox"
          checked={masterOn}
          onChange={(e) => setFeature(masterId, e.target.checked)}
        />
        {`Enable on ${PLATFORM_LABELS[platform]}`}
      </label>

      <div className={masterOn ? '' : 'paused'}>
        {GROUP_ORDER.map((group) => {
          const inGroup = features.filter((f) => f.group === group);
          if (inGroup.length === 0) return null;
          return (
            <section key={group}>
              <h2>{GROUP_LABELS[group]}</h2>
              {inGroup.map((f) => (
                <label key={f.id} className="toggle">
                  <input
                    type="checkbox"
                    checked={isEnabled(settings, f.id)}
                    onChange={(e) => setFeature(f.id, e.target.checked)}
                  />
                  {f.label}
                </label>
              ))}
            </section>
          );
        })}
      </div>
    </main>
  );
}
