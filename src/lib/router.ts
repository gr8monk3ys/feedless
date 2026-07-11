import type { PageKind, Platform } from '../features/types';

export function classifyPath(platform: Platform, pathname: string): PageKind {
  if (pathname === '/') return 'home';
  if (platform === 'ig') {
    if (pathname.startsWith('/reels')) return 'reels';
    if (pathname.startsWith('/explore')) return 'explore';
    if (pathname.startsWith('/stories')) return 'stories';
    if (pathname.startsWith('/p/')) return 'post';
    return 'other';
  }
  if (pathname.startsWith('/reel')) return 'reels';
  if (pathname.startsWith('/stories')) return 'stories';
  if (pathname.startsWith('/watch')) return 'watch';
  return 'other';
}
