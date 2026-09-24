import type { FaqItem } from "../shared/Faq"

/**
 * /business section 06 — "What owners ask us." (spec 2026-09-24 §3.3 row 06,
 * facts per §2 and §6a, which overrides the rest of the spec).
 *
 * Rules this copy follows (Nico, §6a):
 *   - POS: "Works with most point of sale systems". Never name a POS brand.
 *   - Price: "It's free today. Take advantage while it lasts." + free device,
 *     free install. Never "forever", never "qualified", no future pricing.
 *   - Card data: "never stores, processes or transmits card data" + /pci.
 *     No certification claim ("PCI compliant" is not said anywhere).
 *   - Proof/where: "Live in the Bay Area." No store name, no date.
 *   - Store page in the app: hedged, "can have".
 *   - Paper: "Go paper-free: switch off the printer whenever you're ready."
 *   - Phone, if an answer ever needs one: 415-261-8610 (import it from
 *     components/brand/links.ts once S1 lands it there; don't hardcode).
 *   - Contracts: say nothing until Nico answers Q2 (hidden below).
 * `hidden: true` = not rendered and not in the FAQPage JSON-LD.
 *
 * Answer strings: blank line = new paragraph, `[label](/path)` or
 * `[label](#demo)` = link.
 */
export const businessFaqHeading = "What owners ask us."

export const businessFaq: FaqItem[] = [
  {
    q: "Does PapeX work with my POS?",
    a: "PapeX works with most point of sale systems. The PapeX device is added to your POS as a printer, so your checkout stays exactly the same.\n\nNot sure about yours? [Ask us in a demo](#demo).",
  },
  {
    q: "What changes for my staff at checkout?",
    a: "Almost nothing. Staff ring up sales exactly as before. After each sale, customers can tap their phone on the PapeX device for 90 seconds to get their receipt, so staff just let them know they can tap.\n\nYour paper printer keeps printing. Go paper-free: switch off the printer whenever you're ready.",
  },
  {
    q: "What happens if the Wi-Fi or the PapeX device goes down?",
    a: "Your checkout doesn't depend on PapeX. Your POS keeps ringing up sales, and your paper printer keeps printing while it's switched on.\n\nThe device's status light shows what it's doing, and we're here to help. [Get help](/support).",
  },
  {
    q: "Does PapeX touch card data? What about PCI?",
    a: "PapeX never stores, processes or transmits card data. Like any receipt, it only shows the last 4 digits of the card. [See the details](/pci).",
  },
  {
    // Spec §6a round 2 (lead instruction): the "What does it cost?" and "How
    // does PapeX make money?" questions are ONE visible item, answered with
    // "It's free today. Take advantage while it lasts." + free device/install.
    // Never mention future paid profiles or coupons (the earlier Q1 draft did;
    // it is superseded and intentionally not kept here). Question trimmed to
    // the cost alone at the 2.1 merge (Nico).
    q: "How much does PapeX cost?",
    a: "It's free today. The PapeX device is free, and so is the install. Take advantage while it lasts.",
  },
  {
    // Waiting on Nico (spec §6 Q2 / §6a round 2): is there a signed pilot or
    // merchant agreement, and how does a merchant stop? Until then the site
    // says nothing about contracts. Write the answer here, then drop `hidden`.
    q: "Is there a contract? How do I remove PapeX?",
    a: "",
    hidden: true,
  },
  {
    q: "Who installs PapeX, and how long does it take?",
    a: "We do, for free, in about 15 minutes. We plug the PapeX device into power, connect it to your Wi-Fi (2.4 GHz), connect it to your POS, test a sale and hand it over. Your dashboard is live from the first receipt.",
  },
  {
    q: "Which phones can my customers tap with?",
    a: "iPhone and Android. Customers tap and the receipt opens: on iPhone in an App Clip in about 2 seconds, with no app, and on Android in the browser.",
  },
  {
    q: "Where is PapeX available?",
    a: "PapeX is live in the Bay Area. Somewhere else? [Request a demo](#demo) and tell us where you are.",
  },
  {
    q: "Will my store get a page in the PapeX app?",
    a: "It can have one. Stores can have a profile in the PapeX app, where shoppers find their receipts from you. [Ask about it in your demo](#demo).",
  },
]
