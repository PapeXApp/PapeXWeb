// components/brand/links.ts
//
// Shared destinations for the redesigned chrome. Deliberately independent of
// components/framer/constants.ts: the framer system is the OLD landing page
// and is meant to stay unused by the redesign.
//
// Store listings come from lib/storeLinks.ts, the site's single source for
// both stores (the /r and /rdh pages read it too), so a listing change is one
// edit. App Store id 6754945242 is a locked cross-repo value (see
// ../../CLAUDE.md, "Apple identity"), the same id the /invite fallback uses.
//
// This module stays free of React so server components can import it. The
// device-matched hook lives next to the nav (useStoreUrl in ./site-nav).

import { APP_STORE_URL, PLAY_STORE_URL, type Platform } from '@/lib/storeLinks'

export { APP_STORE_URL, PLAY_STORE_URL }

/** The store to send a visitor to. App Store unless we know it's Android. */
export function storeUrlFor(platform: Platform): string {
  return platform === 'android' ? PLAY_STORE_URL : APP_STORE_URL
}

export const SUPPORT_EMAIL = 'support@papex.app'
export const SALES_PHONE = '415-261-8675'
export const SALES_PHONE_HREF = 'tel:+14152618675'

// Social slots. No confirmed profile URLs yet: Nico will fill these in. A chip
// only renders in the footer once its URL here is non-empty, so an empty slot
// never becomes a dead link.
export const SOCIAL_LINKS = {
  linkedin: '',
  x: '',
  instagram: '',
}
