export type Platform = 'ig' | 'fb';
export type Group = 'core' | 'engagement' | 'notifications' | 'chrome';
export type PageKind = 'home' | 'reels' | 'explore' | 'stories' | 'watch' | 'other';

export interface CssRule {
  selector: string;
  /** Restrict this rule to specific pages via html[data-df-path]. Omit = all pages. */
  paths?: PageKind[];
}

/** Config for the MutationObserver that marks units CSS can't distinguish. */
export interface SuggestedConfig {
  containerSelector: string;
  unitSelector: string;
  textAnchors: string[];
}

export interface FeatureDef {
  id: string; // e.g. "ig.feed"
  label: string;
  group: Group;
  default: boolean;
  rules: CssRule[];
  js?: SuggestedConfig;
  /** Manual pre-release check: page to open + what must be hidden. */
  verify: string;
  /** 'low' selectors MUST be tuned during live verification (Task 12). */
  confidence: 'high' | 'medium' | 'low';
}

export const GROUP_ORDER: Group[] = ['core', 'engagement', 'notifications', 'chrome'];

export const GROUP_LABELS: Record<Group, string> = {
  core: 'Feeds & endless scroll',
  engagement: 'Engagement bait',
  notifications: 'Notification pressure',
  chrome: 'Sidebars & clutter',
};

export function attrForFeature(id: string): string {
  return (
    'data-df-' +
    id.replace('.', '-').replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
  );
}

export function attrForMarker(id: string): string {
  return attrForFeature(id) + '-unit';
}
