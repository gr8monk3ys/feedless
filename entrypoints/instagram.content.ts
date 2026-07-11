import '../src/css/instagram.generated.css';
import { IG_FEATURES } from '../src/features/instagram';
import { startEngine } from '../src/lib/engine';
import { startSuggestedObserver } from '../src/lib/observer';
import { syncCard } from '../src/lib/card';
import { findSuspects, recordDiagnosis } from '../src/lib/diagnosis';
import { classifyPath } from '../src/lib/router';
import { getSettings, watchSettings } from '../src/lib/storage';

export default defineContentScript({
  matches: ['*://*.instagram.com/*'],
  runAt: 'document_start',
  cssInjectionMode: 'manifest',
  async main(ctx) {
    const engine = await startEngine('ig', IG_FEATURES);
    const sync = async () => syncCard('ig', await getSettings());
    ctx.addEventListener(window, 'wxt:locationchange', (ev) => {
      engine.restampPath(ev);
      // container renders after SPA nav settles
      setTimeout(sync, 300);
    });
    watchSettings(() => void sync());
    // the host <main> appears after document_start — watch until it exists
    const bodyReady = new MutationObserver(() => {
      if (document.querySelector('main')) {
        bodyReady.disconnect();
        void sync();
      }
    });
    bodyReady.observe(document.documentElement, { childList: true, subtree: true });
    ctx.onInvalidated(() => bodyReady.disconnect());

    for (const f of IG_FEATURES) {
      if (f.js) {
        const stop = startSuggestedObserver(f.id, f.js);
        ctx.onInvalidated(stop);
      }
    }

    // self-diagnosis: once, well after the page settles
    setTimeout(async () => {
      const s = await getSettings();
      const path = classifyPath('ig', location.pathname);
      const result = findSuspects(IG_FEATURES, s, path, document);
      await recordDiagnosis(result, new Date().toISOString().slice(0, 10));
    }, 8_000);
  },
});
