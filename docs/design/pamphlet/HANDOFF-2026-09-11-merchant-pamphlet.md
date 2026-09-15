# Merchant pamphlet: design handoff

**Date:** 2026-09-11 · **Owner:** Nico · **For:** Design
**Format:** 4 pages. Page 1 is the cover. Pages 2 to 4 carry the story.

This doc is the full script: every word that goes on the page, the order it goes in, and what each page should show. Layout is yours. The words are final unless the claims list at the back says otherwise.

---

## 0. The story in one breath

We give you a free box. It takes 15 minutes to set up and nothing about your checkout changes. Your customers tap their phone and get the receipt instantly. From there they can keep it, or get PapeX, where your store has its own page that works like your own app. You run that page from your dashboard, and the same dashboard shows you your sales data.

Each page answers one question a merchant would ask:

| Page | The merchant's question | Our answer |
|---|---|---|
| 1 | What is this? | Cover. No explaining. |
| 2 | What do I have to do? | Almost nothing. Free box, 15 minutes, a second printer. |
| 3 | What do my customers get? | An instant receipt, then your store's own page in PapeX. |
| 4 | What do I get? | A dashboard for your data and your page. Then: how to reach us. |

---

## 1. Rules for the whole piece

**Copy**
- No em dashes anywhere. Use a comma, a period, a colon, or parentheses instead. Check every line before export.
- Short sentences, plain words. If a line needs a second read, cut it.
- Always write "Wi-Fi" (the support page's "WiFi" is legacy).
- Customers tap their phone **on the PapeX box at the counter**. Never write "tap your receipt". The paper doesn't do anything.
- We give merchants **a place to put their own** coupons, points and deals. We never promise that PapeX supplies the coupons.
- No real brand names or logos in mockups. The app's sample stores are modelled on real brands, so use the "Your Store" template (see §6).

**Palette** (source: `PapeXWeb/styles/papex-brand.css`)

| Role | Hex |
|---|---|
| Orange (accent, sparingly) | `#EB7100` |
| Navy (type, dark grounds) | `#00121D` |
| Off-white (page ground) | `#F5F5F5` |
| Body text | `#4A4A4A` |
| Muted text (page 4 contact block) | `#8A8A8A` |
| Hairlines | `#D8D8D8` |

**Type**
- Display: Kameron SemiBold
- UI and body: Barlow
- Small labels and step numbers: Geist Mono

**Brand mark:** the plane logo, from `PapeXWeb/public/brand/` (`plane-orange-navy.png`, `plane-orange-white.png`, or the `vector/` folder for print).

**Tone:** calm and confident, not salesy. Lots of air, one orange accent per spread.

**Print specs (confirm with the printer):**
- Finished size 8.5 × 11 in.
- Printed as one 11 × 17 in sheet, folded in half (page 1 front, pages 2 and 3 inside spread, page 4 back).
- 0.125 in bleed, 0.25 in safe margin, CMYK, 300 dpi images.

> Designing pages 2 and 3 as one inside spread is a real advantage: the box on the left, the phone on the right, and the tap happens across the fold.

---

## 2. Page 1: Cover (no explaining)

**Purpose:** get it picked up. Nothing to read beyond the name and one line.

**On the page**
- Plane mark and the "PapeX" wordmark.
- One hero image: the orange RDH box on a counter, a phone just above it mid-tap. Source renders: `Papex_RDH_Firmware/docs/enclosure/rdh_final_front.png` and `rdh_final_top.png` (solid orange box, logotype debossed on the lid).
- The tagline, from the options below.
- Nothing else. No bullets, no contact details.

**Tagline options** (pick one; A is recommended)
- A. **Every receipt is a way back to your store.**
- B. **Your checkout, now a direct line to your customers.**
- C. **One tap. They leave with your store in their pocket.**

Small line at the foot (optional): `Free for your business.`

---

## 3. Page 2: The box (What do I have to do?)

**Purpose:** kill the "this sounds like work" objection. The page should feel almost empty, because the job almost is.

**Eyebrow (Geist Mono, small caps):** `THE PAPEX BOX`

**Headline:** **Free. 15 minutes. Nothing else changes.**

**Intro (1 to 2 lines):**
We send you a small PapeX box at no cost. It sits next to your register and works with the point of sale you already have.

**Three steps.** Big step numbers; a line drawing or a small photo for each.

| # | Step | Line under it |
|---|---|---|
| 01 | **Plug it in.** | Any outlet near your register. |
| 02 | **Connect it to your Wi-Fi.** | The same network your register uses. |
| 03 | **Add it as a second printer.** | In your point of sale's printer settings. Your paper printer keeps printing like it always has. |

**Payoff line:** **That's it. Your staff don't learn anything new, and your customers don't wait.**

**Proof strip.** Four small tiles in a row, each a number or word plus a caption:

| Big | Caption |
|---|---|
| **$0** | Free box. No subscription, no contract. |
| **15 min** | From the box to your first digital receipt. |
| **0** | Changes to your checkout or your staff's routine. |
| **PCI** | The box never touches card data. |

**Visual:** the box, life size if it fits, with a dotted line to a simple register icon labelled "second printer".

**Word budget:** about 90 words.

---

## 4. Page 3: The tap and your store page (What do my customers get?)

**Purpose:** show the customer's side in two beats. First the instant receipt, then your store page inside PapeX. This is the page that should make a merchant say "oh, that's clever".

**Eyebrow:** `FOR YOUR CUSTOMERS`

### Beat 1: the tap (top third)

**Headline:** **One tap. The receipt is on their phone.**

**Mini-flow.** Three phone frames left to right, with the small caption under each:
1. **Tap.** They hold their phone to the PapeX box after paying.
2. **Instant.** The receipt opens right away. No app, no account, no typing.
3. **Their choice.** Keep the receipt, or get PapeX to save every receipt in one place.

Screens: the App Clip card and the receipt view (§6, shots 1 and 2).

### Beat 2: your store, inside PapeX (bottom two thirds)

**Headline:** **Inside PapeX, your store gets its own page.**

**Subhead:** It works like your own app, without you building one.

**Visual:** one big phone showing the store page (§6, shot 3) with callout lines to each part:

| Callout | Label |
|---|---|
| Banner, logo, colours | **Your look.** Your banner, your logo, your colours. |
| Identity line + About row | **Your details.** Hours, address, phone, website. |
| Menu tab | **Your menu.** Photos, descriptions, prices. |
| Deals tab | **Your deals.** Sales and specials, linked to the items they apply to. |
| Coupons tab | **Your coupons.** The offers you choose to run. |
| Points card | **Your rewards.** Show customers how close they are to their next reward. |
| What's new post | **Your news.** New arrivals, events, announcements. |
| Join card (email) | **Your list.** Customers can join your email list, right from your page. |

**Two short blocks** under the phone, side by side.

**A new way to grow your email list**
Nobody wants to spell out their email while a line builds behind them. On your page, customers sign up later, on their own time, because they want to hear from you.

**Seen, not pushed**
Customers choose the stores they follow. PapeX puts their favourites in one calm place, so your offers reach people who asked for them.

**Word budget:** about 170 words, plus the callout labels.

---

## 5. Page 4: The dashboard, then us (What do I get?)

**Purpose:** show the merchant's side, then hand off to a human. The top two thirds sell. The bottom third is quiet: grey, small, and easy to find.

**Eyebrow:** `FOR YOU`

**Headline:** **One dashboard. Your data and your page.**

**Intro:**
Everything your PapeX box sees shows up in your dashboard from the first receipt. It is also where you shape your store page.

**Visual:** a laptop or browser frame showing the Insights screen (§6, shot 4), slightly overlapped by a phone showing your store page. The overlap is the point: one dashboard runs both.

**Two columns**

| **See your business** | **Promote your business** |
|---|---|
| Every receipt, searchable by item, amount, or date | Post your coupons |
| Your busiest hours and days | Run a points program |
| Your top-selling items | Keep your menu and prices current |
| How many customers tap for a digital receipt | Announce deals and events |
| Every PapeX box and whether it's online | Grow your email list |
| Export to a spreadsheet anytime | Share what's new |

**Positioning line** (centred, set larger):
**We give you the platform. You bring the offers.**

**Close: one place, for both sides** (the last beat of the story, set as a short two-line pair):
**For your customers:** every store they love, their receipts, and the offers they asked for, all in one place.
**For you:** your sales, your page, and the customers who chose to follow you, all in one dashboard.

**Word budget:** about 130 words above the contact block.

### Contact block (bottom third, low contrast)

Set it in the muted grey (`#8A8A8A`) on the off-white ground, with a thin hairline rule above it. It should not compete with the headline.

| Left | Right |
|---|---|
| **Nico Courbage**<br>Founder, PapeX<br>nico@papex.app<br>415-261-8675 | QR code, about 1 in square, in navy or grey (not orange)<br>Caption under it: **papex.app** |

**QR code**
- Points to `https://papex.app/business`. That is the merchant half of the site; the homepage makes visitors choose a path first.
- To count scans later, use `https://papex.app/business?src=pamphlet`. Nico to choose.
- Generate it as a vector, test it from print size at arm's length, and keep a quiet zone of at least 4 modules.
- The written web address must appear as text next to the QR code, not only encoded in it.

Optional one-liner above the name (muted): `Want the box? Let's talk.`

---

## 6. Screens and assets to capture

Use the **"Your Store"** template store in the app, not the sample brands. If it needs a fuller example, fill it with a made-up café or shop. Do not use Doobie Nights, Coke, or the other samples, because they are modelled on real brands.

| # | What | Where it comes from | Who captures |
|---|---|---|---|
| 1 | App Clip card ("Tap a PapeX-enabled receipt printer…") | iPhone tapping a live RDH box, or `Papex_AppClip` in the simulator | Eng |
| 2 | Receipt view with "Save to PapeX" / "Get PapeX" | same | Eng |
| 3 | Store page: banner, identity line, About, the Menu/Deals/Coupons tabs, points card, What's new, email join card | PapeXV2 `app/store/[id].tsx`, sample build (`EXPO_PUBLIC_COUPONS_SAMPLE=1`), template store | Eng |
| 4 | Dashboard Insights: hour of day, day of week, top items, tap rate | PapeXWeb `/merchant/insights`, in mock mode, locally | Eng |
| 5 | RDH box renders | `Papex_RDH_Firmware/docs/enclosure/rdh_final_front.png`, `rdh_final_top.png` | Ready |
| 6 | Plane mark (vector) | `PapeXWeb/public/brand/vector/` | Ready |

Screenshot rules:
- iPhone screens at 3x, with real device frames.
- Light mode throughout.
- Clean status bar (9:41, full battery).
- No personal data or real receipts.

---

## 7. Claims check (Nico decides before print)

Some pages describe where PapeX is going rather than what ships today. That is fine for a pitch piece, but know which lines they are.
- **Status** says what is true today.
- **Safe line** is a drop-in replacement if you'd rather only promise what's live.

| Claim in the copy | Status today | Safe line |
|---|---|---|
| "Free" | The site says both "Free forever" and "free for qualified merchants". The pamphlet says only "Free". | Keep "Free". Don't add "forever". |
| "15 minutes" | Nico's figure. Wi-Fi is set up through a `PapeX-Setup-…` hotspot and only works on **2.4 GHz** networks. The point of sale must allow adding a network printer by IP address (Blaze does; a full run from Blaze through the box isn't on record yet). The website says "We install the RDH". | Keep. Optionally add a footnote: "Works on 2.4 GHz Wi-Fi. We'll help you set it up." |
| "Your paper printer keeps printing" | True. The box is added as a second, parallel printer. Sitting inline between the register and the printer isn't built, so don't imply it. | Keep. |
| "Instant" receipt | About 2 seconds on iPhone. Android and older iPhones get the same receipt in the browser. The tap works for 90 seconds after each sale. Receipts printed as images show a picture first; the itemised text follows about 45 seconds later. | Keep. |
| "Works with the point of sale you already have" | Designed for any POS that can add a network printer by IP address. Blaze supports that, and the backend reads real Blaze receipts, but a full live run from Blaze through the box isn't on record yet. No other POS is tested. | "Works with most point of sale systems." |
| "Keep the receipt" without the app | Older plan docs say links expire after 30 days, but the backend config now says "keep everything forever" (`Papex_RDH_Backend/terraform/s3.tf`). Whether that's applied live is unconfirmed. The copy never names a time limit. | Keep. |
| "Your store gets its own page" | Built in the app, but it runs on sample data and **isn't in the App Store build yet**. | "Your store can have its own page in PapeX." |
| Merchant shapes the page from the dashboard | The dashboard shows the profile. Merchants send "Request a change" and PapeX staff apply it. **The dashboard and the app aren't linked yet**, so an edit doesn't reach the app. | "Tell us what to show, and we keep your page up to date." |
| Coupons, points, menu, deals on the page | Coupons, menu and deals display. **Points are display-only ("For reference only") and nothing earns or spends them yet.** | "Show your rewards program." (drop "run a points program") |
| "Events" | There is no events field. The closest is "What's new" announcement posts. | "Announce what's new." |
| Email list sign-up | The join card exists but **only saves on the customer's phone**. There's no backend, and merchants can't export the emails yet. | "Invite customers to join your list." (or cut until it's live) |
| "Export to a spreadsheet" | True: CSV export of transactions. | Keep. |
| Dashboard data (receipts, hours, items, tap rate, boxes) | Live. The "Beyond your four walls" competitor figures can be demo data, so the pamphlet doesn't mention them. | Keep. |
| "PCI: the box never touches card data" | The support page says the RDH "does not store, process, or transmit cardholder data". | Keep. |
| "Seen, not pushed" | Favourites are chosen by the customer and stored on their phone. There are no marketing push notifications from stores today. | Keep. Revisit if store push notifications ship. |

**Contact details to confirm:** the name spelling "Nico Courbage", and whether 415-261-8675 (the company line on the website) is the number Nico wants printed.

---

## 8. Designer checklist before sending proofs

- [ ] 4 pages; the cover has no explanatory copy.
- [ ] Every beat is present, in order: free box → 15-minute setup (plug in, Wi-Fi, second printer) → nothing changes → tap → instant receipt → keep it or get PapeX → store page → email sign-up + "Seen, not pushed" → dashboard (data + promotion) → "one place, for both sides" close → contact.
- [ ] Search the file for "—": zero results.
- [ ] "Wi-Fi" spelled consistently.
- [ ] No real brand names or logos in any screen.
- [ ] Contact block muted grey. The QR code scans at print size, and "papex.app" is written out.
- [ ] Nico has signed off on the §7 claims.
