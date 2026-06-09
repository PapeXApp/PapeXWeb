export const APP_DOWNLOAD_URL = "https://apps.apple.com/app/id6754945242"

export const FAQ_ITEMS = [
  {
    question: "Is my financial data secure with PapeX?",
    answer:
      "Yes. We use encryption in transit and at rest, strict access controls, and one-way tokenization where it makes sense so raw card data never sits in PapeX in a reversible form.",
  },
  {
    question: "Do I still need paper receipts?",
    answer:
      "Not for purchases PapeX captures automatically. Forward email receipts, scan paper ones when needed, and keep everything searchable in one place—without digging through wallets or shoeboxes.",
  },
  {
    question: "Which POS systems work today?",
    answer:
      "PapeX connects with major retail and restaurant POS platforms so digital receipts can flow straight to your phone after checkout. We're expanding integrations—contact us if you need a specific system.",
  },
  {
    question: "What does the app cost for consumers?",
    answer:
      "PapeX Free includes unlimited receipt capture, email and scan ingestion, and organization. Plus is $9.99/month for tax-ready exports and priority support. Teams plans are custom for multi-seat and accounting integrations.",
  },
] as const

export const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    features: ["Unlimited receipt capture", "Email and scan ingestion", "Organization and search"],
    ctaLabel: "Download the app",
    ctaType: "download" as const,
    featured: false,
    tag: undefined,
    ctaHref: undefined,
  },
  {
    name: "Plus",
    price: "$9.99",
    period: "/ month",
    features: ["Everything in Free", "Tax-ready exports", "Priority support"],
    ctaLabel: "Get Plus",
    ctaType: "link" as const,
    ctaHref: "/contact",
    featured: true,
    tag: "Exports",
  },
  {
    name: "Teams",
    price: "Custom",
    period: "pricing",
    features: ["Multi-seat administration", "Accounting integrations", "Dedicated onboarding"],
    ctaLabel: "Talk to sales",
    ctaType: "link" as const,
    ctaHref: "/contact",
    featured: false,
    tag: undefined,
  },
] as const

export const FEATURES_TOP = [
  {
    title: "Smart Organization",
    description: "Receipts are categorized, searchable, and stored in one place.",
    image: "/framer-assets/feature-smart-org.png",
    alt: "Receipt categories in the PapeX app",
  },
  {
    title: "Digital Receipt Delivery",
    description: "Skip paper receipts and access your purchases digitally.",
    image: "/framer-assets/feature-digital-delivery.png",
    alt: "Digital receipt on phone",
  },
  {
    title: "Tax & Expense Ready",
    description: "Ready for reimbursements, taxes and bookkeeping.",
    image: "/framer-assets/feature-tax-icon.svg",
    alt: "Tax-ready expense summary",
  },
] as const

export const FEATURES_BOTTOM = [
  {
    title: "Receipt Search & Retrieval",
    description: "Search by merchant, date, amount, or category.",
    image: "/framer-assets/feature-search.png",
    alt: "Receipt search interface",
  },
  {
    title: "Family Receipt Sharing",
    description: "Add family members and automatically share receipts.",
    image: "/framer-assets/feature-family-sharing.png",
    alt: "Family receipt sharing",
  },
] as const

export const HOW_STEPS = [
  {
    num: "01",
    title: "Forward Email Receipts",
    description:
      "Claim your unique PapeX email upon signup. Forward or send any receipt to that email and sit back while it appears instantly in your app.",
    image: "/framer-assets/how-step-1.png",
    alt: "Forward email receipts to PapeX",
  },
  {
    num: "02",
    title: "Scan Paper Receipts",
    description:
      "Photograph or upload any paper receipt into the app. PapeX extracts the data, categorizes it, and files it automatically.",
    image: "/framer-assets/how-step-2.png",
    alt: "Scan a paper receipt with your phone",
  },
  {
    num: "03",
    title: "Share Your Expenses in One Click",
    description:
      "Export all your receipts to your tax or expense management system. Never spend hours on manual entry again.",
    image: "/framer-assets/how-step-3.png",
    alt: "Export receipts to your expense system",
  },
] as const

export const INTEGRATION_LOGOS = [
  "/framer-assets/app-icon.png",
  "/framer-assets/integration-1.png",
  "/framer-assets/integration-2.png",
  "/framer-assets/integration-3.png",
  "/framer-assets/integration-4.png",
  "/framer-assets/integration-5.png",
  "/framer-assets/integration-bg.png",
] as const
