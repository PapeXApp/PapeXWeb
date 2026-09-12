'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from './logo'

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/for-you', label: 'For You' },
      { href: '/for-business', label: 'For Business' },
      { href: '/features', label: 'Features' },
      { href: '/support', label: 'Merchant Support' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/pci', label: 'PCI Compliance' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
]

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <footer className="rd-dark rd-grain" style={{ borderTop: '1px solid rgba(245,245,245,0.1)' }}>
      <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + newsletter */}
          <div>
            <Link href="/" style={{ color: '#F5F5F5' }} aria-label="PapeX home">
              <Logo />
            </Link>
            <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed" style={{ color: 'var(--muted-on-dark)' }}>
              The last receipt you&rsquo;ll ever lose. Tap at checkout, keep it forever.
            </p>

            <form
              className="mt-6 max-w-sm"
              onSubmit={(e) => {
                e.preventDefault()
                if (email.trim()) setSent(true)
              }}
            >
              <label className="rd-kicker" style={{ color: 'var(--orange-300)' }}>
                Stay in the loop
              </label>
              <div
                className="mt-2 flex items-center gap-2 rounded-full p-1"
                style={{ border: '1px solid rgba(245,245,245,0.16)', background: 'rgba(245,245,245,0.04)' }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email address"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#F5F5F5',
                    padding: '0.55rem 0.9rem',
                    fontSize: '0.95rem',
                  }}
                />
                <button type="submit" className="rd-btn rd-btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                  {sent ? 'Thanks ✓' : 'Notify me'}
                </button>
              </div>
            </form>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="rd-kicker" style={{ color: 'var(--muted-on-dark)' }}>
                {col.title}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="rd-foot-link" style={{ color: '#F5F5F5', fontSize: '0.95rem' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-14 flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: '1px solid rgba(245,245,245,0.1)' }}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm" style={{ color: 'var(--muted-on-dark)' }}>
            <span>© 2026 PapeX, Inc.</span>
            <a href="mailto:support@papex.app" style={{ color: '#F5F5F5' }}>
              support@papex.app
            </a>
            <a href="tel:+14152618675" style={{ color: '#F5F5F5' }}>
              415-261-8675
            </a>
            <span>San Francisco, CA</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
