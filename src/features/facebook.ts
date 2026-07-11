import type { FeatureDef } from './types';

export const FB_FEATURES: FeatureDef[] = [
  {
    id: 'fb.feed',
    label: 'Hide news feed',
    group: 'core',
    default: true,
    // Facebook removed role="feed" (observed live 2026-07-09). The feed
    // container is now only identifiable by its screen-reader heading
    // (<h3>Feed posts</h3>), which CSS cannot match by text — the observer
    // marks it instead. The role="feed" rule stays as a fallback for older
    // layouts still in rollout.
    rules: [{ selector: 'div[role="feed"]', paths: ['home'], mayBeAbsent: true }],
    js: {
      containerSelector: 'div[role="main"]',
      unitSelector: 'div:has(> h3)',
      textAnchors: ['Feed posts'],
    },
    verify: 'Open facebook.com — feed posts gone, nav/rails per their own toggles.',
    confidence: 'medium',
  },
  {
    id: 'fb.reels',
    label: 'Hide Reels',
    group: 'core',
    default: true,
    rules: [
      { selector: 'a[href^="/reel"]' },
      { selector: 'div[role="main"]', paths: ['reels'] },
    ],
    verify: 'Reels links gone everywhere; facebook.com/reel/<id> shows empty page.',
    confidence: 'medium',
  },
  {
    id: 'fb.stories',
    label: 'Hide Stories',
    group: 'core',
    default: true,
    rules: [
      { selector: 'div[aria-label="Stories"]' },
      { selector: 'div[role="main"]', paths: ['stories'] },
    ],
    verify: 'Open facebook.com — stories row above feed gone.',
    confidence: 'medium',
  },
  {
    id: 'fb.watch',
    label: 'Hide Watch / Video',
    group: 'core',
    default: true,
    rules: [
      { selector: 'a[href^="/watch"]', mayBeAbsent: true },
      { selector: 'div[role="main"]', paths: ['watch'], mayBeAbsent: true },
    ],
    js: {
      containerSelector: 'nav, aside',
      unitSelector: 'a[href^="/watch"]',
      textAnchors: ['Watch', 'Video'],
    },
    verify: 'Watch nav link gone; facebook.com/watch shows empty page.',
    confidence: 'medium',
  },
  {
    id: 'fb.suggested',
    label: 'Hide suggested posts & people',
    group: 'engagement',
    default: false,
    rules: [],
    js: {
      // Post units are grandchildren of the feed container (the div whose
      // direct child is the <h3>Feed posts</h3> screen-reader heading);
      // role="feed" fallback kept for older layouts.
      containerSelector: 'div[role="feed"], div[role="main"] div:has(> h3) > div:not([aria-hidden])',
      unitSelector: ':scope > div',
      textAnchors: ['Suggested for you', 'People you may know', 'People You May Know'],
    },
    verify: 'Scroll feed — "Suggested for you" and "People you may know" units gone.',
    confidence: 'low',
  },
  {
    id: 'fb.likeCounts',
    label: 'Hide reaction counts',
    group: 'engagement',
    default: false,
    // Covers both live label forms: "See who reacted to this" (emoji cluster
    // + count on feed posts) and "1 reaction; see who reacted to this"
    // (comment-level counts in dialogs).
    rules: [{ selector: '[aria-label*="reacted" i]' }],
    verify: 'Open a post — reaction emoji cluster and count gone.',
    confidence: 'medium',
  },
  {
    id: 'fb.comments',
    label: 'Hide comments',
    group: 'engagement',
    default: false,
    rules: [{ selector: 'div[aria-label*="Comment by" i]' }],
    verify: 'Open a post with comments — comment rows gone.',
    confidence: 'medium',
  },
  {
    id: 'fb.notifBadges',
    label: 'Hide notification badges',
    group: 'notifications',
    default: false,
    // The count badge is a small button labelled "Notifications, N unread"
    // WITHOUT an svg inside — the icon button carries the same label but
    // contains the bell svg, so :not(:has(svg)) selects only the badge.
    rules: [{ selector: 'div[role="button"][aria-label*="unread" i]:not(:has(svg))', mayBeAbsent: true }],
    js: {
      containerSelector: 'nav, header',
      unitSelector: '[aria-label*="unread" i]:not(:has(svg))',
      textAnchors: ['unread', 'notification'],
    },
    verify: 'Have an unread notification — red count badge gone, bell icon stays.',
    confidence: 'medium',
  },
  {
    id: 'fb.rightRail',
    label: 'Hide right rail (sponsored, contacts)',
    group: 'chrome',
    default: false,
    rules: [{ selector: 'div[role="complementary"]', paths: ['home'] }],
    verify: 'Open facebook.com wide — sponsored/contacts column gone.',
    confidence: 'high',
  },
  {
    id: 'fb.leftNav',
    label: 'Hide left-nav shortcuts',
    group: 'chrome',
    default: false,
    rules: [{ selector: 'div[role="navigation"][aria-label*="Shortcuts" i]' }],
    verify: 'Open facebook.com — left shortcuts column gone.',
    confidence: 'medium',
  },
];
