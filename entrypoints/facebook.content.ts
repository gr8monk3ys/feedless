import '../src/css/facebook.generated.css';
import { FB_FEATURES } from '../src/features/facebook';
import { startEngine } from '../src/lib/engine';
import { startSuggestedObserver } from '../src/lib/observer';
import { syncCard } from '../src/lib/card';
import { findSuspects, recordDiagnosis } from '../src/lib/diagnosis';
import { classifyPath } from '../src/lib/router';
import { getSettings, watchSettings } from '../src/lib/storage';

export default defineContentScript({
  matches: ['*://*.facebook.com/*'],
  runAt: 'document_start',
  cssInjectionMode: 'manifest',
  async main(ctx) {
    const engine = await startEngine('fb', FB_FEATURES);
    const sync = async () => syncCard('fb', await getSettings());
    ctx.addEventListener(window, 'wxt:locationchange', (ev) => {
      engine.restampPath(ev);
      // container renders after SPA nav settles
      setTimeout(sync, 300);
    });
    watchSettings(() => void sync());
    // the host <div role="main"> appears after document_start — watch until it exists
    const bodyReady = new MutationObserver(() => {
      if (document.querySelector('div[role="main"]')) {
        bodyReady.disconnect();
        void sync();
      }
    });
    bodyReady.observe(document.documentElement, { childList: true, subtree: true });
    ctx.onInvalidated(() => bodyReady.disconnect());

    for (const f of FB_FEATURES) {
      if (f.js) {
        const stop = startSuggestedObserver(f.id, f.js);
        ctx.onInvalidated(stop);
      }
    }

    // self-diagnosis: once, well after the page settles
    setTimeout(async () => {
      const s = await getSettings();
      const path = classifyPath('fb', location.pathname);
      const result = findSuspects(FB_FEATURES, s, path, document);
      await recordDiagnosis(result, new Date().toISOString().slice(0, 10));
    }, 8_000);
  },
});
