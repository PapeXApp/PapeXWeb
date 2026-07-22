'use client'

import Link from 'next/link'
import '@/styles/redesign.css'
import { SiteNav } from './site-nav'
import { SiteFooter } from './site-footer'
import { VisualSplit } from './visual-split'
import { Reveal } from './reveal'
import { StatCounter } from './stat-counter'

export function Homepage() {
  return (
    <div className="rd">
      <SiteNav />
      <main>
        <Hero />
        <Problem />
        <VisualSplit />
        <HowItWorks />
        <SocialProof />
        <Vision />
      </main>
      <SiteFooter />
    </div>
  )
}

/* ---------------------------------------------------------------- Hero --- */
function Hero() {
  return (
    <section className="rd-dark rd-mesh rd-grain relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="rd-hairline-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-10 px-5 pt-28 pb-16 md:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <span className="rd-kicker" style={{ color: 'var(--orange-300)' }}>
              Digital receipts · tap at checkout
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1
              className="rd-display mt-5"
              style={{ color: '#F5F5F5', fontSize: 'clamp(2.7rem, 6.6vw, 5.6rem)' }}
            >
              The last receipt<br />
              you&rsquo;ll ever <span className="rd-sheen-text">lose</span>.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p
              className="mt-7 max-w-lg text-lg leading-relaxed"
              style={{ color: 'var(--muted-on-dark)' }}
            >
              PapeX turns paper receipts digital. Tap your phone at checkout and
              it&rsquo;s saved forever — organized, searchable, and yours. No app
              required to receive it.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex items-center gap-6">
              <span
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: 'var(--muted-on-dark)' }}
              >
                <span className="rd-dot-live" /> Live on the App Store · free
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="hidden lg:block">
          <HeroArt />
        </Reveal>
      </div>

      {/* scroll cue */}
      <div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-center"
        style={{ color: 'var(--muted-on-dark)' }}
        aria-hidden
      >
        <div className="rd-scroll-cue" />
      </div>
    </section>
  )
}

function HeroArt() {
  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ maxWidth: 420 }}>
      {/* NFC pulse rings */}
      <span className="rd-ring" style={{ animationDelay: '0s' }} />
      <span className="rd-ring" style={{ animationDelay: '1s' }} />
      <span className="rd-ring" style={{ animationDelay: '2s' }} />
      <svg viewBox="0 0 320 420" width="100%" className="relative rd-float" fill="none">
        <defs>
          <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0a2c3f" />
            <stop offset="1" stopColor="#04202f" />
          </linearGradient>
        </defs>
        <rect x="70" y="20" width="180" height="360" rx="30" fill="#0a2c3f" stroke="rgba(245,245,245,0.16)" />
        <rect x="84" y="46" width="152" height="308" rx="18" fill="url(#scr)" />
        {/* header */}
        <rect x="104" y="70" width="80" height="9" rx="4.5" fill="#F5F5F5" opacity="0.85" />
        <rect x="104" y="88" width="52" height="7" rx="3.5" fill="#F5F5F5" opacity="0.35" />
        {/* receipt rows */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(104 ${118 + i * 52})`}>
            <rect width="112" height="40" rx="9" fill="#F5F5F5" opacity={0.96 - i * 0.14} />
            <rect x="12" y="10" width="44" height="6" rx="3" fill="#00121d" opacity="0.55" />
            <rect x="12" y="23" width="66" height="5" rx="2.5" fill="#00121d" opacity="0.28" />
            <circle cx="92" cy="20" r="7" fill="#EB7100" opacity={0.95 - i * 0.15} />
          </g>
        ))}
        {/* tap chip */}
        <circle cx="160" cy="366" r="13" fill="#EB7100" />
        <path d="M156 366h8M160 362v8" stroke="#00121d" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------- Problem --- */
function Problem() {
  const stats = [
    { n: '250B+', l: 'paper receipts printed in the U.S. every year' },
    { n: '10M', l: 'trees pulped for receipt paper annually' },
    { n: '#1', l: 'reason people miss returns, warranties & deductions' },
  ]
  return (
    <section style={{ background: 'var(--offwhite)', color: 'var(--ink)' }} className="relative">
      <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-32">
        <Reveal>
          <span className="rd-kicker" style={{ color: 'var(--orange)' }}>
            The problem
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2
            className="rd-display mt-5 max-w-3xl"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}
          >
            Paper receipts fade,<br />pile up, and get lost —<br />
            <span style={{ color: 'var(--orange)' }}>right when you need them.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.l} delay={0.1 * i}>
              <div
                className="h-full rounded-2xl bg-white p-8"
                style={{ border: '1px solid var(--hairline-light)' }}
              >
                <div
                  className="rd-display"
                  style={{ fontSize: 'clamp(2.4rem,4vw,3.2rem)', color: 'var(--ink)' }}
                >
                  {s.n}
                </div>
                <p className="mt-3 text-[1.02rem] leading-relaxed" style={{ color: 'var(--muted-on-light)' }}>
                  {s.l}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------- How it works --- */
function HowItWorks() {
  const steps = [
    { n: '01', t: 'Pay like normal', d: 'Check out however you already do. Nothing changes about your day.' },
    { n: '02', t: 'Tap your phone', d: 'Hold your phone to the PapeX device. NFC does the rest in a second.' },
    { n: '03', t: 'Receipt appears', d: 'Your digital receipt pops up instantly — no app needed to receive it.' },
  ]
  return (
    <section id="how" style={{ background: 'var(--white)', color: 'var(--ink)' }}>
      <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-32">
        <Reveal>
          <span className="rd-kicker" style={{ color: 'var(--orange)' }}>
            How it works
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="rd-display mt-5 max-w-2xl" style={{ fontSize: 'clamp(2.2rem,5vw,3.6rem)' }}>
            One tap. That&rsquo;s the whole thing.
          </h2>
        </Reveal>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* connecting line */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-[46px] hidden h-px md:block"
            style={{ background: 'linear-gradient(90deg, transparent, var(--hairline-light) 12%, var(--hairline-light) 88%, transparent)' }}
            aria-hidden
          />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={0.12 * i}>
              <div className="relative">
                <div
                  className="flex h-[92px] w-[92px] items-center justify-center rounded-2xl"
                  style={{
                    background: 'var(--navy)',
                    color: 'var(--orange-300)',
                    fontFamily: 'var(--font-kameron), serif',
                    fontSize: '1.9rem',
                    fontWeight: 600,
                  }}
                >
                  {s.n}
                </div>
                <h3 className="mt-6 text-2xl font-semibold" style={{ fontFamily: 'var(--font-kameron), serif' }}>
                  {s.t}
                </h3>
                <p className="mt-3 max-w-xs text-[1.02rem] leading-relaxed" style={{ color: 'var(--muted-on-light)' }}>
                  {s.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------- Social proof --- */
function SocialProof() {
  const stats = [
    { value: 4200000, fmt: (n: number) => compact(n) + '+', l: 'Receipts delivered' },
    { value: 38000, fmt: (n: number) => compact(n), l: 'Trees saved' },
    { value: 120, fmt: (n: number) => n.toLocaleString() + '+', l: 'Merchants onboarded' },
  ]
  return (
    <section className="rd-dark rd-mesh rd-grain relative overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-32">
        <Reveal>
          <span className="rd-kicker" style={{ color: 'var(--orange-300)' }}>
            The receipts, so far
          </span>
        </Reveal>

        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.l} delay={0.12 * i}>
              <div style={{ borderTop: '1px solid var(--hairline-dark)', paddingTop: '1.5rem' }}>
                <StatCounter
                  value={s.value}
                  format={s.fmt}
                  className="rd-display block"
                  style={{ color: '#F5F5F5', fontSize: 'clamp(2.6rem,5vw,4rem)' }}
                />
                <p className="mt-2 text-[1.02rem]" style={{ color: 'var(--muted-on-dark)' }}>
                  {s.l}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <figure
            className="mt-20 max-w-3xl rounded-3xl p-8 md:p-12"
            style={{ background: 'rgba(245,245,245,0.04)', border: '1px solid var(--hairline-dark)' }}
          >
            <blockquote
              className="rd-display"
              style={{ color: '#F5F5F5', fontSize: 'clamp(1.5rem,2.6vw,2.2rem)', lineHeight: 1.25 }}
            >
              &ldquo;Placeholder testimonial — a merchant or customer quote about how
              much easier receipts got with PapeX.&rdquo;
            </blockquote>
            <figcaption className="mt-6 text-sm" style={{ color: 'var(--muted-on-dark)' }}>
              Name · Role, Company &nbsp;·&nbsp; <span style={{ color: 'var(--orange-300)' }}>[placeholder]</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- Vision --- */
function Vision() {
  return (
    <section style={{ background: 'var(--offwhite)', color: 'var(--ink)' }}>
      <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Reveal>
              <span className="rd-kicker" style={{ color: 'var(--orange)' }}>
                The vision
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="rd-display mt-5" style={{ fontSize: 'clamp(2.2rem,4.6vw,3.6rem)' }}>
                Receipts that are<br />useful, not wasteful.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed" style={{ color: 'var(--muted-on-light)' }}>
                We&rsquo;re building the layer that makes every purchase remember
                itself — greener checkouts, effortless expense tracking, and an
                end to the little paper slips no one wanted in the first place.
              </p>
            </Reveal>
          </div>

          {/* CTA strip */}
          <Reveal delay={0.12}>
            <div
              className="rd-dark rd-grain overflow-hidden rounded-3xl p-8 md:p-10"
              style={{ borderTop: '4px solid var(--orange)' }}
            >
              <h3 className="rd-display" style={{ color: '#F5F5F5', fontSize: '1.9rem' }}>
                Ready when you are.
              </h3>
              <p className="mt-3 text-[1.02rem]" style={{ color: 'var(--muted-on-dark)' }}>
                Get the app, or bring PapeX to your checkout.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="https://apps.apple.com/app/papex" className="rd-btn rd-btn-primary" style={{ justifyContent: 'center' }}>
                  Download the App
                </Link>
                <Link href="/for-business" className="rd-btn rd-btn-ghost" style={{ justifyContent: 'center' }}>
                  Get the RDH for Business
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- utils --- */
function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}
