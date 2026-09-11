// lib/merchantProfiles/seed/template.ts
//
// SNAPSHOT copied from PapeXV2/services/coupons/catalog.ts on 2026-09-11.
// Used for mock mode and the one-time seed. After seeding, Firestore is the
// source of truth; do not hand-sync this file.
//
// `store-template` is the merchant-facing blank: every section Doobie Nights
// has, with placeholder copy and no images. Its `whatsNew` entries are
// placeholder demo data. Coupon `expiresAt` values are catalog.ts's
// calendarDeadline(2027, 12, 31) frozen as 23:59 America/Los_Angeles (PST).
// `loyaltyProgram` is the merchant-side part of SAMPLE_LOYALTY (the sample
// points balance is per-user data and is dropped).

import type { MerchantRecord } from "../types";

const TEMPLATE_EXPIRY = "2028-01-01T07:59:00.000Z"; // 2027-12-31 23:59 PST

export const STORE_TEMPLATE: MerchantRecord = {
  id: "store-template",
  name: "Your Store",
  category: "Your category",
  brandColor: "#8FA3B3",
  brandColorSecondary: "#5E7384",
  blurb: "Tell customers what makes your store special. This short paragraph appears in the About section.",
  description:
    "Tell customers what makes your store special. This short paragraph appears in the About section. Use it to describe your history, your products, and why people should visit, in your own words.",
  website: "https://papex.app",
  menuUrl: "https://papex.app",
  menuCategories: ["Category one", "Category two"],
  address: "123 Main Street, Your City, CA 00000",
  phone: "(555) 010-0000",
  hours: {
    timezone: "America/Los_Angeles",
    intervals: [
      { day: 1, opensAt: "09:00", closesAt: "18:00" },
      { day: 2, opensAt: "09:00", closesAt: "18:00" },
      { day: 3, opensAt: "09:00", closesAt: "18:00" },
      { day: 4, opensAt: "09:00", closesAt: "18:00" },
      { day: 5, opensAt: "09:00", closesAt: "18:00" },
      { day: 6, opensAt: "10:00", closesAt: "17:00" },
    ],
  },
  whatsNew: [
    { id: "template-new-1", kind: "new-product", title: "New on the menu", menuItemId: "template-item-1", postedOn: "2026-09-09" },
    {
      id: "template-news-1",
      kind: "announcement",
      title: "Your announcement",
      body: "Share store news with your customers: events, new hours, anything.",
      postedOn: "2026-09-08",
    },
  ],
  menu: [
    {
      category: "Category one",
      items: [
        { id: "template-item-1", name: "Menu item", description: "Describe this item in one line.", price: 9.99 },
        { id: "template-item-2", name: "Menu item", description: "Describe this item in one line.", price: 14.99 },
      ],
    },
    {
      category: "Category two",
      items: [
        { id: "template-item-3", name: "Menu item", description: "Describe this item in one line.", price: 4.99 },
        { id: "template-item-4", name: "Menu item", description: "Describe this item in one line.", price: 19.99 },
      ],
    },
  ],
  deals: [
    {
      id: "template-deal-1",
      title: "Your deal: 15% off a menu category",
      description: "Describe the promotion your store runs, in your own words.",
      schedule: "Every day",
      terms: "Add your own fine print here.",
      appliesTo: "Category one",
      category: "Category one",
      percentOff: 15,
    },
    {
      id: "template-deal-2",
      title: "Your deal: 15% off a menu category",
      description: "Describe another promotion your store runs, in your own words.",
      schedule: "Every day",
      terms: "Add your own fine print here.",
      appliesTo: "Category two",
      category: "Category two",
      percentOff: 15,
    },
  ],
  coupons: [
    {
      id: "coupon-template-bogo",
      storeId: "store-template",
      kind: "bogo",
      title: "Your coupon: Buy one, get one",
      subtitle: "Describe the offer in one line",
      code: "TEMPLATE1",
      expiresAt: TEMPLATE_EXPIRY,
      badge: "Your badge",
      terms: "Your fine print: limits, exclusions and how to redeem.",
    },
    {
      id: "coupon-template-percent",
      storeId: "store-template",
      kind: "percent",
      title: "Your coupon: 20% off",
      subtitle: "Describe the offer in one line",
      expiresAt: TEMPLATE_EXPIRY,
      badge: "Your badge",
      terms: "Your fine print: limits, exclusions and how to redeem.",
    },
    {
      id: "coupon-template-dollar",
      storeId: "store-template",
      kind: "dollar",
      title: "Your coupon: $5 off",
      subtitle: "Describe the offer in one line",
      minSpend: 25,
      expiresAt: TEMPLATE_EXPIRY,
      badge: "Your badge",
      terms: "Your fine print: limits, exclusions and how to redeem.",
    },
    {
      id: "coupon-template-freebie",
      storeId: "store-template",
      kind: "freebie",
      title: "Your coupon: Free item with purchase",
      subtitle: "Describe the offer in one line",
      barcode: "000000000000",
      expiresAt: TEMPLATE_EXPIRY,
      badge: "Your badge",
      terms: "Your fine print: limits, exclusions and how to redeem.",
    },
  ],
  loyaltyProgram: {
    programName: "Your Rewards",
    nextRewardAt: 250,
    nextRewardLabel: "$10 off",
  },
  version: 1,
  updatedAt: "2026-09-11T00:00:00.000Z",
  updatedBy: "seed",
};
