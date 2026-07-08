import { describe, it, expect } from 'vitest';
import { classifyPath } from '../src/lib/router';

describe('classifyPath', () => {
  it.each([
    ['/', 'home'],
    ['/reels/', 'reels'],
    ['/reels/audio/123/', 'reels'],
    ['/explore/', 'explore'],
    ['/explore/tags/cats/', 'explore'],
    ['/stories/someuser/1/', 'stories'],
    ['/someuser/', 'other'],
    ['/direct/inbox/', 'other'],
  ] as const)('ig %s -> %s', (path, kind) => {
    expect(classifyPath('ig', path)).toBe(kind);
  });

  it.each([
    ['/', 'home'],
    ['/reel/123456', 'reels'],
    ['/stories/123/', 'stories'],
    ['/watch/', 'watch'],
    ['/watch', 'watch'],
    ['/groups/feed/', 'other'],
    ['/marketplace/', 'other'],
  ] as const)('fb %s -> %s', (path, kind) => {
    expect(classifyPath('fb', path)).toBe(kind);
  });
});
