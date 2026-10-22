// app/pci/page.tsx
//
// Public PCI DSS scoping page for PapeX: the PapeX sticker (RDS, Receipt
// Delivery Sticker) at each register plus the receipt integration with the
// merchant's POS. When a PCI assessor (QSA/ISA) or a merchant's compliance
// reviewer asks how PapeX should be scoped, this is what they read.
//
// Web 2.4 (2026-10-21): rewritten for the sticker. The old RDH box (Wi-Fi,
// peripheral ports, printer replacement or parallel install, firmware) is
// gone, so is everything that depended on it. Facts used: an NFC sticker per
// register, mailed laminated with simple instructions; receipts come from the
// store's POS through an integration (with most POS systems, an API key from
// the store and from the POS); nothing is installed on the merchant's
// network, POS or payment terminal; PapeX doesn't store, process or transmit
// card data. Don't name a POS.
//
// The scope letter in the merchant kit (PapeX > Sales > Strategy >
// Installation Kit > 4. PapeX_PCI_Scope_Letter.docx) still describes the RDH
// and needs the same rewrite; until then this page is the current version.
//
// Intentionally sober/official — no marketing. An assessor is reading this to
// establish how PapeX should be scoped. The page supplies facts and certifies
// nothing: it deliberately does NOT assert a scoping outcome, which belongs to
// the merchant and their assessor.

import type { Metadata } from 'next'
import Link from 'next/link'
import { FramerPageShell } from '@/components/framer/framer-page-shell'
import { SALES_PHONE, SALES_PHONE_HREF } from '@/components/brand/links'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'

const OG_ALT =
  'The PapeX logo and the words Your receipt, one tap away, beside an iPhone showing a PapeX receipt'

export const metadata: Metadata = {
  title: 'PCI DSS Scoping Statement | PapeX',
  description:
    'PCI DSS scoping statement for the PapeX sticker and POS receipt integration, for qualified security assessors and compliance reviews.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://papex.app/pci' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app/pci',
    siteName: 'PapeX',
    title: 'PCI DSS Scoping Statement | PapeX',
    description: 'PCI DSS scoping statement for the PapeX sticker and POS receipt integration, for qualified security assessors and compliance reviews.',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PCI DSS Scoping Statement | PapeX',
    description: 'PCI DSS scoping statement for the PapeX sticker and POS receipt integration, for qualified security assessors and compliance reviews.',
    images: [DEFAULT_OG_IMAGE],
  },
}

const SPECS: { label: string; value: string; emphasis?: boolean }[] = [
  {
    label: 'Product',
    value:
      'The PapeX sticker (Receipt Delivery Sticker), one per register, and a receipt integration with the merchant’s POS',
  },
  { label: 'Provider', value: 'PapeX, Inc.' },
  {
    label: 'At the Register',
    value:
      'A laminated NFC sticker. No power source, battery, cables, network connection or card reader.',
  },
  {
    label: 'How Receipts Reach PapeX',
    value:
      'From the merchant’s POS, through an integration. With most POS systems, it is authorized by an API key from the merchant and from the POS.',
  },
  {
    label: 'Installed at the Merchant',
    value:
      'Nothing. No PapeX hardware or software on the merchant’s network, POS terminals or payment terminals.',
  },
  {
    label: 'Data Received',
    value: 'Receipt data for completed sales: what a printed receipt shows.',
  },
  {
    label: 'Data Delivered',
    value:
      'The digital receipt, opened on the customer’s phone after a tap: an App Clip on iPhone, a web page on Android. No download.',
  },
  { label: 'Cardholder Data Stored', value: 'None', emphasis: true },
  { label: 'Cardholder Data Processed', value: 'None', emphasis: true },
  { label: 'Cardholder Data Transmitted', value: 'None', emphasis: true },
  {
    label: 'Card Number',
    value:
      'At most the last 4 digits, as printed on standard receipts per card network rules. Never the full card number.',
  },
  {
    label: 'PIN / CVV / Track Data',
    value: 'Never received, stored, or transmitted',
    emphasis: true,
  },
  {
    label: 'Payment Terminal Changes',
    value: 'None. Nothing is connected to, opened or altered on the payment terminal.',
  },
]

const ASSESSOR_POINTS: string[] = [
  'The PapeX sticker at each register is a laminated NFC sticker with no power source, battery, cables or network connection.',
  'The sticker has no card-reading capability (no magnetic stripe reader, chip reader, or contactless payment reader).',
  'Nothing from PapeX is connected to the payment terminal or the POS hardware. The payment terminal’s tamper-evident seals, screws, and enclosure are intact and unmodified.',
  'No PapeX hardware or software is installed on the merchant’s network, POS terminals or payment terminals.',
  'Receipt data reaches PapeX only through the POS integration, authorized by an API key from the merchant’s POS account, which the merchant controls.',
  'The only thing a customer gets from a tap is the digital receipt, which shows at most the last 4 digits of the card.',
]

export default function PciCompliancePage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-10 px-5 sm:px-4">
        <article className="mx-auto max-w-4xl bg-white border border-[#00121D]/10 rounded-2xl shadow-sm p-6 sm:p-8 md:p-12 space-y-10">
          {/* Header */}
          <header className="space-y-4 border-b border-[#00121D]/10 pb-8">
            <p className="text-[13px] leading-[18px] font-semibold uppercase tracking-[0.16em] text-[#EB7100]">
              PapeX, Inc. — Card-data scope
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#00121D] leading-tight">
              PCI DSS Scoping Statement
            </h1>
            <p className="text-lg text-[#00121D]/80 font-medium">
              The PapeX sticker (Receipt Delivery Sticker) and POS receipt integration
            </p>
            <p className="text-sm text-[#00121D]/60">
              For presentation during PCI DSS compliance reviews and assessments.
            </p>
          </header>

          {/* Purpose */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#00121D]">Purpose of This Document</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              This document is provided by PapeX, Inc. to merchants who use PapeX at their point of
              sale. It is intended to be presented to Qualified Security Assessors (QSAs), Internal
              Security Assessors (ISAs), or any party conducting a PCI DSS compliance review of the
              merchant&rsquo;s environment.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              It explains what PapeX puts at the register, how receipt data reaches PapeX, what data
              PapeX handles, and the facts relevant when the merchant&rsquo;s Cardholder Data
              Environment (CDE) and PCI DSS scope are determined.
            </p>
          </section>

          {/* What is PapeX */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#00121D]">What Is PapeX?</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              PapeX delivers a digital receipt to the customer&rsquo;s phone with one tap. It has two
              parts:
            </p>
            <ul className="space-y-3 pl-1">
              <li className="text-[#00121D]/80 leading-relaxed">
                <span className="font-semibold text-[#00121D]">The PapeX sticker:</span> a laminated
                NFC sticker, one per register, mailed to the merchant with simple instructions. It
                has no power source, battery, cables or network connection, and it is not connected
                to the POS or the payment terminal. When a customer holds a phone to it, the phone
                opens the receipt: an App Clip on iPhone, a web page on Android. Nothing is
                downloaded.
              </li>
              <li className="text-[#00121D]/80 leading-relaxed">
                <span className="font-semibold text-[#00121D]">The POS receipt integration:</span>{' '}
                receipts reach PapeX from the merchant&rsquo;s POS through an integration. With most
                POS systems, the integration is authorized by an API key from the merchant and from
                the POS. PapeX receives the receipt for each completed sale; the POS and its payment
                provider handle the card payment itself.
              </li>
            </ul>
            <p className="text-[#00121D]/80 leading-relaxed">
              No PapeX hardware or software is installed on the merchant&rsquo;s network, POS
              terminals or payment terminals. Setup is connecting the POS integration and placing the
              stickers, and takes about 5 minutes.
            </p>
          </section>

          {/* At a glance */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">At a Glance</h2>
            <div className="overflow-x-auto rounded-xl border border-[#00121D]/15">
              <table className="w-full text-sm">
                <tbody>
                  {SPECS.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i % 2 === 0 ? 'bg-[#00121D]/[0.03]' : 'bg-white'}
                    >
                      <th scope="row" className="w-1/3 min-w-[7.5rem] sm:min-w-[10rem] text-left align-top px-3 sm:px-4 py-3 font-semibold text-[#00121D] border-b border-[#00121D]/10">
                        {row.label}
                      </th>
                      <td
                        className={`px-3 sm:px-4 py-3 align-top border-b border-[#00121D]/10 ${
                          row.emphasis
                            ? 'font-semibold text-[#00121D]'
                            : 'text-[#00121D]/80'
                        }`}
                      >
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scope Analysis */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">PCI DSS Scope Analysis</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              Under PCI DSS v4.0.1, a system component is in scope for PCI DSS if it stores,
              processes, or transmits cardholder data (CHD) or sensitive authentication data (SAD),
              or if it is connected to or could affect the security of the Cardholder Data Environment
              (CDE).
            </p>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#00121D]">
                PapeX does not store, process, or transmit CHD or SAD.
              </h3>
              <p className="text-[#00121D]/80 leading-relaxed">
                The POS and its payment provider handle the card. PapeX only receives the receipt.
                Per card network operating regulations (Visa, Mastercard, American Express,
                Discover), receipts must not contain the full PAN: they show at most the last four
                digits of the card number, the card brand, and the transaction amount. PapeX never
                receives full PAN, CVV/CVC, PIN, or magnetic stripe/chip track data.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#00121D]">
                The PapeX sticker is not a connected system.
              </h3>
              <p className="text-[#00121D]/80 leading-relaxed">
                The sticker has no power source, no network connection, and no connection to the
                POS, the payment terminal or any other device in the merchant&rsquo;s environment. It
                cannot read cards. Its only function is to let a customer&rsquo;s phone open the
                digital receipt with a tap.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#00121D]">
                Nothing from PapeX is installed in the merchant&rsquo;s environment.
              </h3>
              <p className="text-[#00121D]/80 leading-relaxed">
                Receipt data reaches PapeX through the merchant&rsquo;s POS integration, not through
                any device or software on the merchant&rsquo;s network. The integration is authorized
                by an API key from the merchant&rsquo;s POS account, which the merchant controls like
                any other third-party integration.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#00121D]">
                PapeX does not modify the payment terminal.
              </h3>
              <p className="text-[#00121D]/80 leading-relaxed">
                Setup does not involve the payment terminal at all: no enclosure opened, no
                tamper-evident seals broken, no firmware altered, and no Point of Interaction (POI)
                device modified. PCI DSS Requirement 9.5 (protection of POI devices from tampering
                and unauthorized substitution) is not implicated because the payment terminal is not
                altered.
              </p>
            </div>
          </section>

          {/* Classification */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#00121D]">Classification</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              The PapeX sticker is a{' '}
              <span className="font-semibold text-[#00121D]">passive NFC label</span>, comparable
              to a printed sign or QR code at the counter. The PapeX service is a{' '}
              <span className="font-semibold text-[#00121D]">receipt integration</span> connected to
              the merchant&rsquo;s POS that receives receipt data only.
            </p>
            <div className="rounded-xl border-l-4 border-[#EB7100] bg-[#EB7100]/[0.06] px-5 py-4">
              <p className="text-[#00121D] leading-relaxed font-medium">
                PapeX does not store, process, or transmit cardholder data or sensitive
                authentication data. The PapeX sticker has no power, network connection or
                card-reading capability, and no PapeX hardware or software is installed in the
                merchant&rsquo;s environment. How the POS integration is treated in the
                merchant&rsquo;s assessment is a determination for the merchant and their assessor.
                This document is provided to give that assessment the technical facts it requires.
              </p>
            </div>
          </section>

          {/* Guidance for Assessors */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">Guidance for Assessors</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              During a PCI DSS assessment or inspection, assessors may verify the following about the
              PapeX setup:
            </p>
            <ul className="space-y-3">
              {ASSESSOR_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-[#00121D]/80 leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#EB7100]"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Contact */}
          <section className="space-y-4 border-t border-[#00121D]/10 pt-8">
            <h2 className="text-2xl font-semibold text-[#00121D]">Contact Information</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              For questions about this document or PapeX, please contact:
            </p>
            <div className="rounded-xl border border-[#00121D]/15 bg-[#00121D]/[0.03] px-5 py-4 space-y-1">
              <p className="font-semibold text-[#00121D]">PapeX, Inc.</p>
              <p className="text-[#00121D]/80">San Francisco, CA</p>
              <p className="text-[#00121D]/80">
                Email:{' '}
                <a
                  href="mailto:support@papex.app"
                  className="text-[#EB7100] underline decoration-transparent hover:decoration-[#EB7100] transition"
                >
                  support@papex.app
                </a>
              </p>
              <p className="text-[#00121D]/80">
                Phone:{' '}
                <a
                  href={SALES_PHONE_HREF}
                  className="text-[#EB7100] underline decoration-transparent hover:decoration-[#EB7100] transition"
                >
                  {SALES_PHONE}
                </a>
              </p>
            </div>
            <p className="text-sm text-[#00121D]/70 leading-relaxed">
              Merchants: for help with the PapeX sticker and quick fixes, visit{' '}
              <Link
                href="/support"
                className="text-[#EB7100] underline decoration-transparent hover:decoration-[#EB7100] transition"
              >
                papex.app/support
              </Link>
              .
            </p>
          </section>

          {/* Page content inside <main>, not a document landmark — SiteFooter
              (FramerPageShell) is the page's real <footer>, so this stays a
              <section> to keep exactly one footer landmark. */}
          <section className="border-t border-[#00121D]/10 pt-6">
            <p className="text-[13px] leading-[18px] text-[#00121D]/50 uppercase tracking-wide">
              PapeX, Inc. — Provided to merchants for their PCI DSS review.
            </p>
          </section>
        </article>
      </div>
    </FramerPageShell>
  )
}
