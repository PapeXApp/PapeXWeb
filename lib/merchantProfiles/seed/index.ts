// lib/merchantProfiles/seed/index.ts
//
// SNAPSHOT copied from PapeXV2/services/coupons/catalog.ts on 2026-09-11.
// Used for mock mode and the one-time seed (scripts/seed-merchants.ts).
// After seeding, Firestore is the source of truth; do not hand-sync this file.

import type { MerchantAccount, MerchantRecord } from "../types";
import { DOOBIE_NIGHTS } from "./doobieNights";
import { STORE_TEMPLATE } from "./template";

export const SEED_MERCHANTS: MerchantRecord[] = [DOOBIE_NIGHTS, STORE_TEMPLATE];

/** Demo-only logins. scripts/seed-merchants.ts strips these before a live write. */
export const PLACEHOLDER_EMAILS: readonly string[] = ["demo@doobienights.com"];

export const SEED_ACCOUNTS: MerchantAccount[] = [
  // PLACEHOLDER login: replace with Doobie Nights' real dashboard email(s)
  // through the admin editor before handing them a login.
  { merchantId: "store-doobie-nights", dashboardEmails: ["demo@doobienights.com"] },
  { merchantId: "store-template", dashboardEmails: [] },
];
