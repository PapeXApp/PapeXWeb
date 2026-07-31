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
  eyebrow: "For Business",
  heading: "Modernize your checkout. No cost. No hassle.",
  lead: "The RDH plugs into your existing POS and sends customers a digital receipt when they tap. Free hardware, free install, zero paper.",
  ctaLabel: "Request a Demo",
  ctaSubtext: "or call 415-261-8675",
  devicePlaceholderLabel: "[ RDH device photo ]",
  deviceCardTitle: "PapeX RDH",
  deviceTapLabel: "TAP TO RECEIVE RECEIPT",
} as const

export const whyMerchants = {
  eyebrow: "Why merchants love PapeX",
  heading: "Every reason to switch. None to say no.",
  cards: [
    {
      title: "Free forever",
      body: "The RDH device and installation cost merchants nothing. No hardware fees, no subscription.",
    },
    {
      title: "Works with your POS",
      body: "Connects through a standard port. No new system, no software change, no retraining.",
    },
    {
      title: "Customers love it",
      body: "Digital receipts are faster at the counter, greener, and more convenient for everyone.",
    },
    {
      title: "Cut paper & cost",
      body: "Stop buying thermal paper rolls. Stand out from competitors still printing waste.",
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
    "No contract.",
  ],
} as const

export const howItWorks = {
  heading: "Up and running the same afternoon.",
  steps: [
    {
      number: "01",
      title: "We install the RDH",
      body: "A small device fits right at your point of sale.",
    },
    {
      number: "02",
      title: "It connects to your POS",
      body: "Through a standard port — no terminal modification.",
    },
    {
      number: "03",
      title: "Customers tap",
      body: "They get a digital receipt instantly, no app required.",
    },
    {
      number: "04",
      title: "You track adoption",
      body: "A dashboard shows digital receipt uptake (coming soon).",
    },
  ],
} as const

export const rdhDevice = {
  eyebrow: "The RDH device",
  heading: "Small device. Standard ports. PCI compliant.",
  placeholderLabel: "[ RDH hardware render ]",
  points: [
    "Plugs into standard POS ports — USB, serial or Ethernet. No terminal modification.",
    "Two installation modes: printer replacement or inline extension.",
  ],
  complianceText: "PCI DSS compliant out of the box —",
  complianceLinkLabel: "see documentation",
} as const

export const dashboard = {
  pill: "Coming soon",
  heading: "A dashboard for your digital receipts.",
  placeholderLabel: "[ merchant dashboard mockup ]",
  emailPlaceholder: "Work email",
  ctaLabel: "Notify me",
} as const

export const demo = {
  eyebrow: "Get started",
  heading: "Request a demo.",
  body: "See the RDH in action and get set up — free for qualified merchants.",
  phonePrefix: "Or call us:",
  phone: "415-261-8675",
  submitLabel: "Request Demo",
  submitLabelPending: "Sending…",
  successMessage: "Thanks — we've got your request. We'll be in touch shortly to set up your demo.",
  errorMessage: "Something went wrong sending your request. Please try again, or call us directly.",
} as const
