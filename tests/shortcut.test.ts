import { describe, it, expect } from 'vitest';
import { platformForUrl } from '../src/lib/shortcut';

describe('platformForUrl', () => {
  it.each([
    ['https://www.instagram.com/reels/', 'ig'],
    ['https://instagram.com/', 'ig'],
    ['https://www.facebook.com/groups/x', 'fb'],
    ['https://web.facebook.com/', 'fb'],
    ['https://www.instagram.com.evil.example/', null],
    ['https://example.com/instagram.com', null],
    ['not a url', null],
    [undefined, null],
  ] as const)('%s -> %s', (url, expected) => {
    expect(platformForUrl(url)).toBe(expected);
  });
});
