'use client'

// components/brand/site-footer.tsx
//
// Shared dark footer for both paths (docs/design/forked-landing/source/
// PapeX Footer.dc.html). Structure salvaged from origin/feat/site-redesign's
// site-footer.tsx; columns and styling re-cut to the prototype.
//
// IMPORTANT: <AdminLogin /> is the REAL admin login for the blog CMS — the
// deliberately faint button restored on purpose in b667fdd (see CLAUDE.md).
// The /dashboard login form is cosmetic. Removing this as "dead UI" locks Nico
// out of the CMS. Keep it in every footer variant.
//
// Link set note: the prototype lists Features and About; neither route exists
// in this repo, so those slots are filled with real routes rather than 404s.

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from './logo'
import { AdminLogin } from '@/components/AdminLogin'
import { SALES_PHONE, SALES_PHONE_HREF, SUPPORT_EMAIL } from './links'

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/customers', label: 'For Customers' },
      { href: '/business', label: 'For Business' },
      { href: '/pos-calculator', label: 'POS Calculator' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/support', label: 'Support' },
      { href: '/pci', label: 'PCI Docs' },
      { href: '/contact', label: 'Contact' },
      { href: '/waitlist', label: 'Waitlist' },
    ],
  },
]

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  return (
    <footer className="rd-footer" data-nav-theme="dark">
      <div className="rd-footer-grid">
        <div>
          <Link
            href="/"
            aria-label="PapeX home"
            style={{ display: 'inline-flex', marginBottom: 18 }}
          >
            <Logo />
          </Link>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: 'rgba(245,245,245,.55)',
              maxWidth: '30ch',
            }}
          >
            Digital receipts, one tap at checkout. No paper, no hassle.
          </p>
          {/* Social chips are brand texture only — the prototype ships them
              without hrefs and PapeX has no confirmed profile URLs in this
              repo. Presentational until real links are supplied. */}
          <div style={{ marginTop: 22, display: 'flex', gap: 12 }} aria-hidden="true">
            {['in', 'X', 'IG'].map((label) => (
              <span key={label} className="rd-social-chip">
                {label}
              </span>
            ))}
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <div className="rd-foot-heading">{column.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {column.links.map((link) => (
                <Link key={link.href} href={link.href} className="rd-foot-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div>
          <div className="rd-foot-heading">Stay in the loop</div>
          <form
            style={{ display: 'flex', gap: 8, marginBottom: 16 }}
            onSubmit={(event) => {
              event.preventDefault()
              // TODO(foundation): no backend wired yet — the design bundle
              // leaves the capture destination open (README "Data").
              if (email.trim()) setJoined(true)
            }}
          >
            <input
              type="email"
              required
              className="rd-foot-input"
              placeholder="Email"
              aria-label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className="rd-foot-join">
              {joined ? 'Thanks' : 'Join'}
            </button>
          </form>
          <div
            style={{ fontSize: 14, color: 'rgba(245,245,245,.55)', lineHeight: 1.7 }}
          >
            <a href={`mailto:${SUPPORT_EMAIL}`} className="rd-foot-link">
              {SUPPORT_EMAIL}
            </a>
            <br />
            <a href={SALES_PHONE_HREF} className="rd-foot-link">
              {SALES_PHONE}
            </a>
            <br />
            San Francisco, CA
          </div>
        </div>
      </div>

      <div className="rd-foot-bottom">
        <span>© 2026 PapeX. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          <Link href="/terms" className="rd-foot-link" style={{ fontSize: 13 }}>
            Terms
          </Link>
          <Link href="/privacy" className="rd-foot-link" style={{ fontSize: 13 }}>
            Privacy
          </Link>
          {/* Real admin login — see the note at the top of this file. */}
          <AdminLogin />
        </div>
      </div>
    </footer>
  )
}
