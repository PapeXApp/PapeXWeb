import type { FaqItem } from "../shared/Faq"

/**
 * /customers section 07 — "Questions, answered." (spec 2026-09-24 §3.2 row 07,
 * facts per §2 and §6a, which overrides the rest of the spec).
 *
 * Questions are phrased the way people search them. Answers use only facts
 * the spec marks true today; anything still waiting on Nico ships with
 * `hidden: true` (not rendered, not in the FAQPage JSON-LD).
 *
 * Answer strings: blank line = new paragraph, `[label](/path)` = link.
 */
export const customerFaqHeading = "Questions, answered."

export const customerFaq: FaqItem[] = [
  {
    q: "Do I need an app to get my receipt?",
    a: "No. Tap your phone on the PapeX device at checkout and your receipt opens right away, with no app to download.\n\nWant to keep every receipt in one place, searchable? That's what the free PapeX app is for.",
  },
  {
    q: "Is PapeX free?",
    a: "Yes. Getting your receipt with a tap is free, and the PapeX app is free on the App Store and Google Play.",
  },
  {
    q: "Does PapeX work on Android?",
    a: "Yes. iPhone or Android: tap and your receipt opens (iPhone in an App Clip, Android in the browser).",
  },
  {
    q: "Where can I tap my phone for a receipt?",
    a: "PapeX devices are live in the Bay Area, with more stores coming. Anywhere else, scan or forward your receipt.",
  },
  {
    q: "What if the store doesn't have PapeX?",
    a: "You can still keep that receipt in PapeX. Scan the paper receipt in the app, or forward email receipts to your own PapeX address.",
  },
  {
    q: "Is my data safe with PapeX?",
    a: "A tap sends your receipt and nothing else: no name, no email, no phone number, and never more of your card than the last 4 digits already printed on the receipt.\n\nIn the app, your receipts are yours. Delete any receipt, or your whole account, any time. [Read our privacy policy](/privacy).",
  },
  {
    // Q8, answered by Nico in spec §6a round 2 (published on the lead's
    // round-2 instruction).
    q: "How long can I open a receipt I tapped for?",
    a: "Your receipt stays open until you close it or save it to PapeX.",
  },
  {
    // TODO(S2): /about doesn't exist yet; point this at /about once it ships
    // (S2 adds the /contact -> /about redirect, so /contact keeps working).
    q: "Who's behind PapeX?",
    a: "A small team on a mission to make every receipt useful, and none of them wasted. [Meet us and get in touch](/contact).",
  },
]
