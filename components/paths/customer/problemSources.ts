import type { ProblemCardId } from "./content";

/**
 * Where each Problem card's figure comes from — the exact page, opened in a new
 * tab from the card's "Source:" line. Kept out of content.ts on purpose (that
 * file has its own owner); keyed by card id so the two can't drift.
 *
 * VERIFIED 2026-09-23 by fetching each page and finding the figure in its text:
 *  - print  → Epson blog: "Americans use 620 million pounds² of receipt paper
 *             annually." Footnote 2: "Grand View Research, Thermal Paper Market
 *             Forecast, 2025."
 *  - forest → Green America, Skip the Slip report (published 2022-09-07):
 *             "Receipts use 3,680,000 trees and 10 billion gallons of water
 *             every year in the US."
 *  - proof  → same Epson post: "U.S. businesses are projected to spend
 *             $540+ million¹ on receipt paper this year." Footnote 1: Grand View
 *             Research, Thermal Paper Market Forecast, 2025.
 *
 * Each URL carries a text fragment (#:~:text=…) so Chrome/Safari scroll to and
 * highlight the figure; browsers without support just open the page.
 * `null` = unverified → the card shows the citation as plain text. Never guess
 * a URL here.
 */
const EPSON_RECEIPT_PAPER = "https://blog.epson.com/are-you-overspending-on-receipt-paper/";

export const PROBLEM_SOURCE_URLS: Record<ProblemCardId, string | null> = {
  print: `${EPSON_RECEIPT_PAPER}#:~:text=620%20million%20pounds`,
  forest: "https://reports.greenamerica.org/skip-the-slip#:~:text=Receipts%20use%203%2C680%2C000%20trees",
  proof: `${EPSON_RECEIPT_PAPER}#:~:text=spend%20%24540%2B%20million`,
};
