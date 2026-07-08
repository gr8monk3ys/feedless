import '../src/css/facebook.generated.css';
import { FB_FEATURES } from '../src/features/facebook';
import { startEngine } from '../src/lib/engine';
import { startSuggestedObserver } from '../src/lib/observer';

export default defineContentScript({
  matches: ['*://*.facebook.com/*'],
  runAt: 'document_start',
  cssInjectionMode: 'manifest',
  async main(ctx) {
    const engine = await startEngine('fb', FB_FEATURES);
    ctx.addEventListener(window, 'wxt:locationchange', engine.restampPath);
    for (const f of FB_FEATURES) {
      if (f.js) {
        const stop = startSuggestedObserver(f.id, f.js);
        ctx.onInvalidated(stop);
      }
    }
  },
});
