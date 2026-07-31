// components/brand/links.ts
//
// Shared destinations for the redesigned chrome. Deliberately self-contained:
// components/framer/constants.ts holds the same App Store URL, but the framer
// system is the OLD landing page and is meant to stay unused by the redesign,
// so the redesign does not import from it.
//
// App Store id 6754945242 is a locked cross-repo value (see ../../CLAUDE.md,
// "Apple identity") — it is the same id the /invite fallback uses.

export const APP_STORE_URL = 'https://apps.apple.com/app/id6754945242'
export const SUPPORT_EMAIL = 'support@papex.app'
export const SALES_PHONE = '415-261-8675'
export const SALES_PHONE_HREF = 'tel:+14152618675'
