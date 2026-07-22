// app/support/page.tsx
//
// Merchant support hub for the PapeX Receipt Delivery Hardware (RDH).
// Referenced from the merchant guide pamphlet footer, the hardware label,
// and the footer of merchant-facing documents. A merchant lands here because
// something isn't working or they have a question — get them to the answer fast.
//
// Copy (status light, troubleshooting, do's/don'ts, "If a Customer Asks...")
// is the authoritative merchant-facing wording provided by PapeX. Light
// behaviors also match the RDH firmware state machine
// (Papex_RDH_Firmware/src/state_machine.c).

import type { Metadata } from 'next'
import Link from 'next/link'
import { FramerPageShell } from '@/components/framer/framer-page-shell'

export const metadata: Metadata = {
  title: 'PapeX Merchant Support',
  description:
    'Support and troubleshooting for your PapeX Receipt Delivery Hardware (RDH). Status light guide, common issues, and contact info.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://papex.app/support' },
}

type Signal = 'normal' | 'attention'

const LIGHT_ROWS: {
  light: string
  color: 'green' | 'red' | 'off'
  blink?: 'slow' | 'fast'
  meaning: string
  detail: string
  signal: Signal
}[] = [
  {
    light: 'Solid green',
    color: 'green',
    meaning: 'Ready to tap',
    detail: 'Receipt ready. Customer taps now.',
    signal: 'normal',
  },
  {
    light: 'Off',
    color: 'off',
    meaning: 'Idle',
    detail: 'Waiting for next receipt. Normal.',
    signal: 'normal',
  },
  {
    light: 'Slow red blink',
    color: 'red',
    blink: 'slow',
    meaning: 'WiFi setup',
    detail: 'Needs credentials. Call PapeX.',
    signal: 'attention',
  },
  {
    light: 'Solid red',
    color: 'red',
    meaning: 'Connecting',
    detail: 'Joining WiFi. Wait 15–30s.',
    signal: 'attention',
  },
  {
    light: 'Slow red blink',
    color: 'red',
    blink: 'slow',
    meaning: 'NFC fix',
    detail: 'Self-recovering. Wait 10–15s.',
    signal: 'attention',
  },
  {
    light: 'Fast red blink',
    color: 'red',
    blink: 'fast',
    meaning: 'Error',
    detail: 'Unplug, wait 10s, replug.',
    signal: 'attention',
  },
  {
    light: 'Off',
    color: 'off',
    meaning: 'Booting',
    detail: 'Starting up. Wait 30–60s.',
    signal: 'normal',
  },
]

const SIGNAL_STYLES: Record<Signal, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'text-green-700' },
  attention: { label: 'Attention', className: 'text-red-600' },
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
    return <span className={`${base} bg-gray-300`} aria-hidden />
  }
  const fill = color === 'green' ? 'bg-green-500' : 'bg-red-500'
  const anim = blink ? 'animate-pulse' : ''
  return <span className={`${base} ${fill} ${anim}`} aria-hidden />
}

const TROUBLESHOOTING: { title: string; steps: string[] }[] = [
  {
    title: 'Customer tapped but nothing happened',
    steps: [
      'Make sure their phone has NFC enabled (most modern phones do by default).',
      'Ask the customer to hold their phone flat against the device for 2–3 seconds.',
      'Phone cases can block NFC. Try without the case.',
      'If the App Clip opened but no receipt appeared, it may still be processing. It will show up in a few seconds.',
    ],
  },
  {
    title: 'Customer says the App Clip is stuck loading',
    steps: [
      'This is normal. The receipt is being processed. It typically appears within a few seconds.',
      'If it takes more than 30 seconds, offer to reprint from your POS.',
    ],
  },
  {
    title: 'Light is blinking red',
    steps: [
      'Slow blink: may need WiFi setup or is self-recovering. Wait 30 seconds.',
      'Fast blink: power-cycle. Unplug, wait 10 seconds, plug back in.',
      'Still fast after restart? Call PapeX support.',
    ],
  },
  {
    title: 'No light, device unresponsive',
    steps: [
      "Check it's plugged in securely.",
      'Try a different USB port or cable.',
      'Still nothing? Call PapeX support.',
    ],
  },
  {
    title: 'No paper receipts (printer replacement only)',
    steps: [
      'Expected. Receipts are digital now.',
      'Use your POS reprint function if you need paper for a specific transaction.',
    ],
  },
]

const DOS: string[] = [
  'Keep the device plugged in and powered on at all times',
  'Tell customers they can tap for a digital receipt',
  'Keep your merchant guide near your POS for reference',
  'Call PapeX support if anything seems off',
  'Let PapeX know if you change your WiFi network or password',
  'Contact PapeX before switching POS systems or terminals',
]

const DONTS: string[] = [
  'Don’t unplug or move the device without contacting PapeX',
  'Don’t open, disassemble, or modify the device',
  'Don’t pour liquids on or near the device',
  'Don’t place stickers, tape, or objects on top of the device',
  'Don’t move the device to a different POS station without contacting PapeX',
]

const CUSTOMER_QA: { q: string; a: React.ReactNode }[] = [
  {
    q: '“What’s that thing?”',
    a: 'It’s a digital receipt reader. When you’re done paying, you can tap your phone on it and your receipt goes straight to your phone.',
  },
  {
    q: '“How does it work?”',
    a: 'Just tap your phone on it after you pay. A little window pops up on your screen with your receipt. That’s it.',
  },
  {
    q: '“Do I need to download an app?”',
    a: 'Nope, your receipt pops up right away. But if you want to keep all your receipts in one place, you can download the full app from there. It lets you search, organize, track expenses, all that.',
  },
  {
    q: '“Is there an app?”',
    a: 'Yeah, it’s free. It keeps all your digital receipts in one place so you can search them, organize them, track expenses, or pull one up if you need to do a return. You can download it from the App Store.',
  },
  {
    q: '“Is it free?”',
    a: 'Yep, totally free. It just sends your receipt to your phone instead of printing it.',
  },
  {
    q: '“Is my info safe?”',
    a: 'It only sends you your receipt. It doesn’t collect any personal info or card details.',
  },
  {
    q: '“Can I still get a paper receipt?”',
    a: (
      <>
        <span className="block">
          <span className="font-semibold text-[#0a3d62]">Printer Replacement:</span> We went
          digital, but I can reprint one from the register if you need it.
        </span>
        <span className="mt-1 block">
          <span className="font-semibold text-[#0a3d62]">Inline Extension:</span> Yep, you’ll still
          get a paper one too. The tap is just if you want it on your phone.
        </span>
      </>
    ),
  },
  {
    q: '“What if it didn’t work / nothing happened?”',
    a: 'Try holding your phone flat against it for a couple seconds. Sometimes a phone case can block it too. If the little green light isn’t on, it means it’s still loading and you can try again in a sec.',
  },
  {
    q: '“Does it work with my phone?”',
    a: 'It works with iPhones and most Androids. Pretty much any phone made in the last few years.',
  },
]

function ContactBlock() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <a
        href="mailto:support@papex.app"
        className="group rounded-2xl border border-[#0a3d62]/15 bg-white p-6 shadow-sm transition hover:border-[#ff9933] hover:shadow-md"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0a3d62]/50">Email us</p>
        <p className="mt-2 text-2xl font-bold text-[#0a3d62] group-hover:text-[#ff9933] transition">
          support@papex.app
        </p>
      </a>
      <a
        href="tel:+14152618675"
        className="group rounded-2xl border border-[#0a3d62]/15 bg-white p-6 shadow-sm transition hover:border-[#ff9933] hover:shadow-md"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0a3d62]/50">Call us</p>
        <p className="mt-2 text-2xl font-bold text-[#0a3d62] group-hover:text-[#ff9933] transition">
          415-261-8675
        </p>
      </a>
    </div>
  )
}

export default function SupportPage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Header */}
          <header className="space-y-3 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff9933]">
              PapeX RDH
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62] leading-tight">
              Merchant Support
            </h1>
            <p className="text-lg text-[#0a3d62]/70 leading-relaxed">
              Everything you need for your PapeX RDH.
            </p>
          </header>

          {/* Contact — prominent, top of page */}
          <ContactBlock />

          {/* Status Light */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Status Light</h2>
            <p className="text-[#0a3d62]/70 leading-relaxed">
              Your RDH has one visible status light. Here&rsquo;s what each state means:
            </p>
            <div className="overflow-x-auto rounded-2xl border border-[#0a3d62]/15">
              <table className="w-full min-w-[38rem] text-sm">
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
                          {row.detail}
                        </td>
                        <td className="px-4 py-3 border-b border-[#0a3d62]/10">
                          <span className={`font-semibold ${sig.className}`}>{sig.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border-l-4 border-[#ff9933] bg-[#ff9933]/[0.06] px-5 py-3">
              <p className="text-[#0a3d62] font-medium">
                <span className="font-semibold">Quick rule:</span> Green = tap now. Off = normal. Red
                = check the table.
              </p>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Troubleshooting</h2>
            <div className="space-y-3">
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
                  <ul className="mt-4 space-y-2 pl-1">
                    {item.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-[#0a3d62]/80 leading-relaxed">
                        <span
                          aria-hidden
                          className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#ff9933]"
                        />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          {/* Do's and Don'ts */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">Do&rsquo;s and Don&rsquo;ts</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6">
                <h3 className="text-lg font-semibold text-green-700">Do</h3>
                <ul className="mt-4 space-y-3">
                  {DOS.map((item) => (
                    <li key={item} className="flex gap-3 text-[#0a3d62]/85 leading-relaxed">
                      <span aria-hidden className="mt-0.5 font-bold text-green-600">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
                <h3 className="text-lg font-semibold text-red-600">Don&rsquo;t</h3>
                <ul className="mt-4 space-y-3">
                  {DONTS.map((item) => (
                    <li key={item} className="flex gap-3 text-[#0a3d62]/85 leading-relaxed">
                      <span aria-hidden className="mt-0.5 font-bold text-red-500">
                        ✕
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* If a Customer Asks... */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">If a Customer Asks&hellip;</h2>
            <p className="text-[#0a3d62]/70 leading-relaxed">
              Quick answers you can give at the counter.
            </p>
            <div className="space-y-3">
              {CUSTOMER_QA.map((item) => (
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
                  <div className="mt-4 text-[#0a3d62]/85 leading-relaxed">{item.a}</div>
                </details>
              ))}
            </div>
          </section>

          {/* PCI Compliance */}
          <section className="rounded-2xl border border-[#0a3d62]/15 bg-[#0a3d62]/[0.03] p-6">
            <h2 className="text-lg font-semibold text-[#0a3d62]">PCI Compliance</h2>
            <p className="mt-2 text-[#0a3d62]/80 leading-relaxed">
              Your PapeX RDH is a POS peripheral device that does not store, process, or transmit
              cardholder data. Full PCI DSS documentation is available at papex.app/pci.
            </p>
            <Link
              href="/pci"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0a3d62] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a3d62]/90"
            >
              View PCI compliance statement
              <span aria-hidden>&rarr;</span>
            </Link>
          </section>

          {/* Footer contact block repeated */}
          <footer className="border-t border-[#0a3d62]/10 pt-8 space-y-4">
            <h2 className="text-lg font-semibold text-[#0a3d62]">Contact PapeX</h2>
            <ContactBlock />
          </footer>
        </div>
      </div>
    </FramerPageShell>
  )
}
