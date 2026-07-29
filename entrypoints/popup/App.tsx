import { useEffect, useState } from 'react';
import {
  FEATURES,
  GROUP_LABELS,
  GROUP_ORDER,
  MASTER,
  type Platform,
} from '../../src/features/index';
import {
  getSettings, isEnabled, isPlatformActive, setFeature,
  setIntention, setSnooze, watchSettings, type Settings,
} from '../../src/lib/storage';
import { getFlagged } from '../../src/lib/diagnosis';

const PLATFORM_LABELS: Record<Platform, string> = {
  ig: 'Instagram',
  fb: 'Facebook',
};

const REPO = 'https://github.com/gr8monk3ys/feedless';

function formatRemaining(ms: number): string {
  const m = Math.ceil(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ${m % 60}m` : `${Math.round(h / 24)}d`;
}

/** wxt's fake-browser test double doesn't implement getManifest(); fall back gracefully. */
function extensionVersion(): string {
  try {
    return browser.runtime.getManifest().version;
  } catch {
    return 'unknown';
  }
}

export default function App() {
  const [platform, setPlatform] = useState<Platform>('ig');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [flagged, setFlagged] = useState<string[]>([]);
  const [draftIntention, setDraftIntention] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
    return watchSettings(setSettings);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    getFlagged().then(setFlagged);
  }, []);

  if (!settings) return null;

  const features = FEATURES[platform];
  const masterId = MASTER[platform];
  const masterOn = isEnabled(settings, masterId);
  const platformActive = isPlatformActive(settings, platform, now);
  const snoozedUntil = settings.snooze?.[platform] ?? 0;

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

      {masterOn && (
        <div className="snooze">
          {snoozedUntil > now ? (
            <>
              <span>Paused — resumes in {formatRemaining(snoozedUntil - now)}</span>
              <button onClick={() => setSnooze(platform, null)}>Resume now</button>
            </>
          ) : (
            <>
              <span>⏸ Pause on {PLATFORM_LABELS[platform]}:</span>
              {([['5m', 5 * 60_000], ['30m', 30 * 60_000], ['1 day', 24 * 60 * 60_000]] as const).map(
                ([label, ms]) => (
                  <button key={label} onClick={() => setSnooze(platform, Date.now() + ms)}>
                    {label}
                  </button>
                ),
              )}
            </>
          )}
        </div>
      )}

      <div className={platformActive ? '' : 'paused'}>
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
                  {flagged.includes(f.id) && (
                    <span title="This selector may be broken — see the banner below" className="warn">⚠</span>
                  )}
                </label>
              ))}
            </section>
          );
        })}
      </div>

      <section>
        <h2>Intention</h2>
        <input
          className="intention"
          placeholder="Why did you open this app?"
          value={draftIntention ?? settings.intention ?? ''}
          onChange={(e) => setDraftIntention(e.target.value)}
          onBlur={() => {
            if (draftIntention != null) void setIntention(draftIntention);
            setDraftIntention(null);
          }}
        />
      </section>

      {flagged.length > 0 && (
        <a
          className="banner"
          target="_blank"
          rel="noreferrer"
          href={`${REPO}/issues/new?template=broken-selector.yml&title=${encodeURIComponent(
            `Selector breakage: ${flagged.join(', ')} (v${extensionVersion()})`,
          )}`}
        >
          ⚠ Something may be broken ({flagged.join(', ')}) — report it
        </a>
      )}
    </main>
  );
}
