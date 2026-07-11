import { storage } from '#imports';
import type { CssRule, FeatureDef, PageKind } from '../features/types';
import { isEnabled, type Settings } from './storage';

type DiagnosisLog = Record<string, { days: string[] }>;

const diagnosticsItem = storage.defineItem<DiagnosisLog>('local:diagnostics', {
  fallback: {},
});

export function applicableRules(f: FeatureDef, path: PageKind): CssRule[] {
  return f.rules.filter(
    (r) => !r.mayBeAbsent && (!r.paths || r.paths.includes(path)),
  );
}

export function findSuspects(
  features: FeatureDef[],
  s: Settings,
  path: PageKind,
  doc: ParentNode,
): { suspects: string[]; checked: string[] } {
  const suspects: string[] = [];
  const checked: string[] = [];
  for (const f of features) {
    if (!isEnabled(s, f.id)) continue;
    const rules = applicableRules(f, path);
    if (!rules.length) continue;
    checked.push(f.id);
    const anyMatch = rules.some((r) => {
      try {
        return doc.querySelector(r.selector) != null;
      } catch {
        return false; // an unparseable selector is definitely suspect
      }
    });
    if (!anyMatch) suspects.push(f.id);
  }
  return { suspects, checked };
}

export async function recordDiagnosis(
  result: { suspects: string[]; checked: string[] },
  todayIso: string,
): Promise<void> {
  const log = { ...(await diagnosticsItem.getValue()) };
  for (const id of result.checked) {
    if (result.suspects.includes(id)) {
      const days = log[id]?.days ?? [];
      if (!days.includes(todayIso)) days.push(todayIso);
      log[id] = { days: days.slice(-5) };
    } else {
      delete log[id];
    }
  }
  await diagnosticsItem.setValue(log);
}

export async function getFlagged(minDays = 3): Promise<string[]> {
  const log = await diagnosticsItem.getValue();
  return Object.keys(log).filter((id) => log[id].days.length >= minDays);
}
