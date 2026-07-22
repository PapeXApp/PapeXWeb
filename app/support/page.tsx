// app/support/page.tsx
//
// Merchant support hub for the PapeX Receipt Delivery Hardware (RDH).
// Referenced from the merchant guide pamphlet footer, the hardware label,
// and the footer of merchant-facing documents. A merchant lands here because
// something isn't working or they have a question — get them to the answer fast.
//
// Status-light table and troubleshooting topics mirror the merchant guide
// pamphlet (RDH Kit > 5. PapeX_Merchant_Guide_Pamphlet.pdf). Keep in sync with
// that document; the light behaviors also match the RDH firmware state machine
// (Papex_RDH_Firmware/src/state_machine.c).

import type { Metadata } from 'next'
import Link from 'next/link'
import { FramerPageShell } from '@/components/framer/framer-page-shell'

export const metadata: Metadata = {
  title: 'RDH Merchant Support — PapeX',
  description:
    'Support for the PapeX Receipt Delivery Hardware (RDH): contact PapeX, read the status light guide, and troubleshoot common issues.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://papex.app/support' },
}

type Signal = 'normal' | 'wait' | 'call'

const LIGHT_ROWS: {
  light: string
  color: 'green' | 'red' | 'off'
  blink?: 'slow' | 'fast'
  meaning: string
  action: string
  signal: Signal
}[] = [
  {
    light: 'Solid green',
    color: 'green',
    meaning: 'Ready to tap',
    action: 'Normal — the device is ready for a customer tap.',
    signal: 'normal',
  },
  {
    light: 'Off',
    color: 'off',
    meaning: 'Idle',
    action: 'Normal — the device rests with the light off between receipts.',
    signal: 'normal',
  },
  {
    light: 'Slow red blink',
    color: 'red',
    blink: 'slow',
    meaning: 'Needs Wi-Fi setup',
    action: 'Call PapeX — the device needs its Wi-Fi configured.',
    signal: 'call',
  },
  {
    light: 'Solid red',
    color: 'red',
    meaning: 'Connecting to Wi-Fi',
    action: 'Wait 15–30 seconds while the device connects.',
    signal: 'wait',
  },
  {
    light: 'Slow red blink',
    color: 'red',
    blink: 'slow',
    meaning: 'NFC self-recovering',
    action: 'Wait 10–15 seconds — the device is recovering on its own.',
    signal: 'wait',
  },
  {
    light: 'Fast red blink',
    color: 'red',
    blink: 'fast',
    meaning: 'Error',
    action: 'Power-cycle: unplug, wait 10 seconds, plug back in.',
    signal: 'wait',
  },
  {
    light: 'Off',
    color: 'off',
    meaning: 'Booting',
    action: 'Wait 30–60 seconds for the device to finish starting up.',
    signal: 'wait',
  },
]

const SIGNAL_STYLES: Record<Signal, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'bg-green-100 text-green-800' },
  wait: { label: 'Wait', className: 'bg-amber-100 text-amber-800' },
  call: { label: 'Call PapeX', className: 'bg-red-100 text-red-800' },
}

function LightDot({
  color,
  blink,
}: {
  color: 'green' | 'red' | 'off'
  blink?: 'slow' | 'fast'
}) {
  const base = 'inline-block h-3 w-3 rounded-full flex-shrink-0'
  if (color === 'off') {
    return <span className={`${base} border border-[#0a3d62]/30 bg-transparent`} aria-hidden />
  }
  const fill = color === 'green' ? 'bg-green-500' : 'bg-red-500'
  const anim = blink === 'fast' ? 'animate-pulse' : blink === 'slow' ? 'animate-pulse' : ''
  return <span className={`${base} ${fill} ${anim}`} aria-hidden />
}

const TROUBLESHOOTING: { title: string; steps: string[] }[] = [
  {
    title: 'Customer tapped but nothing happened',
    steps: [
      'Confirm the status light is solid green before the tap — that means the receipt is ready to deliver.',
      "Have the customer hold the top of their phone flat against the PapeX label for 1–2 seconds; NFC needs a moment to hand off.",
      'Make sure the customer’s phone has NFC on (iPhone XS and newer have it on by default; most modern Android phones need NFC enabled in settings).',
      'If the light was off, ring the sale through again so a fresh receipt is queued, then tap.',
      'Still nothing after two tries? Power-cycle the device (unplug, wait 10 seconds, replug) and try once more.',
    ],
  },
  {
    title: 'App Clip stuck loading',
    steps: [
      'Ask the customer to keep their phone still and near the device for a few seconds — a weak connection slows the first load.',
      'Have them check that Wi-Fi or cellular data is on; the App Clip needs a connection to pull the receipt.',
      'If it hangs, have them close the App Clip card and tap the device again to relaunch it.',
      'On older phones, opening the camera and pointing it at the counter QR sticker is a reliable fallback to the tap.',
    ],
  },
  {
    title: 'Light is blinking red',
    steps: [
      'Fast red blink means an error — power-cycle the device: unplug it, wait 10 seconds, and plug it back in. It should return to normal within a minute.',
      'Slow red blink can mean the device is self-recovering (wait 10–15 seconds) or that it needs Wi-Fi setup.',
      'Solid red means it is connecting to Wi-Fi — give it 15–30 seconds to finish.',
      'If a slow red blink does not clear on its own after a minute, the device needs Wi-Fi configured — call PapeX.',
    ],
  },
  {
    title: 'No light / device unresponsive',
    steps: [
      'Check that the device is plugged in and the power/USB cable is fully seated at both ends.',
      'If it is plugged into a POS port or powered hub, confirm that port has power (try the POS printer port or a known-good USB power adapter).',
      'A brand-new boot can take 30–60 seconds with the light off before it comes to life — give it a minute.',
      'If there is still no light after a minute on known-good power, contact PapeX for a replacement.',
    ],
  },
  {
    title: 'No paper receipts (Printer Replacement installs)',
    steps: [
      'This is expected on Printer Replacement installs — the RDH takes the place of the receipt printer and delivers receipts digitally via tap, so there is no paper.',
      'If a customer wants a paper copy, they can save the digital receipt to their phone or email it to themselves from the receipt view.',
      'If your install was meant to keep the paper printer (Inline Extension) and paper stopped printing, check the cable from the RDH to the printer, then contact PapeX.',
    ],
  },
]

export default function SupportPage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-10">
          {/* Header */}
          <header className="space-y-3 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff9933]">
              PapeX RDH — Merchant Support
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62] leading-tight">
              How can we help with your PapeX device?
            </h1>
            <p className="text-[#0a3d62]/70 leading-relaxed max-w-2xl">
              Reach a person, read the status light guide, or jump to a fix below. Most issues clear
              in under a minute.
            </p>
          </header>

          {/* Contact — prominent */}
          <section className="grid gap-4 sm:grid-cols-2">
            <a
              href="mailto:support@papex.app"
              className="group rounded-2xl border border-[#0a3d62]/15 bg-white p-6 shadow-sm transition hover:border-[#ff9933] hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0a3d62]/50">
                Email us
              </p>
              <p className="mt-2 text-2xl font-bold text-[#0a3d62] group-hover:text-[#ff9933] transition">
                support@papex.app
              </p>
              <p className="mt-1 text-sm text-[#0a3d62]/60">We reply as fast as we can.</p>
            </a>
            <a
              href="tel:+14152618675"
              className="group rounded-2xl border border-[#0a3d62]/15 bg-white p-6 shadow-sm transition hover:border-[#ff9933] hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0a3d62]/50">
                Call us
              </p>
              <p className="mt-2 text-2xl font-bold text-[#0a3d62] group-hover:text-[#ff9933] transition">
                415-261-8675
              </p>
              <p className="mt-1 text-sm text-[#0a3d62]/60">Talk to a PapeX team member.</p>
            </a>
          </section>

          {/* Status light reference */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Status light guide</h2>
            <p className="text-[#0a3d62]/70 leading-relaxed">
              The small light on the device tells you what it&rsquo;s doing. Here&rsquo;s what each
              pattern means.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-[#0a3d62]/15">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="bg-[#0a3d62] text-white">
                    <th className="px-4 py-3 text-left font-semibold">Light</th>
                    <th className="px-4 py-3 text-left font-semibold">Means</th>
                    <th className="px-4 py-3 text-left font-semibold">What to do</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {LIGHT_ROWS.map((row, i) => {
                    const sig = SIGNAL_STYLES[row.signal]
                    return (
                      <tr
                        key={`${row.light}-${row.meaning}`}
                        className={i % 2 === 0 ? 'bg-white' : 'bg-[#0a3d62]/[0.03]'}
                      >
                        <td className="px-4 py-3 border-b border-[#0a3d62]/10">
                          <span className="flex items-center gap-2 font-medium text-[#0a3d62]">
                            <LightDot color={row.color} blink={row.blink} />
                            {row.light}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b border-[#0a3d62]/10 text-[#0a3d62]/80">
                          {row.meaning}
                        </td>
                        <td className="px-4 py-3 border-b border-[#0a3d62]/10 text-[#0a3d62]/80">
                          {row.action}
                        </td>
                        <td className="px-4 py-3 border-b border-[#0a3d62]/10">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${sig.className}`}
                          >
                            {sig.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Troubleshooting</h2>
            <div className="space-y-4">
              {TROUBLESHOOTING.map((item) => (
                <details
                  key={item.title}
                  className="group rounded-2xl border border-[#0a3d62]/15 bg-white p-5 open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[#0a3d62]">
                    <span>{item.title}</span>
                    <span
                      aria-hidden
                      className="text-[#ff9933] transition-transform group-open:rotate-45 text-xl leading-none"
                    >
                      +
                    </span>
                  </summary>
                  <ol className="mt-4 space-y-3 list-decimal pl-5">
                    {item.steps.map((step, i) => (
                      <li key={i} className="text-[#0a3d62]/80 leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </section>

          {/* Compliance / PCI link */}
          <section className="rounded-2xl border border-[#0a3d62]/15 bg-[#0a3d62]/[0.03] p-6">
            <h2 className="text-lg font-semibold text-[#0a3d62]">Compliance documentation</h2>
            <p className="mt-2 text-[#0a3d62]/80 leading-relaxed">
              Need the PCI DSS scope documentation for an assessor or inspection? It&rsquo;s the same
              statement linked from the QR code on the device label.
            </p>
            <Link
              href="/pci"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0a3d62] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a3d62]/90"
            >
              View PCI compliance statement
              <span aria-hidden>&rarr;</span>
            </Link>
          </section>

          <footer className="border-t border-[#0a3d62]/10 pt-6 text-center md:text-left">
            <p className="text-sm text-[#0a3d62]/60">
              Still stuck? Email{' '}
              <a
                href="mailto:support@papex.app"
                className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
              >
                support@papex.app
              </a>{' '}
              or call{' '}
              <a
                href="tel:+14152618675"
                className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
              >
                415-261-8675
              </a>
              .
            </p>
          </footer>
        </div>
      </div>
    </FramerPageShell>
  )
}
