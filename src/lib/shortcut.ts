import type { Platform } from '../features/types';

export function platformForUrl(url: string | undefined): Platform | null {
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'ig';
  if (host === 'facebook.com' || host.endsWith('.facebook.com')) return 'fb';
  return null;
}
