// app/app-support/page.tsx
//
// Consumer support page for the PapeX iOS app. This is the "Support URL"
// referenced from the App Store listing (App Store Connect > App Information).
// It is intentionally separate from /support, which is the MERCHANT/RDH
// hardware help hub — different audience, different content.
//
// Keep this minimal: an email contact and a few true, verified FAQ items.
// Do not add features here that aren't confirmed in the app.

import type { Metadata } from 'next'
import Link from 'next/link'
import { FramerPageShell } from '@/components/framer/framer-page-shell'

export const metadata: Metadata = {
  title: 'PapeX App Support',
  description: 'Support for the PapeX iOS app. Email support@papex.app for help with your account, receipts, or the app.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://papex.app/app-support' },
}

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'How do I delete my account?',
    a: 'In the app, go to Settings > Advanced Settings > Delete Account.',
  },
  {
    q: 'How do I forward email receipts into the app?',
    a: "Forward receipt emails to the PapeX email address shown on your Account screen in the app.",
  },
  {
    q: 'Where is the privacy policy?',
    a: (
      <>
        See our{' '}
        <Link
          href="/privacy"
          className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
        >
          Privacy Policy
        </Link>
        .
      </>
    ),
  },
]

export default function AppSupportPage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-10 px-4">
        <div className="mx-auto max-w-2xl space-y-10">
          <header className="space-y-3 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff9933]">
              PapeX App
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62] leading-tight">
              PapeX App Support
            </h1>
            <p className="text-lg text-[#0a3d62]/70 leading-relaxed">
              Need help with the PapeX app? Email us at{' '}
              <a
                href="mailto:support@papex.app"
                className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
              >
                support@papex.app
              </a>{' '}
              and we&rsquo;ll get back to you.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">FAQ</h2>
            <div className="space-y-3">
              {FAQS.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-[#0a3d62]/15 bg-white p-5 open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[#0a3d62]">
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="text-[#ff9933] transition-transform group-open:rotate-45 text-xl leading-none"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[#0a3d62]/80 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </FramerPageShell>
  )
}
