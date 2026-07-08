import type { SuggestedConfig } from '../features/types';
import { attrForMarker } from '../features/types';

export function markSuggestedUnits(
  root: ParentNode,
  featureId: string,
  cfg: SuggestedConfig,
): number {
  const marker = attrForMarker(featureId);
  let marked = 0;
  for (const container of root.querySelectorAll(cfg.containerSelector)) {
    for (const unit of container.querySelectorAll(cfg.unitSelector)) {
      if (unit.hasAttribute(marker)) continue;
      const text = unit.textContent ?? '';
      if (cfg.textAnchors.some((a) => text.includes(a))) {
        unit.setAttribute(marker, '');
        marked++;
      }
    }
  }
  return marked;
}

export function startSuggestedObserver(
  featureId: string,
  cfg: SuggestedConfig,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const scan = () => markSuggestedUnits(document, featureId, cfg);
  const observer = new MutationObserver(() => {
    // Batch bursts of mutations into one scan.
    if (timer) return;
    timer = setTimeout(() => {
      timer = undefined;
      scan();
    }, 250);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
  return () => {
    observer.disconnect();
    if (timer) clearTimeout(timer);
  };
}
