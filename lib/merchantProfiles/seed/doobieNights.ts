// lib/merchantProfiles/seed/doobieNights.ts
//
// SNAPSHOT copied from PapeXV2/services/coupons/catalog.ts on 2026-09-11.
// Used for mock mode and the one-time seed. After seeding, Firestore is the
// source of truth; do not hand-sync this file.
//
// Notes on the copy:
// - The `whatsNew` entries are FAKE demo data (catalog.ts: "FAKE for the
//   2026-09-11 demo: Doobie Nights publishes no 'new' feed"). The products
//   they point at are real menu items; the posts are invented.
// - Coupons are catalog.ts's SAMPLE_COUPONS for this store. catalog.ts builds
//   their `expiresAt` with calendarDeadline(y, m, d) = 23:59 device-local
//   time; here they are frozen as 23:59 in the store's own timezone
//   (America/Los_Angeles, PST in Nov to Jan).
// - `loyaltyProgram` is the merchant-side part of SAMPLE_LOYALTY; the sample
//   points balance (375) is per-user data and is dropped on purpose.
// - All image URLs are Doobie Nights' own art, hotlinked as sample data (see
//   catalog.ts). A real launch needs their permission or their own uploads.

import type { MerchantRecord } from "../types";

export const DOOBIE_NIGHTS: MerchantRecord = {
  id: "store-doobie-nights",
  name: "Doobie Nights",
  category: "Dispensary",
  brandColor: "#F12AF8",
  brandColorSecondary: "#3697AF",
  logoUrl:
    "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/1c/84/f3/1c84f311-63b2-4b04-8d4c-92fd84c82ae0/Generated-AppIcon-prod-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.png",
  blurb: "A psychedelic dispensary experience in Santa Rosa.",
  description:
    "Sonoma County's trippiest dispensary, serving the Doobie Fam since 2018. Walk into floor-to-ceiling light displays, projection art and sculpture, then let a budtender walk you through local flower, carts, edibles and more. Medical and recreational, 21+ with valid ID. Earn Doobie Dividends on every visit, and watch for brand demo days and community nights with food trucks and live music.",
  website: "https://doobienights.com",
  menuUrl: "https://doobienights.com/menu/",
  menuCategories: [
    "Cartridges",
    "Flower",
    "Doobies",
    "Edibles",
    "Beverages",
    "Concentrates",
    "Pills",
    "Topicals",
    "Tinctures",
    "Apparel & Accessories",
  ],
  address: "3011 Santa Rosa Ave Ste A, Santa Rosa, CA 95407",
  phone: "(707) 555-0142",
  hours: {
    timezone: "America/Los_Angeles",
    intervals: [
      { day: 0, opensAt: "10:00", closesAt: "20:00" },
      { day: 1, opensAt: "09:00", closesAt: "21:00" },
      { day: 2, opensAt: "09:00", closesAt: "21:00" },
      { day: 3, opensAt: "09:00", closesAt: "21:00" },
      { day: 4, opensAt: "09:00", closesAt: "21:00" },
      { day: 5, opensAt: "09:00", closesAt: "21:00" },
      { day: 6, opensAt: "09:00", closesAt: "21:00" },
    ],
  },
  // FAKE demo data (see header).
  whatsNew: [
    { id: "dn-new-1", kind: "new-product", title: "Just landed", menuItemId: "5880918", postedOn: "2026-09-09" },
    {
      id: "dn-news-1",
      kind: "announcement",
      title: "Order ahead, skip the line",
      body: "Place your order online and pick it up at the express counter.",
      postedOn: "2026-09-08",
    },
    { id: "dn-new-2", kind: "new-product", title: "New flavor", menuItemId: "5880724", postedOn: "2026-09-05" },
    {
      id: "dn-news-2",
      kind: "announcement",
      title: "Vendor day this Saturday",
      body: "Meet the Puff team in store, ask questions and try what’s new.",
      postedOn: "2026-09-03",
    },
    { id: "dn-new-3", kind: "new-product", title: "Back in stock", menuItemId: "5880659", postedOn: "2026-09-01" },
  ],
  menu: [
    {
      category: "Flower",
      items: [
        {
          id: "5880869",
          name: "Rapper Weed (1/8 oz)",
          description: "Fig Farms · Indoor · 33% THC",
          price: 42,
          imageUrl: "https://tymber-blaze-products.imgix.net/Fig-Farms-3-5g-fc61f0a4-feb4-4de3-8ba6-6ec9018ababf.PNG?auto=format&w=480",
        },
        {
          id: "5881762",
          name: "Sour Diesel (1/8 oz)",
          description: "Sol Spirit · Sungrown · 23% THC",
          price: 27,
          imageUrl: "https://tymber-blaze-products.imgix.net/Sour-D-3-5g-SS-SD-26-9b0cb404-bc5b-4de7-93c5-28354d6f7d6f.png?auto=format&w=480",
        },
        {
          id: "5881945",
          name: "Orange Cookies (1/8 oz)",
          description: "Wave Rider · Greenhouse · 29% THC",
          price: 16,
          imageUrl: "https://tymber-blaze-products.imgix.net/Jar_3-5_indica_premium--2--f69e0b08-61e5-46be-81d2-50b5622ad358.png?auto=format&w=480",
        },
      ],
    },
    {
      category: "Doobies",
      items: [
        {
          id: "5881131",
          name: "Violet Sky Pre-Roll (1g)",
          description: "Khalifa Kush · Indoor · 32% THC",
          price: 14,
          imageUrl: "https://images.weedmaps.com/products/000/536/706/avatar/1696877990-kk-ca-vs_pre-roll-2.png?auto=format&w=480",
        },
        {
          id: "5880918",
          name: "Pineapple Sorbet Lolli (1.2g)",
          description: "Gelato · Infused pre-roll · 36% THC",
          price: 12,
          imageUrl: "https://images.weedmaps.com/products/000/445/891/avatar/1718923210-1707506902-pineapplesorbet-pre-roll-shadows.png?auto=format&w=480",
        },
        {
          id: "5881467",
          name: "Grape God 5-Pack (2.5g)",
          description: "Quiet Kings · Sauce & diamond infused · 39% THC",
          price: 18,
          imageUrl: "https://tymber-blaze-products.imgix.net/S-D-Infused-5pk-2-5g-Indica-f75e5ab7-4094-47ef-b2bb-eb182ffb2bf3.png?auto=format&w=480",
        },
      ],
    },
    {
      category: "Cartridges",
      items: [
        {
          id: "5880724",
          name: "Cantaloupe Dream All-In-One (1g)",
          description: "Dime Industries · Rechargeable vape · 90% THC",
          price: 35,
          imageUrl: "https://tymber-blaze-products.imgix.net/Dime-Cantalope-Dream-AIO-0d434a06-7c7f-42bf-83dd-5987061a6844.PNG?auto=format&w=480",
        },
        {
          id: "5880628",
          name: "Berry Prizm All-In-One (1g)",
          description: "CLSICS · Live rosin vape · 78% THC",
          price: 40,
          imageUrl: "https://images.weedmaps.com/products/000/696/064/avatar/1740443955-clsicsweb-428_prism.jpg?auto=format&w=480",
        },
        {
          id: "5880714",
          name: "Berry White Cartridge (1g)",
          description: "Dime Industries · Vape cartridge · 90% THC",
          price: 30,
          imageUrl: "https://tymber-blaze-products.imgix.net/Dime-Berry-White-Tank-1g-ba5749b3-785a-46c2-b12c-77f759588177.PNG?auto=format&w=480",
        },
      ],
    },
    {
      category: "Edibles",
      items: [
        {
          id: "5880659",
          name: "Watermelon Lemonade Gummies (20pk)",
          description: "Camino · Bliss · 100mg total",
          price: 18,
          imageUrl: "https://tymber-blaze-products.imgix.net/Camino-Watermelon-Lemonade-d6083f57-ff79-40ef-864d-5f68dbaddaa6.PNG?auto=format&w=480",
        },
        {
          id: "5880642",
          name: "Midnight Cereal Crunch Gummies",
          description: "CLSICS · Live rosin + CBN for sleep · 100mg",
          price: 18,
          imageUrl: "https://images.weedmaps.com/photos/products/000/372/475/3060748_midnight_cereal_10pk.png?auto=format&w=480",
        },
        {
          id: "5880795",
          name: "Cherry Jellies (2pc)",
          description: "Drops · Live rosin infused · 100mg",
          price: 7,
          imageUrl: "https://tymber-blaze-products.imgix.net/Drops-Cherry-2pc-8b5612b0-884d-453d-b54a-6d21e3250599.PNG?auto=format&w=480",
        },
      ],
    },
    {
      category: "Beverages",
      items: [
        {
          id: "5881118",
          name: "Bubba Kush Root Beer",
          description: "Keef Cola · Classic soda · 10mg",
          price: 6,
          imageUrl: "https://images.weedmaps.com/photos/products/000/021/819/303197_Keef-Classics-Bubba-Kush-Root-Beer-Can-CA.png?auto=format&w=480",
        },
        {
          id: "5881201",
          name: "Hi-Fi Sessions Mango",
          description: "Lagunitas · Sparkling water · 10mg",
          price: 7,
          imageUrl: "https://tymber-blaze-products.imgix.net/Lagunitas-Mango-10mg-3f7313be-aca9-4cdd-8fe8-fd72db85a45b.PNG?auto=format&w=480",
        },
      ],
    },
  ],
  deals: [
    {
      id: "235455",
      title: "Goldrop BOGO",
      description: "Buy any Goldrop All-in-one vape and get another one for $1.",
      schedule: "Every day",
      terms: "Available only while supplies last.",
      appliesTo: "Goldrop all-in-one vapes",
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/2b5630d5-5f2b-4689-a7ad-9087cd1d6d3d.png?s=6d809980f5c89de2b9248128d4e405ac",
    },
    {
      id: "224094",
      title: "Dabwoods Daily Deal",
      description:
        "Every Day through September 2026, get Out the Door pricing (no added tax) on all Dabwoods products at Doobie Nights.",
      schedule: "Every day through Sep 29, 2026",
      terms: "Available while supplies last for a limited time.",
      appliesTo: "All Dabwoods products",
      startsOn: "2026-07-01",
      endsOn: "2026-09-29",
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/f9decbbb-101c-41b6-abd8-987b7599ed6f.png?s=a14a0c6ce9c41a74c68bda725aa98aa5",
    },
    {
      id: "239885",
      title: "Puff Buy 3, Get 1 Daily Deal",
      description: "Buy any 3 Puff products, get 1 for $1 now thru Halloween!",
      schedule: "Every day through Oct 31, 2026",
      terms: "Available while supplies last, through October 31st, 2026.",
      appliesTo: "All Puff products",
      startsOn: "2026-08-01",
      endsOn: "2026-10-31",
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/48499c6f-c9dc-46d6-a4e5-c5bff420be9e.png?s=edd39f1d28eba0ebe361ce8ef7fa6ae5",
    },
    {
      id: "99592",
      title: "DIME DAY BOGO",
      description: "On the 10th of Every Month, Buy anything DIME, Get another for $1.",
      schedule: "10th of every month",
      terms: "Only applies on the 10th of each month.",
      appliesTo: "All Dime Industries products",
      daysOfMonth: [10],
      category: "Cartridges",
      menuItemIds: ["5880724", "5880714"],
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/d88604f2-4b0b-4d5f-96b6-e4badb0dfd47.png?s=163cba6d571d39cdca59e0197720d67f",
    },
    {
      id: "101501",
      title: "Smoakland 1oz + Super-J for $50!",
      description: "Get a Smoakland ounce of flower and an infused Super J for $50 with this bundle!",
      schedule: "Every day",
      terms: "While supplies last",
      appliesTo: "Smoakland 1 oz flower + infused Super J",
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/8b8fe174-52fd-4b1c-be3c-20c1463cfac6.png?s=8c72aac06f4d03fc34f1af74aeaf7f88",
    },
    {
      id: "189874",
      title: "STIIIZY Vape Pods Out the Door Pricing Sale",
      description:
        "Every Day, STIIIZY Vape Pods are ON SALE, with Out the Door Pricing. In other words, we cover the taxes!",
      schedule: "Every day",
      terms: "Discount is applied at the register, available daily only on STIIIZY Pods, while supplies last.",
      appliesTo: "STIIIZY vape pods",
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/126d2423-6868-4d95-9a44-d53bbe291fca.png?s=d003703482eba9f31ee777597a8b7499",
    },
    {
      id: "188910",
      title: "Thursday Doobie Deals",
      description:
        "Every Thursday, all Humo, Gold Drop, Kingroll, Plug Play, Rove and Wyld products, plus all Beverages have Out the Door Pricing - meaning you pay NO ADDED TAX!",
      schedule: "Every Thursday",
      terms: "Discount applied at register; available for listed brands only on Thursdays.",
      appliesTo: "Humo, Gold Drop, Kingroll, Plug Play, Rove, Wyld and all Beverages",
      weekdays: [4],
      category: "Beverages",
      menuItemIds: ["5881201"],
      percentOff: 24,
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/00582d5f-6508-4522-92e0-c4c1604cf8fc.png?s=46c29d1022c1943ab4d4fe98d62b3e77",
    },
    {
      id: "131994",
      title: "Get 4 Dime Carts for $99",
      description: "Buy any 4 Dime Industries cartridges for the bundle deal of $99 total!",
      schedule: "Every day",
      appliesTo: "Dime Industries cartridges",
      category: "Cartridges",
      menuItemIds: ["5880714"],
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/3227e4ca-3ef9-437c-a527-6c79f532b5a1.png?s=8302111c554c08e227cf0cef5a1e001f",
    },
    {
      id: "220952",
      title: "Rove Pod Refills Bundle",
      description: "Get 4 Rove Refills for $99 every day at Doobie Nights.",
      schedule: "Every day",
      terms: "One bundle per customer per day limit.",
      appliesTo: "Rove pod refills",
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/a08ea5c6-6019-48bd-bfd9-04002c567702.png?s=f59098388d0fb2f1fd127766ee1f4868",
    },
    {
      id: "98701",
      title: "Early Bird Happy Hour",
      description: "The first hour we are open every day, Early Birds get 15% off their orders.",
      schedule: "First hour open, daily: 9–10 AM Mon–Sat, 10–11 AM Sun",
      appliesTo: "Your whole order",
      imageUrl: "https://tymber-s3.imgix.net/doobie-nights-2227/deals/d91e9bd2-a14e-4ccc-a4ca-c9f7ee958098.png?s=0db50929fc3f5a23430a57dda2664942",
    },
  ],
  coupons: [
    {
      id: "coupon-doobie-bogo-cart",
      storeId: "store-doobie-nights",
      kind: "bogo",
      title: "Buy one cart, get the other for $1",
      subtitle: "Mix or match any 1g cartridge",
      code: "CART1",
      valueLabel: "BOGO",
      valueSuffix: "for $1",
      badge: "App exclusive",
      expiresAt: "2027-01-01T07:59:00.000Z", // 2026-12-31 23:59 PST
      terms: "21+ with valid ID. Second cart of equal or lesser value. One per customer per day.",
    },
    {
      id: "coupon-doobie-percent-100",
      storeId: "store-doobie-nights",
      kind: "percent",
      title: "30% off $100",
      subtitle: "Take 30% off any in-store order of $100 or more",
      barcode: "991013001002",
      inStoreOnly: true,
      minSpend: 100,
      expiresAt: "2026-11-27T07:59:00.000Z", // 2026-11-26 23:59 PST
      valueLabel: "30%",
      badge: "Doobie Fam",
      terms: "21+ with valid ID. Pre-tax subtotal. Cannot combine with other offers.",
    },
    {
      id: "coupon-doobie-bogo-exp",
      storeId: "store-doobie-nights",
      kind: "bogo",
      title: "Buy one, get one free",
      subtitle: "Any pre-roll of equal or lesser value",
      barcode: "991012000013",
      expiresAt: "2026-12-27T07:59:00.000Z", // 2026-12-26 23:59 PST
      valueLabel: "BOGO",
      valueSuffix: "FREE",
      badge: "Limited time",
      terms: "21+ with valid ID. Limit one free item per customer. While supplies last.",
    },
    {
      id: "coupon-doobie-percent-50",
      storeId: "store-doobie-nights",
      kind: "percent",
      title: "30% off $50+",
      subtitle: "Your whole order, online or in store",
      barcode: "991013000500",
      minSpend: 50,
      valueLabel: "30%",
      badge: "Members only",
      expiresAt: "2027-02-01T07:59:00.000Z", // 2027-01-31 23:59 PST
      terms: "21+ with valid ID. Pre-tax subtotal of $50 or more. One use per customer.",
    },
  ],
  loyaltyProgram: {
    programName: "Doobie Dividends",
    nextRewardAt: 625,
    nextRewardLabel: "$25 off",
  },
  version: 1,
  updatedAt: "2026-09-11T00:00:00.000Z",
  updatedBy: "seed",
};
