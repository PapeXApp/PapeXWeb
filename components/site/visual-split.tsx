'use client'

import { useState } from 'react'
import Link from 'next/link'

type Side = 'you' | 'business' | null

/**
 * The homepage fork. Two full-height panels — For You / For Business — that
 * respond to pointer: the hovered side widens and brightens while the other
 * recedes. On touch/mobile the flex interaction collapses to two stacked
 * panels (media query drives the layout; hover state simply no-ops).
 */
export function VisualSplit() {
  const [active, setActive] = useState<Side>(null)

  return (
    <section
      aria-label="Choose your path"
      className="rd-split relative w-full overflow-hidden"
      style={{ background: 'var(--navy)' }}
    >
      {/* center seam */}
      <div className="rd-split-seam" aria-hidden />

      <div className="rd-split-track">
        <Panel
          side="you"
          active={active}
          setActive={setActive}
          kicker="For You"
          title={<>Every receipt.<br />One place.<br />Zero effort.</>}
          copy="Tap at checkout and it's saved — searchable, organized, yours. No shoebox, no scanning."
          cta={{ href: '/for-you', label: 'See how it works' }}
          tone="warm"
          art={<ConsumerArt />}
        />
        <Panel
          side="business"
          active={active}
          setActive={setActive}
          kicker="For Business"
          title={<>Modernize<br />your checkout.<br />No cost.</>}
          copy="A small device on your existing POS turns every sale into a digital receipt your customers love."
          cta={{ href: '/for-business', label: 'Get the RDH' }}
          tone="cool"
          art={<MerchantArt />}
        />
      </div>
    </section>
  )
}

function Panel({
  side,
  active,
  setActive,
  kicker,
  title,
  copy,
  cta,
  tone,
  art,
}: {
  side: Exclude<Side, null>
  active: Side
  setActive: (s: Side) => void
  kicker: string
  title: React.ReactNode
  copy: string
  cta: { href: string; label: string }
  tone: 'warm' | 'cool'
  art: React.ReactNode
}) {
  const isActive = active === side
  const isDimmed = active !== null && active !== side

  const bg =
    tone === 'warm'
      ? 'radial-gradient(120% 90% at 20% 0%, rgba(235,113,0,0.28) 0%, rgba(235,113,0,0) 55%), #04202f'
      : 'radial-gradient(120% 90% at 80% 100%, rgba(20,64,90,0.7) 0%, rgba(20,64,90,0) 55%), #00121d'

  return (
    <Link
      href={cta.href}
      className="rd-split-panel"
      data-active={isActive}
      data-dimmed={isDimmed}
      onMouseEnter={() => setActive(side)}
      onMouseLeave={() => setActive(null)}
      onFocus={() => setActive(side)}
      onBlur={() => setActive(null)}
      style={{ background: bg }}
    >
      <div className="rd-split-inner">
        <span className="rd-kicker" style={{ color: 'var(--orange-300)' }}>
          {kicker}
        </span>
        <h3 className="rd-display mt-4" style={{ color: '#F5F5F5', fontSize: 'clamp(2rem,4vw,3.4rem)' }}>
          {title}
        </h3>
        <p
          className="mt-5 max-w-sm text-[1.02rem] leading-relaxed"
          style={{ color: 'var(--muted-on-dark)' }}
        >
          {copy}
        </p>
        <span className="rd-split-cta mt-8">
          {cta.label}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </div>
      <div className="rd-split-art" aria-hidden>
        {art}
      </div>
    </Link>
  )
}

function ConsumerArt() {
  return (
    <svg viewBox="0 0 220 300" width="220" height="300" fill="none" className="rd-float">
      {/* phone */}
      <rect x="30" y="20" width="160" height="260" rx="26" fill="#0a2c3f" stroke="rgba(245,245,245,0.18)" />
      <rect x="44" y="44" width="132" height="212" rx="14" fill="#04202f" />
      {/* receipt cards */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(58 ${64 + i * 58})`}>
          <rect width="104" height="44" rx="8" fill="#F5F5F5" opacity={0.95 - i * 0.18} />
          <rect x="12" y="10" width="46" height="6" rx="3" fill="#00121d" opacity="0.5" />
          <rect x="12" y="24" width="70" height="5" rx="2.5" fill="#00121d" opacity="0.25" />
          <circle cx="86" cy="20" r="8" fill="#EB7100" opacity={0.9 - i * 0.2} />
        </g>
      ))}
      {/* nfc tap glow */}
      <circle cx="110" cy="272" r="12" fill="#EB7100" />
    </svg>
  )
}

function MerchantArt() {
  return (
    <svg viewBox="0 0 240 300" width="240" height="300" fill="none">
      {/* counter */}
      <rect x="24" y="210" width="192" height="60" rx="10" fill="#0a2c3f" stroke="rgba(245,245,245,0.14)" />
      {/* POS terminal */}
      <rect x="60" y="120" width="90" height="96" rx="12" fill="#04202f" stroke="rgba(245,245,245,0.18)" />
      <rect x="74" y="134" width="62" height="40" rx="6" fill="#0a2c3f" />
      {/* RDH device */}
      <rect x="150" y="176" width="56" height="40" rx="9" fill="#EB7100" />
      <circle cx="178" cy="196" r="7" fill="#00121d" opacity="0.35" />
      {/* NFC waves from phone tap */}
      <g className="rd-float">
        <rect x="168" y="120" width="34" height="52" rx="7" fill="#0a2c3f" stroke="rgba(245,245,245,0.2)" />
      </g>
      {[14, 24, 34].map((r, i) => (
        <circle key={r} cx="150" cy="196" r={r} stroke="#EB7100" strokeWidth="2" opacity={0.5 - i * 0.14} />
      ))}
    </svg>
  )
}
