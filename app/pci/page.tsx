// app/pci/page.tsx
//
// Public PCI DSS compliance page for the PapeX Receipt Delivery Hardware (RDH).
// The QR code printed on every RDH hardware label links here. When a PCI
// assessor (QSA/ISA) scans that QR, this is what they see: a web rendering of
// the "PCI DSS Scoping Statement" from the RDH merchant kit.
//
// Source of truth for the copy: PapeX > Sales > Strategy > Installation Kit >
// 4. PapeX_PCI_Scope_Letter.docx (a copy also lives in Sales > GTM > RDH Kit).
// The Word file wins on any disagreement — it is the version physically handed
// to merchants at install. Keep this page in sync with it.
//
// Intentionally sober/official — no marketing. An inspector is reading this to
// verify the device is legitimate and to establish how it should be scoped. The
// page supplies facts; it deliberately does NOT assert that the RDH is out of
// scope. The RDH joins the merchant's Wi-Fi, so it may be a connected-to system
// — that determination belongs to the merchant and their assessor.

import type { Metadata } from 'next'
import Link from 'next/link'
import { FramerPageShell } from '@/components/framer/framer-page-shell'

export const metadata: Metadata = {
  title: 'PCI DSS Scoping Statement',
  description:
    'PapeX Receipt Delivery Hardware (RDH) PCI DSS scoping documentation for qualified security assessors and compliance reviews.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://papex.app/pci' },
}

const SPECS: { label: string; value: string; emphasis?: boolean }[] = [
  { label: 'Device Name', value: 'PapeX Receipt Delivery Hardware (RDH)' },
  { label: 'Manufacturer', value: 'PapeX, Inc.' },
  {
    label: 'Connection Interface',
    value:
      'Merchant Wi-Fi (local network), and in some installations also USB, RS-232 Serial, or Ethernet (standard POS peripheral ports)',
  },
  {
    label: 'Data Received',
    value: 'Receipt print data stream (ESC/POS or equivalent print commands)',
  },
  {
    label: 'Data Output',
    value:
      'Digital receipt delivered to consumer device via NFC. Receipt records sent to the PapeX cloud service over HTTPS.',
  },
  { label: 'Cardholder Data Stored', value: 'None', emphasis: true },
  { label: 'Cardholder Data Processed', value: 'None', emphasis: true },
  { label: 'Cardholder Data Transmitted', value: 'None', emphasis: true },
  {
    label: 'PAN Handling',
    value:
      'Device receives only masked/truncated PAN (last 4 digits) as printed on standard receipts per card network rules',
  },
  {
    label: 'PIN / CVV / Track Data',
    value: 'Never received, stored, or transmitted',
    emphasis: true,
  },
  {
    label: 'Terminal Modification Required',
    value: 'None. No seals broken, no enclosure opened, no firmware altered.',
  },
  {
    label: 'Network Connectivity',
    value:
      "The RDH joins the merchant's local Wi-Fi network and must be reachable from the POS. Outbound traffic is limited to receipt records, firmware updates, and diagnostics sent to PapeX. It does not connect to a payment gateway or processor.",
  },
]

const ASSESSOR_POINTS: string[] = [
  'The device receives only receipt print data (ESC/POS or equivalent print commands) and has no mechanism to receive full PAN, CVV/CVC, PIN, or track data.',
  "The device connects to the merchant's local Wi-Fi network. Its outbound traffic goes to PapeX's cloud service over HTTPS and consists solely of receipt records, plus firmware update and diagnostic traffic.",
  "The payment terminal's tamper-evident seals, screws, and enclosure are intact and unmodified.",
  "The device is clearly labeled as 'PapeX Digital Receipt Module' or equivalent.",
  'The device does not have any card-reading capability (no magnetic stripe reader, chip reader, or contactless payment reader).',
  "The only wireless output to a customer is NFC, used to deliver the digital receipt to the customer's mobile device.",
  'The device is not interposed in the cable path between the payment terminal and any other device. In a parallel installation, the existing receipt printer retains its own direct connection to the POS.',
]

export default function PciCompliancePage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-10 px-4">
        <article className="mx-auto max-w-4xl bg-white border border-[#0a3d62]/10 rounded-2xl shadow-sm p-8 md:p-12 space-y-10">
          {/* Header */}
          <header className="space-y-4 border-b border-[#0a3d62]/10 pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff9933]">
              PapeX, Inc. — Compliance Documentation
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62] leading-tight">
              PCI DSS Scoping Statement
            </h1>
            <p className="text-lg text-[#0a3d62]/80 font-medium">
              PapeX Receipt Delivery Hardware (RDH)
            </p>
            <p className="text-sm text-[#0a3d62]/60">
              For presentation during PCI DSS compliance reviews and assessments.
            </p>
          </header>

          {/* Purpose */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Purpose of This Document</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              This document is provided by PapeX, Inc. to merchants who have installed the PapeX
              Receipt Delivery Hardware (RDH) at their point of sale. It is intended to be presented
              to Qualified Security Assessors (QSAs), Internal Security Assessors (ISAs), or any party
              conducting a PCI DSS compliance review of the merchant&rsquo;s environment.
            </p>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              This statement explains what the RDH device is, how it connects to the merchant&rsquo;s
              POS system and network, what data it handles, and how it should be treated when the
              merchant&rsquo;s Cardholder Data Environment (CDE) and PCI DSS scope are determined.
            </p>
          </section>

          {/* What is the RDH */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">What Is the PapeX RDH?</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              The PapeX Receipt Delivery Hardware is a peripheral module that connects to a
              merchant&rsquo;s point of sale environment over the merchant&rsquo;s local network
              (Wi-Fi), and in some installations also through a standard peripheral port (USB,
              RS-232 serial, or Ethernet). It serves one function: capturing the receipt print data
              stream and delivering it digitally to the customer via NFC tap.
            </p>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              The RDH is installed in one of two configurations:
            </p>
            <ul className="space-y-3 pl-1">
              <li className="text-[#0a3d62]/80 leading-relaxed">
                <span className="font-semibold text-[#0a3d62]">Printer Replacement:</span> The RDH
                replaces the existing receipt printer and connects to the same peripheral port the
                printer previously occupied.
              </li>
              <li className="text-[#0a3d62]/80 leading-relaxed">
                <span className="font-semibold text-[#0a3d62]">Parallel Install:</span> The RDH is
                installed alongside the existing receipt printer as an additional peripheral. The
                existing printer keeps its own direct connection to the POS and continues to
                function normally. The RDH is not placed in the cable path between the POS terminal
                and the printer or any other device.
              </li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              In both configurations the RDH joins the merchant&rsquo;s local Wi-Fi network. It uses
              that connection for three purposes: receiving the receipt print data stream from the
              POS, sending completed receipt records to PapeX&rsquo;s cloud service, and receiving
              firmware updates and remote diagnostics from PapeX. The RDH must therefore be
              reachable on the same network as the POS system that sends it print jobs.
            </p>
          </section>

          {/* Technical Specifications */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Device Technical Specifications</h2>
            <div className="overflow-x-auto rounded-xl border border-[#0a3d62]/15">
              <table className="w-full text-sm">
                <tbody>
                  {SPECS.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i % 2 === 0 ? 'bg-[#0a3d62]/[0.03]' : 'bg-white'}
                    >
                      <th className="w-1/3 min-w-[10rem] text-left align-top px-4 py-3 font-semibold text-[#0a3d62] border-b border-[#0a3d62]/10">
                        {row.label}
                      </th>
                      <td
                        className={`px-4 py-3 align-top border-b border-[#0a3d62]/10 ${
                          row.emphasis
                            ? 'font-semibold text-[#0a3d62]'
                            : 'text-[#0a3d62]/80'
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
            <h2 className="text-2xl font-semibold text-[#0a3d62]">PCI DSS Scope Analysis</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              Under PCI DSS v4.0.1, a system component is in scope for PCI DSS if it stores,
              processes, or transmits cardholder data (CHD) or sensitive authentication data (SAD),
              or if it is connected to or could affect the security of the Cardholder Data Environment
              (CDE).
            </p>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#0a3d62]">
                The RDH does not store, process, or transmit CHD or SAD.
              </h3>
              <p className="text-[#0a3d62]/80 leading-relaxed">
                The RDH receives only the receipt print data stream. Per card network operating
                regulations (Visa, Mastercard, American Express, Discover), printed receipts must not
                contain the full PAN. Receipts display only the last four digits of the card number,
                the card brand, and the transaction amount. The RDH never receives, and has no
                mechanism to receive, full PAN, CVV/CVC, PIN, or magnetic stripe/chip track data.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#0a3d62]">
                The RDH connects to the merchant&rsquo;s local network.
              </h3>
              <p className="text-[#0a3d62]/80 leading-relaxed">
                The RDH is not an isolated device. It joins the merchant&rsquo;s Wi-Fi and must be
                reachable from the POS system in order to receive print jobs. Where the
                merchant&rsquo;s POS network is part of, or connected to, the Cardholder Data
                Environment, the RDH should be treated as a connected-to system component and
                assessed accordingly. PapeX does not represent that the RDH is network-isolated.
                What the RDH does not do is store, process, or transmit cardholder data: the only
                payload it receives is the receipt print stream described above, and the only data
                it sends to PapeX is that receipt record. Where a merchant places the RDH on a
                network segment separated from the payment environment, and that segmentation is
                validated, the RDH falls outside the assessed scope on the same basis as any other
                segmented system.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#0a3d62]">
                The RDH does not modify the payment terminal.
              </h3>
              <p className="text-[#0a3d62]/80 leading-relaxed">
                Installation does not require opening the payment terminal enclosure, breaking
                tamper-evident seals, altering firmware, or modifying any Point of Interaction (POI)
                device. The RDH connects to the same external port that any receipt printer or POS
                peripheral would use. PCI DSS Requirement 9.5 (protection of POI devices from
                tampering and unauthorized substitution) is not implicated because the payment
                terminal is not altered.
              </p>
            </div>
          </section>

          {/* Device Classification */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Device Classification</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              The PapeX RDH is classified as a{' '}
              <span className="font-semibold text-[#0a3d62]">POS Peripheral Device</span>: a device
              adding functionality to a POS system (comparable to a receipt printer, barcode scanner,
              cash drawer, or customer-facing display) that connects via standard peripheral
              interfaces and does not interact with cardholder data or sensitive authentication data.
            </p>
            <div className="rounded-xl border-l-4 border-[#ff9933] bg-[#ff9933]/[0.06] px-5 py-4">
              <p className="text-[#0a3d62] leading-relaxed font-medium">
                The RDH does not store, process, or transmit cardholder data or sensitive
                authentication data, and it is not part of the Cardholder Data Environment. It is
                not a Point of Interaction device and has no card-reading capability. Because the
                RDH connects to the merchant&rsquo;s local network, whether it falls inside the
                assessed scope as a connected-to system depends on that merchant&rsquo;s network
                segmentation, and is a determination for the merchant and their assessor. This
                document is provided to give that assessment the technical facts it requires.
              </p>
            </div>
          </section>

          {/* Guidance for Assessors */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Guidance for Assessors</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              During a PCI DSS assessment or inspection, assessors may verify the following about the
              PapeX RDH installation:
            </p>
            <ul className="space-y-3">
              {ASSESSOR_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-[#0a3d62]/80 leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#ff9933]"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Contact */}
          <section className="space-y-4 border-t border-[#0a3d62]/10 pt-8">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Contact Information</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              For questions about this document or the PapeX RDH, please contact:
            </p>
            <div className="rounded-xl border border-[#0a3d62]/15 bg-[#0a3d62]/[0.03] px-5 py-4 space-y-1">
              <p className="font-semibold text-[#0a3d62]">PapeX, Inc.</p>
              <p className="text-[#0a3d62]/80">San Francisco, CA</p>
              <p className="text-[#0a3d62]/80">
                Email:{' '}
                <a
                  href="mailto:support@papex.app"
                  className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
                >
                  support@papex.app
                </a>
              </p>
              <p className="text-[#0a3d62]/80">
                Phone:{' '}
                <a
                  href="tel:+14152618675"
                  className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
                >
                  415-261-8675
                </a>
              </p>
            </div>
            <p className="text-sm text-[#0a3d62]/70 leading-relaxed">
              Merchants: for device help, status light meanings, and troubleshooting, visit{' '}
              <Link
                href="/support"
                className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
              >
                papex.app/support
              </Link>
              .
            </p>
          </section>

          <footer className="border-t border-[#0a3d62]/10 pt-6">
            <p className="text-xs text-[#0a3d62]/50 uppercase tracking-wide">
              PapeX, Inc. — Provided to merchant for PCI compliance documentation.
            </p>
          </footer>
        </article>
      </div>
    </FramerPageShell>
  )
}
