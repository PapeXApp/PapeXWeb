'use client'

// components/brand/site-nav.tsx
//
// The "liquid glass" nav: three separate floating capsules (logo left, links
// centre, CTA right) rather than one bar. The bar itself is pointer-events:none
// with pointer-events:auto per child, so the page stays interactive in the gaps
// between bubbles (see .rd-nav in styles/papex-brand.css).
//
// Nav link set — the spec asks for `Home · For Customers · For Business ·
// Features · Blog · About`. This repo has no /features and no /about route, and
// shipping nav items that 404 is worse than shipping five that work, so those
// two are omitted and /contact (a real route) takes the sixth slot.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './logo'
import { useGlassTheme, type GlassTheme } from './use-glass-theme'
import { clearPathChoice, type PathChoice } from '@/lib/pathChoice'
import { APP_STORE_URL } from './links'

export type SitePath = 'fork' | PathChoice

/** Fired by nav links while the fork is on screen so the commit animation
 *  runs instead of a bare route change. Consumed by components/brand/fork.tsx. */
export const FORK_COMMIT_EVENT = 'papex:fork-commit'

type NavLink = { href: string; label: string; choice?: PathChoice; home?: boolean }

const LINKS: NavLink[] = [
  { href: '/', label: 'Home', home: true },
  { href: '/customers', label: 'For Customers', choice: 'customer' },
  { href: '/business', label: 'For Business', choice: 'business' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

const CTA: Record<SitePath, { label: string; href: string; external?: boolean }> = {
  fork: { label: 'Get Started', href: '/customers' },
  customer: { label: 'Download App', href: APP_STORE_URL, external: true },
  business: { label: 'Get the RDH', href: '/contact' },
}

export function SiteNav({ path }: { path: SitePath }) {
  // Business hero opens on #F5F5F5, so start light there and avoid a one-frame
  // dark-bubble flash before the probe runs.
  const initialGlass: GlassTheme = path === 'business' ? 'light' : 'dark'
  const glass = useGlassTheme(initialGlass)
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [pathname])

  // Close the sheet if the viewport grows past the breakpoint while it's open.
  useEffect(() => {
    const mq = window.matchMedia('(max-width:820px)')
    const onChange = () => {
      if (!mq.matches) setMenuOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const onLinkClick = useCallback(
    (link: NavLink) => (event: React.MouseEvent) => {
      setMenuOpen(false)
      if (link.home) {
        // Logo / "Home" are the only ways back to the fork, and they forget the
        // stored choice — otherwise the redirect on `/` would bounce straight
        // back out to the path the visitor is trying to leave.
        clearPathChoice()
        return
      }
      if (path === 'fork' && link.choice) {
        event.preventDefault()
        window.dispatchEvent(
          new CustomEvent<PathChoice>(FORK_COMMIT_EVENT, { detail: link.choice }),
        )
      }
    },
    [path],
  )

  const onLogoClick = useCallback(() => {
    setMenuOpen(false)
    clearPathChoice()
  }, [])

  const isCurrent = (link: NavLink) =>
    link.home ? pathname === '/' : pathname === link.href

  const cta = CTA[path]

  return (
    <nav className="rd-nav" data-glass={glass} aria-label="Primary">
      <Link
        href="/"
        onClick={onLogoClick}
        className="rd-glass rd-logo-bubble rd-nav-ink"
        data-glass={glass}
        aria-label="PapeX — back to the start"
      >
        <Logo size={26} />
      </Link>

      <div className="rd-glass rd-links-bubble" data-glass={glass}>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rd-navlink"
            aria-current={isCurrent(link) ? 'page' : undefined}
            onClick={onLinkClick(link)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {cta.external ? (
          <a
            className="rd-btn rd-btn-primary rd-btn-nav"
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {cta.label}
          </a>
        ) : (
          <Link
            className="rd-btn rd-btn-primary rd-btn-nav"
            href={cta.href}
            onClick={(event) => {
              if (path === 'fork') {
                event.preventDefault()
                window.dispatchEvent(
                  new CustomEvent<PathChoice>(FORK_COMMIT_EVENT, { detail: 'customer' }),
                )
              }
            }}
          >
            {cta.label}
          </Link>
        )}

        <button
          type="button"
          className="rd-glass rd-burger"
          data-glass={glass}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <div className="rd-menu-sheet">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link) ? 'page' : undefined}
              onClick={onLinkClick(link)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
