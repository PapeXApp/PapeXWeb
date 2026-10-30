// lib/merchantReceipts/mockConfig.ts
//
// MOCK MODE ONLY: the config the Receipts tab starts from with
// NEXT_PUBLIC_MERCHANT_MOCK=1. The same content as Papex_RDH
// cards/merchants/demo-sunset-leaf-sf.json, minus what the API never sends;
// merchantReceipts.test.ts fails if the two drift. The preview receipt below is
// laid out like the seeded Sunset Leaf receipts in papex-rdh-transactions.

import type { CardConfig } from "./types";

const FIRST_TIME = ["first", "none", "no_points"];
const RETURNING = ["returning", "unknown"];
const rule = (value: string[]) => ({ fact: "receipt.loyalty.segment", op: "in", value });
const SAVE = [{ type: "save" as const, label: "Save to PapeX" }];
const DISCLOSURE = "Demo receipt for a fictional store: not a real purchase, and the coupon is not redeemable.";

export const MOCK_CARD_CONFIG: CardConfig = {
  enabled: true,
  merchant: { displayName: "Sunset Leaf Co.", timezone: "America/Los_Angeles", ageRestricted: true, partner: false },
  compliance: { licenseLine: "Demo store: fictional dispensary, no cannabis licence." },
  layout: { order: "receipt-first" },
  offers: {
    "sl-welcome": {
      kicker: "New customers",
      valueLabel: "20%",
      valueSuffix: "off",
      qualifier: "Your next visit",
      title: "20% off your next visit to Sunset Leaf Co.",
      terms: "New customers only. One per customer. Valid for 21 days from this receipt. 21+ with valid ID. Demo coupon for a fictional store: not redeemable.",
      validity: { validForDays: 21, countdown: true, hideWhenExpired: true },
      redemption: { type: "code", code: { mode: "static", value: "WELCOME20" }, caption: "Show this code at checkout" },
    },
    "sl-member": {
      kicker: "Members",
      valueLabel: "$10",
      valueSuffix: "off",
      qualifier: "On $50+",
      title: "$10 off your next order of $50 or more at Sunset Leaf Co.",
      terms: "One per customer. Valid for 30 days from this receipt. 21+ with valid ID. Demo coupon for a fictional store: not redeemable.",
      validity: { validForDays: 30, countdown: true, hideWhenExpired: true },
      redemption: { type: "code", code: { mode: "static", value: "MEMBER10" }, caption: "Show this code at checkout" },
    },
  },
  cards: [
    { id: "sl-welcome-web", surfaces: ["preview", "web", "clip"], priority: 10, when: rule(FIRST_TIME), type: "offer", offer: "sl-welcome", heading: "New to Sunset Leaf?" },
    { id: "sl-welcome-app", surfaces: ["preview", "app"], priority: 10, when: rule(FIRST_TIME), type: "offer", offer: "sl-welcome", heading: "New to Sunset Leaf?", actions: SAVE },
    { id: "sl-member-web", surfaces: ["preview", "web", "clip"], priority: 20, when: rule(RETURNING), type: "offer", offer: "sl-member", heading: "Thanks for coming back" },
    { id: "sl-member-app", surfaces: ["preview", "app"], priority: 20, when: rule(RETURNING), type: "offer", offer: "sl-member", heading: "Thanks for coming back", actions: SAVE },
    { id: "sl-disclosure-web", surfaces: ["preview", "web", "clip"], priority: 90, type: "disclosure", text: DISCLOSURE },
    { id: "sl-disclosure-app", surfaces: ["preview", "app"], priority: 90, type: "disclosure", text: DISCLOSURE },
  ],
};

/** Left and right columns of the preview receipt's lines. */
export const MOCK_PREVIEW_RECEIPT: { center: string[]; body: string[] } = {
  center: ["SUNSET LEAF CO.", "1847 Irving St", "San Francisco, CA"],
  body: [
    "Oct 30, 2026 12:14 PM",
    "",
    "Connected Cart .5G 30.00",
    "Pac Stone Cart 1G 20.00",
    "",
    "Subtotal         50.00",
    "Cannabis Excise Tax 9.50",
    "Sales Tax         5.13",
    "Total Tax        14.63",
    "TOTAL            64.63",
    "",
    "CASH",
    "",
    "Order #A1040",
  ],
};
