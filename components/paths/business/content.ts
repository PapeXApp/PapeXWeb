// Marketing copy for the "For Business" (merchant) homepage path.
//
// Copy here is polished-but-provisional (per the design spec's Fidelity
// section) — it communicates intent and tone but is not final marketing
// copy. Do not invent specifications, pricing, certifications or customer
// names beyond what's written here.
//
// NOTE on illustrative content: the design spec's "Fidelity" section flags
// stats, merchant/press logos and testimonials as illustrative placeholders
// pending real data. Unlike the customer path, the Business path as
// specified (README "Screen 3: Business / Merchant Path", 3.1-3.7) has no
// numeral stat callouts, press/merchant logo strips, or testimonial slots —
// so there is nothing of that kind to mark here. The one illustrative
// UI element in this path is the "Coming soon" merchant dashboard (3.6),
// which is explicitly labelled as such below and in DashboardPreview.tsx.

export const hero = {
  eyebrow: "For business",
  heading: "Modern checkout. Zero paper.",
  lead: "The RDH plugs into your existing POS and sends customers a digital receipt when they tap. Free hardware, free install, zero paper.",
  ctaLabel: "Request a demo",
  phoneLabel: "or call",
  phone: "415-261-8675",
  phoneHref: "tel:+14152618675",
  deviceAlt: "The PapeX RDH: a small matte-black device with a green status light and a PapeX label on top.",
} as const

export const whyMerchants = {
  eyebrow: "Why merchants love PapeX",
  heading: "Every reason to switch. None to say no.",
  // Each card now leads with a numeric claim; the first ("Free forever") is
  // the inverted dark lead card in the 2x2 `wcard` grid.
  cards: [
    {
      value: "$0",
      title: "Free forever",
      body: "The device, the install, and support cost you nothing. No hardware fee, no subscription, no contract to sign.",
      isLead: true,
    },
    {
      value: "1 port",
      title: "Works with your POS",
      body: "Connects through a standard port you already have. No new system, no software change, no retraining.",
      isLead: false,
    },
    {
      value: "1 tap",
      title: "Customers love it",
      body: "Faster at the counter than waiting on a printer, and the receipt can't fade, tear, or end up in the trash.",
      isLead: false,
    },
    {
      value: "0 rolls",
      title: "Cut paper and cost",
      body: "Stop buying thermal paper. Stand out from the shop next door still handing out waste.",
      isLead: false,
    },
  ],
} as const

export const marquee = {
  durationSeconds: 32,
  phrases: [
    "Free device.",
    "Free install.",
    "Works with your POS.",
    "Zero paper.",
    "PCI compliant.",
  ],
} as const

export const howItWorks = {
  eyebrow: "Getting set up",
  heading: "Up and running the same afternoon.",
  lead: "Four steps, one visit. Follow the line: nothing about your existing setup has to change.",
  steps: [
    {
      number: "01",
      title: "We install the RDH",
      body: "A small device fits right at your point of sale.",
    },
    {
      number: "02",
      title: "It connects to your POS",
      body: "Through a standard port, no terminal modification.",
    },
    {
      number: "03",
      title: "Customers tap",
      body: "They get a digital receipt instantly, no app required.",
    },
    {
      number: "04",
      title: "You see it all",
      body: "Your dashboard is live from the first receipt.",
    },
  ],
} as const

export const rdhDevice = {
  eyebrow: "The RDH device",
  heading: "Small device. Standard ports. PCI compliant.",
  deviceAlt: "The PapeX RDH: a small matte-black device with a green status light and a PapeX label on top.",
  points: [
    "Plugs into standard POS ports: USB, serial or Ethernet. No terminal modification.",
    "Two installation modes: printer replacement or parallel install.",
  ],
  complianceText: "PCI DSS compliant out of the box:",
  complianceLinkLabel: "see documentation",
} as const

export const dashboard = {
  // `pill`/`emailPlaceholder`/`ctaLabel`/`placeholderLabel` are kept even
  // though DashboardPreview.tsx no longer renders them (the "Coming soon"
  // pill and notify form are gone per the prototype delta) — they still back
  // DashboardNotifyForm.tsx, which stays in the tree unused rather than
  // deleted, matching this path's additive-only rule.
  pill: "Coming soon",
  eyebrow: "Included, free",
  heading: "A dashboard for your digital receipts.",
  lead: "Every receipt the RDH sends is searchable the moment it lands. See what's selling, when you're busy, and how many customers are taking the digital copy.",
  dashboardAlt:
    "The PapeX merchant dashboard, showing transaction count, gross, average ticket and tap rate, with charts of busiest hours and days and a ranked list of top items.",
  placeholderLabel: "[ merchant dashboard mockup ]",
  emailPlaceholder: "Work email",
  ctaLabel: "Notify me",
  columns: [
    {
      title: "Every receipt, searchable",
      body: "Filter by amount, item, card or date. Open any receipt exactly as the customer saw it.",
    },
    {
      title: "Know your busiest hours",
      body: "Volume by hour and by weekday, plus the items that actually move. Staff to the real curve.",
    },
    {
      title: "Watch your devices",
      body: "Every RDH box and when it last checked in, so a quiet register never goes unnoticed.",
    },
  ],
} as const

export const demo = {
  eyebrow: "Get started",
  heading: "Request a demo.",
  body: "See the RDH in action and get set up, free for qualified merchants.",
  phonePrefix: "Or call us:",
  phone: "415-261-8675",
  submitLabel: "Request a demo",
  submitLabelPending: "Sending…",
  successMessage: "Thanks, we've got your request. We'll be in touch shortly to set up your demo.",
  errorMessage: "Something went wrong sending your request. Please try again, or call us directly.",
} as const
