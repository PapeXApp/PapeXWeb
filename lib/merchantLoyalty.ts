// lib/merchantLoyalty.ts
//
// Per-merchant loyalty settings for the /w receipt page: where "join the
// rewards program" sends a customer who is not a member, and whether that
// link is shown at all. One entry per merchant id. A merchant with no entry,
// or an entry without `enrollUrl` or with `enrollCtaEnabled: false`, shows no
// call to action.
//
// The page knows the merchant only by its printed name: `/parsed` does not
// serve a merchant id, the same rule the cards contract states ("never its
// id"). So each entry lists the names its receipts print.

export interface MerchantLoyaltyConfig {
  /** Exactly as printed in the receipt header (the /parsed `merchantName`). */
  merchantNames: readonly string[];
  /** Where the merchant's own loyalty sign-up lives. null: no CTA. */
  enrollUrl: string | null;
  /** The switch. false hides the CTA even when enrollUrl is set. */
  enrollCtaEnabled: boolean;
  /** The CTA text. */
  enrollCtaLabel: string;
  /** Recorded with every click so a later copy/URL change is countable apart. */
  ctaVersion: string;
}

export const MERCHANT_LOYALTY: Readonly<Record<string, MerchantLoyaltyConfig>> = {
  "union-street-cannabis-club": {
    merchantNames: ["Union Cannabis Club"],
    // unioncannabisclub.com's "#menu" section embeds the store's Dutchie menu
    // (dutchie.com/api/v2/embedded-menu/..., checked 2026-10-07). Dutchie's
    // "Register for Loyalty" lives in that menu's cart / My Account.
    enrollUrl: "https://unioncannabisclub.com/#menu",
    // Noah approved 2026-10-07.
    enrollCtaEnabled: true,
    enrollCtaLabel: "Not a rewards member yet? Join Union's rewards with your email →",
    ctaVersion: "w-enroll-v1",
  },
};

/** The merchant id whose config lists this printed name, or null. */
export function merchantIdForName(name: string | null | undefined): string | null {
  if (!name) return null;
  const want = name.trim().toLowerCase();
  for (const [id, cfg] of Object.entries(MERCHANT_LOYALTY)) {
    if (cfg.merchantNames.some((n) => n.toLowerCase() === want)) return id;
  }
  return null;
}

export interface EnrollCta {
  merchantId: string;
  href: string;
  label: string;
  ctaVersion: string;
}

/** The enroll CTA for this merchant, or null when it must not show. */
export function enrollCtaFor(merchantId: string | null): EnrollCta | null {
  const cfg = merchantId ? MERCHANT_LOYALTY[merchantId] : undefined;
  if (!cfg || !cfg.enrollCtaEnabled || !cfg.enrollUrl) return null;
  return { merchantId: merchantId!, href: cfg.enrollUrl, label: cfg.enrollCtaLabel, ctaVersion: cfg.ctaVersion };
}
