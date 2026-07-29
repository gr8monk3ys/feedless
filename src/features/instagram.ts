import type { FeatureDef } from './types';

export const IG_FEATURES: FeatureDef[] = [
  {
    id: 'ig.feed',
    label: 'Hide home feed',
    group: 'core',
    default: true,
    rules: [
      { selector: 'main [role="feed"]', paths: ['home'] },
      { selector: 'main article', paths: ['home'] },
    ],
    verify: 'Open instagram.com — feed posts gone, nav still visible.',
    confidence: 'high',
  },
  {
    id: 'ig.reels',
    label: 'Hide Reels',
    group: 'core',
    default: true,
    rules: [
      { selector: 'a[href^="/reels"]' },
      { selector: 'main', paths: ['reels'] },
    ],
    verify: 'Reels nav link gone; instagram.com/reels/ shows empty page.',
    confidence: 'medium',
  },
  {
    id: 'ig.explore',
    label: 'Hide Explore',
    group: 'core',
    default: true,
    rules: [
      { selector: 'a[href^="/explore"]' },
      { selector: 'main', paths: ['explore'] },
    ],
    verify: 'Explore nav link gone; instagram.com/explore/ shows empty page.',
    confidence: 'medium',
  },
  {
    id: 'ig.stories',
    label: 'Hide Stories tray',
    group: 'core',
    default: true,
    rules: [
      { selector: 'main div:has(> ul li canvas)', paths: ['home'] },
      { selector: 'main', paths: ['stories'] },
    ],
    verify: 'Open instagram.com — story avatars row above feed gone.',
    confidence: 'medium',
  },
  {
    id: 'ig.suggested',
    label: 'Hide suggested posts',
    group: 'engagement',
    default: false,
    rules: [],
    js: {
      containerSelector: 'main',
      unitSelector: 'article',
      textAnchors: ['Suggested for you', 'Suggested posts'],
    },
    verify: 'Scroll home feed — "Suggested for you" posts gone.',
    confidence: 'low',
  },
  {
    id: 'ig.likeCounts',
    label: 'Hide like counts',
    group: 'engagement',
    default: false,
    rules: [
      { selector: 'a[href*="/liked_by/"]' },
      // Post pages render like/comment counts as bare numeric buttons in the
      // action row (the section that also holds the Share icon).
      { selector: 'section:has(svg[aria-label="Share"]) span[role="button"]' },
    ],
    verify: 'Open a post page — numeric counts in the action row gone.',
    confidence: 'medium',
  },
  {
    id: 'ig.comments',
    label: 'Hide comments',
    group: 'engagement',
    default: false,
    // A comment row is the div five levels above its `<time>` stamp, which
    // sits inside a profile link — the caption's timestamp is NOT inside a
    // link, so caption rows never match. Unscoped: works on /p/ pages and
    // in feed modals alike.
    rules: [
      { selector: 'div:has(> div > div > div > div > span > a[role="link"] time)' },
    ],
    verify: 'Open a post detail — comment rows gone, caption stays.',
    confidence: 'medium',
  },
  {
    id: 'ig.notifBadges',
    label: 'Hide notification badges',
    group: 'notifications',
    default: false,
    rules: [
      // Count badges (nav rail + floating Messages pill) carry aria-labels
      // like "Direct messaging - 1 new notification link".
      { selector: 'div[aria-label*="new notification" i]', mayBeAbsent: true },
      // The unlabelled red dot on the heart icon is the div immediately
      // following the div that wraps the Notifications svg.
      { selector: 'div:has(> svg[aria-label="Notifications"]) + div', mayBeAbsent: true },
    ],
    verify: 'Have an unread notification — red badge/dot on heart + DM icons gone.',
    confidence: 'medium',
  },
  {
    id: 'ig.sidebar',
    label: 'Hide suggested accounts sidebar',
    group: 'chrome',
    default: false,
    rules: [
      { selector: 'main div:has(> div a[href^="/explore/people"])', paths: ['home'] },
    ],
    verify: 'Wide window on instagram.com — right "Suggested for you" column gone.',
    confidence: 'medium',
  },
];
