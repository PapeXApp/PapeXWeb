# PapeX Website Redesign — Product Requirements Document

**Version:** 1.0
**Author:** Nico (CEO)
**Date:** July 2026
**Status:** Draft for design team

---

## 1. Overview

### What we're building
A complete redesign of papex.app — the primary website for PapeX, a digital receipt platform that eliminates paper receipts via NFC tap-at-checkout. The site serves two distinct audiences (consumers and merchants) and must communicate different value propositions to each while maintaining one cohesive, visually stunning brand experience.

### Why we're building it
The current site doesn't effectively communicate what PapeX does, why it matters, or who it's for. The redesigned site needs to be PapeX's best pitch deck — a visitor should understand the product, feel the value, and want to either download the app (consumer) or request a demo (merchant) without anyone explaining it to them.

### Design north star
When someone lands on this site, they should want to stay because it looks incredible. Then they start scrolling because the story pulls them in. By the time they reach the bottom, they understand PapeX and they want in.

### Reference site
[oryzo.ai](https://oryzo.ai/) — Study this site closely. We want that level of visual craft, scroll-driven storytelling, smooth transitions between sections, interactive moments that reward curiosity, and the dark/light section rhythm. Oryzo sells a fictional cork coaster and makes you care. We're selling a real product that actually solves a real problem.

---

## 2. Brand Specs

### Colors
- **Navy Deep:** #00121D (primary backgrounds, dark sections, body text on light)
- **Orange:** #EB7100 (accent, CTAs, highlights, interactive elements)
- **Off-white:** #F5F5F5 (light section backgrounds, surfaces)
- **White:** #FFFFFF (cards, elevated elements, inputs)

### Typography
- **Headings / Display:** Kameron (serif, bold, used for impact statements)
- **Body / UI:** Barlow (sans-serif, clean, used for everything else)

### Visual direction
- Dark hero sections, light content sections, dark again for emphasis — creates visual rhythm
- Smooth scroll-driven animations and transitions between sections
- 3D or motion elements where they add to the story (not decorative)
- Big, bold typography for key statements — short copy, no walls of text
- Interactive moments that make the user want to explore
- The site should feel alive, not static

### Logo
White version on dark backgrounds, navy version on light backgrounds. PapeX wordmark with orange paper airplane icon.

---

## 3. Site Architecture

### Navigation (persistent top bar)
- **PapeX logo** (left, links to home)
- **For You** (consumer path)
- **For Business** (merchant path)
- **Features**
- **Blog**
- **About** (contact + team)
- **CTA button** (right side): "Download App" for consumers, "Get the RDH" for merchants — adapts based on which path the user is on

### Pages
1. **Homepage** (/)
2. **Consumer path** (/for-you)
3. **Merchant path** (/for-business)
4. **Features** (/features)
5. **Blog** (/blog)
6. **About / Team** (/about)
7. **PCI Documentation** (/pci) — already specced, separate from this PRD
8. **Merchant Support** (/support) — already specced, separate from this PRD

### Integrated apps (future, account for in nav/routing)
- **Consumer web app** — integrated at papex.app, app is live on App Store
- **Merchant dashboard** — integrated at papex.app, not live yet

---

## 4. Page-by-Page Requirements

### 4.1 Homepage (/)

**Purpose:** Hook everyone, then naturally guide them to the right path.

**Section 1: Hero (dark, full viewport)**
- Big statement that speaks to everyone. Something like: "The last receipt you'll ever lose." or "Receipts, reimagined." (placeholder — final copy TBD)
- Subtle animation or 3D element (phone with receipt, paper airplane motion, NFC tap visualization)
- This section sets the tone. It should make someone stop and pay attention.
- No CTA yet. Just the hook.

**Section 2: The Problem (light section)**
- Quick, punchy visualization of the paper receipt problem
- Stats or visual storytelling: billions of receipts printed, trees wasted, receipts fading, lost receipts at tax time
- This section builds the "why" before showing the "what"
- Keep it emotional, not data-heavy. Feel, don't think.

**Section 3: The Visual Split / Fork (dark section)**
- This is the key moment. The screen presents two paths side by side.
- **Left path: "For You"** — Shows a phone, organized receipts, a person tapping. Lifestyle imagery. The personal benefit.
- **Right path: "For Business"** — Shows a POS counter, the RDH device, happy customers, no paper waste. The business benefit.
- These aren't static cards. As the user scrolls, both paths animate and reveal themselves. The user naturally gravitates toward one side.
- Each side has a subtle CTA: "See how it works" or "Learn more" that takes them to the dedicated consumer or merchant page.
- If the user doesn't click either, the page continues scrolling into a universal section.

**Section 4: How It Works (light section)**
- Simple 3-step visualization that works for both audiences:
  1. Customer pays at checkout
  2. Customer taps their phone on the PapeX device
  3. Digital receipt appears instantly — no app needed
- This should be animated/interactive. Maybe a scroll-driven sequence showing the tap moment.

**Section 5: Social Proof (dark section)**
- Placeholder section for when we have testimonials, press logos, metrics
- For now: design the section with placeholder content so it's ready to populate
- Include a counter/stats row (placeholder): receipts delivered, trees saved, merchants onboarded

**Section 6: The Vision (light section)**
- Brief section about what PapeX is building toward — the bigger picture
- Environmental impact, modernizing checkout, making receipts useful instead of wasteful
- Ends with a CTA strip: "Download the App" | "Get the RDH for Your Business"

**Section 7: Footer (dark)**
- Logo, nav links, social links, legal (terms, privacy)
- Newsletter signup
- Contact info: support@papex.app, 415-261-8675

---

### 4.2 Consumer Path (/for-you)

**Purpose:** Educate consumers on why PapeX matters to THEM, address all three persona types, drive app downloads.

**Hero (dark)**
- Consumer-focused headline. Something like: "Your receipts. Finally organized." or "Every receipt. One place. Zero effort."
- Phone mockup showing the PapeX app with organized receipts

**Section: The Three Kinds of Receipt People (light, interactive)**
This is the mix of scroll reveal + interactive moment:

As the user scrolls, three persona cards/sections reveal one at a time:

**Persona 1: The Keeper**
"You save every receipt. Tax season is a nightmare anyway."
- Value prop: PapeX auto-organizes everything. Search by store, date, amount. Export for taxes in one tap. No more shoeboxes, no more scanning, no more losing the one receipt you need.

**Persona 2: The Casual**
"You keep receipts... sometimes. When you remember."
- Value prop: You don't have to remember anymore. Every receipt is saved automatically when you tap. It's just there when you need it. Returns, warranties, expense reports — covered.

**Persona 3: The Non-Keeper**
"You throw them all away. You've never needed one... until you did."
- Value prop: You've been leaving money on the table. Tax deductions, warranty claims, price adjustments, returns. One tap at checkout and you're covered without changing anything about your day.

After the three personas scroll by, there's a subtle interactive moment: "Which one are you?" with three tappable options. Tapping one could highlight the relevant features below or simply be a fun engagement moment.

**Section: Features Showcase (alternating dark/light)**
- All receipts in one place
- Search and organize however you want
- Easy sharing (text, email, airdrop)
- Categorization (food, transport, business, personal)
- Basic expense tracking
- Returns and warranty tracking
- No app needed to receive (App Clip), download the full app to keep and organize

Each feature should be a visual section with a phone mockup or animation, not a bullet list.

**Section: How to Get Started (light)**
1. Tap at any PapeX-enabled checkout
2. Receipt appears on your phone instantly
3. Download the app to save, organize, and search all your receipts

**CTA Section (dark)**
- "Download PapeX" with App Store badge
- App mockup

---

### 4.3 Merchant Path (/for-business)

**Purpose:** Explain the value prop, show the product, drive demo requests and RDH signups.

**Hero (dark)**
- Merchant-focused headline. Something like: "Give your customers a reason to come back." or "Modernize your checkout. No cost. No hassle."
- RDH device visualization or photo

**Section: Why Merchants Love PapeX (light)**
- It's free. The RDH device costs merchants nothing.
- It works with your existing POS. No new system, no software change.
- Customers love it. Digital receipts are faster, greener, and more convenient.
- Reduce paper waste and costs.
- Stand out from competitors still printing paper.

**Section: How It Works for Your Business (dark)**
- We install a small device at your POS
- It connects to your existing system through a standard port
- Customers tap and get a digital receipt
- You get a dashboard to track digital receipt adoption (coming soon)

**Section: The RDH Device (light)**
- Product showcase of the hardware
- Key specs: plugs into standard POS ports, no terminal modification, PCI compliant
- Two installation options: printer replacement or inline extension
- Photo or 3D render of the device

**Section: Merchant Dashboard Preview (dark)**
- Placeholder/coming soon section
- Preview mockup of what the dashboard will look like
- "Be the first to know when it launches" — email capture

**Section: Get Started (light)**
- "Request a Demo" form — name, business name, email, phone, POS system
- "Or call us: 415-261-8675"

**CTA Section (dark)**
- "Get the RDH — Free for qualified merchants"
- "Request a Demo"

---

### 4.4 Features Page (/features)

**Purpose:** Deep dive on all features for both audiences in one place. Someone who's already interested and wants to know everything.

**Structure:**
- Tab or toggle at top: "Consumer Features" | "Merchant Features"
- Each tab shows the relevant feature set with visuals and descriptions
- This page is more detailed and information-dense than the consumer/merchant landing pages
- Can include comparison tables, detailed specs, and roadmap items

**Consumer features to cover:**
- Digital receipts via NFC tap (App Clip, no download needed)
- Full app: receipt history, search, organize, categorize
- Expense tracking
- Returns and warranty tracking
- Sharing (text, email, airdrop)
- Environmental impact tracker (trees saved, paper eliminated)

**Merchant features to cover:**
- Free RDH device and installation
- Works with existing POS (USB, serial, Ethernet)
- Two installation modes (printer replacement, inline extension)
- PCI DSS compliant (out of scope — link to /pci)
- Merchant dashboard (coming soon)
- Customer engagement and loyalty insights (coming soon)
- No cost, no contract

---

### 4.5 Blog (/blog)

**Purpose:** Content hub for SEO, thought leadership, and keeping merchants/consumers informed.

**Content categories:**
- **Product updates:** New features, app updates, merchant dashboard launch
- **Educational:** Receipt tips, tax advice, expense tracking how-tos, sustainability
- **Industry:** POS trends, merchant insights, digital transformation in retail
- **Company:** Team updates, milestones, press coverage

**Design:**
- Grid layout with featured post at top
- Category filter/tabs
- Each post card: title, excerpt, category tag, date, estimated read time
- Clean reading experience on individual posts — wide content column, good typography, no sidebar clutter
- Share buttons on each post
- Related posts at bottom

---

### 4.6 About / Team (/about)

**Purpose:** Build trust and show the humans behind PapeX.

**Section: Our Story (dark hero)**
- Brief origin story — why PapeX exists, what we're building, what drives us
- Placeholder copy for now

**Section: The Team (light)**
- 5-10 team members
- Each person: photo, name, role, short bio (2-3 sentences)
- Grid layout — clean, consistent photo treatment (same crop, same background or style)
- Photos should feel human and approachable, not corporate headshots

**Section: Contact (dark)**
- Email: support@papex.app
- Phone: 415-261-8675
- Office: San Francisco, CA
- Contact form: name, email, subject, message
- Social links

**Section: Advisors / Board (light, optional)**
- If you want to showcase advisors for credibility
- Simpler treatment than team — name, title, maybe logo of their company

---

## 5. Interaction and Animation Guidelines

### Scroll behavior
- Smooth scroll throughout — no hard jumps between sections
- Sections should transition into each other with subtle parallax or fade-in effects
- The visual split on the homepage should animate as the user scrolls through it

### Hover states
- All interactive elements have clear hover states
- Cards lift or shift slightly
- CTAs have color or scale transitions

### Page transitions
- Smooth transitions when navigating between pages (no hard page loads)
- Next.js page transitions should feel like the site is one continuous experience

### Loading
- Minimal loading states — the site should feel instant
- Use skeleton screens or progressive loading for images
- Hero sections load first, below-fold content loads as you scroll

### Mobile
- Every section must work on mobile
- The visual split on homepage adapts: stacks vertically on mobile with swipe or scroll between paths
- All interactive moments degrade gracefully to scroll-based on mobile
- Mobile nav: hamburger menu with the same persistent CTA button

---

## 6. Technical Requirements

### Stack
- **Framework:** Next.js (already in use)
- **Hosting:** Current hosting setup
- **CMS for blog:** Headless CMS (Contentful, Sanity, or similar — TBD)
- **Forms:** Contact form and demo request form need to submit to a backend/email
- **Analytics:** Google Analytics or similar — track which path users take (consumer vs merchant), CTA clicks, app downloads
- **SEO:** Meta tags, Open Graph, structured data on all pages
- **Performance:** Core Web Vitals targets — LCP under 2.5s, CLS under 0.1

### Integrations
- App Store link (consumer app, live)
- Merchant dashboard (future, integrated at papex.app)
- Consumer web app (future, integrated at papex.app)
- /pci page (already specced)
- /support page (already specced)

---

## 7. Content Status

| Page | Copy Status | Notes |
|------|------------|-------|
| Homepage | Placeholder | Final copy TBD — work with Claude to fill in |
| Consumer path | Placeholder | Persona descriptions drafted, features TBD |
| Merchant path | Placeholder | Value props drafted, details TBD |
| Features | Placeholder | Feature lists drafted, descriptions TBD |
| Blog | Empty | CMS needed, first posts TBD |
| About / Team | Placeholder | Need team photos and bios |
| /pci | Final | Content complete, ready to build |
| /support | Final | Content complete, ready to build |

---

## 8. Success Metrics

- **Time on site:** Visitors stay and scroll, not bounce
- **Path selection rate:** What percentage choose consumer vs merchant
- **CTA conversion:** App downloads (consumer), demo requests (merchant)
- **Shareability:** Visitors share the site because it looks and feels worth sharing
- **SEO:** Rank for "digital receipts," "paperless receipts," "NFC receipt"

---

## 9. What We Need From the Design Team

1. **Wireframes** for all pages (desktop and mobile) — show the section flow, the visual split mechanism, and the persona reveal interaction
2. **Moodboard** inspired by oryzo.ai — dark/light rhythm, typography scale, animation concepts
3. **High-fidelity mockups** for homepage first, then consumer and merchant paths
4. **Interactive prototype** of the homepage scroll experience, especially the visual split fork
5. **Component library** — buttons, cards, section templates, form elements — so we can build consistently
6. Use **placeholder text** throughout — we will work with Claude to fill in all final copy

---

## 10. Timeline and Priority

### Phase 1 (highest priority)
- Homepage
- Consumer path (/for-you)
- Merchant path (/for-business)

### Phase 2
- Features page
- About / Team page

### Phase 3
- Blog (requires CMS setup)
- Dashboard integration (when ready)

---

## Appendix: Consumer Persona Reference

### The Keeper (religious receipt saver)
- Saves every receipt
- Has a system (shoebox, folder, envelope, spreadsheet)
- Pain point: the system is manual and breaks at tax time
- PapeX value: automatic organization, search, export — their system, upgraded

### The Casual (sometimes saves)
- Keeps receipts when they remember
- Loses the ones they need
- Pain point: can never find the receipt when they actually need it for a return or warranty
- PapeX value: effortless — it just happens, no behavior change needed

### The Non-Keeper (throws everything away)
- Never saves receipts
- Doesn't think they need them
- Pain point: doesn't realize what they're missing — tax deductions, warranty claims, return windows
- PapeX value: you don't have to change anything about your life, but now you're covered when you need it
