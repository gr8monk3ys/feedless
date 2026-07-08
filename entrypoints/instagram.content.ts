import '../src/css/instagram.generated.css';
import { IG_FEATURES } from '../src/features/instagram';
import { startEngine } from '../src/lib/engine';
import { startSuggestedObserver } from '../src/lib/observer';

export default defineContentScript({
  matches: ['*://*.instagram.com/*'],
  runAt: 'document_start',
  cssInjectionMode: 'manifest',
  async main(ctx) {
    const engine = await startEngine('ig', IG_FEATURES);
    ctx.addEventListener(window, 'wxt:locationchange', engine.restampPath);
    for (const f of IG_FEATURES) {
      if (f.js) {
        const stop = startSuggestedObserver(f.id, f.js);
        ctx.onInvalidated(stop);
      }
    }
  },
});
