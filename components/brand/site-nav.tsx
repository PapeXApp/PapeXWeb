'use client'

// components/brand/site-nav.tsx
//
// The "liquid glass" nav: three separate floating capsules (logo left, links
// centre, CTA right) rather than one bar. The bar itself is pointer-events:none
// with pointer-events:auto per child, so the page stays interactive in the gaps
// between bubbles (see .rd-nav in styles/papex-brand.css).
//
// Nav link set (Web 2.1 spec §3.5): Home · For Customers · For Businesses ·
// Blog · Contact. The spec's fifth item is "About us" (/about); a later task
// renames it and adds the /contact → /about redirect, so until then it stays
// "Contact" → /contact, a real route, rather than a link that 404s.
//
// CTA per page: the fork keeps "Get started"; /customers gets "Download the
// app", matched to the visitor's device (useStoreUrl below); /business gets
// "Request a demo", which scrolls to the demo form (#demo on the business
// page) instead of leaving for /contact.

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FullLogo } from './full-logo'
import { useGlassTheme, type GlassTheme } from './use-glass-theme'
import { clearPathChoice, type PathChoice } from '@/lib/pathChoice'
import { useFlowGround } from '@/components/paths/shared/flowSignal'
import { platformFromUserAgent } from '@/lib/storeLinks'
import { APP_STORE_URL, storeUrlFor } from './links'

// 'page' is a neutral fourth value for standalone subpages (contact, blog,
// legal, etc.) that sit outside the fork/customer/business flow: no
// path-choice logic, no RememberPath, default CTA, light glass by default.
export type SitePath = 'fork' | 'page' | PathChoice

/** Fired by nav links while the fork is on screen so the commit animation
 *  runs instead of a bare route change. Consumed by components/brand/fork.tsx. */
export const FORK_COMMIT_EVENT = 'papex:fork-commit'

type NavLink = { href: string; label: string; choice?: PathChoice; home?: boolean }

const LINKS: NavLink[] = [
  { href: '/', label: 'Home', home: true },
  { href: '/customers', label: 'For Customers', choice: 'customer' },
  { href: '/business', label: 'For Businesses', choice: 'business' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

/** The App Store or Google Play link for the visitor's device.
 *
 *  The server has no user agent here (the nav is a client component inside
 *  statically rendered pages), so the first render is always the App Store
 *  and the Android swap happens after mount. That keeps server and client
 *  markup identical (no hydration mismatch) and leaves every non-Android
 *  device, desktop included, on the App Store default. */
export function useStoreUrl(): string {
  const [url, setUrl] = useState(APP_STORE_URL)
  useEffect(() => {
    setUrl(storeUrlFor(platformFromUserAgent(navigator.userAgent)))
  }, [])
  return url
}

type Cta = { label: string; href: string; external?: boolean }

const CTA: Record<SitePath, Cta> = {
  fork: { label: 'Get started', href: '/customers' },
  // href is the SSR default; SiteNav swaps in the device-matched store URL.
  customer: { label: 'Download the app', href: APP_STORE_URL, external: true },
  business: { label: 'Request a demo', href: '/business#demo' },
  page: { label: 'Get started', href: '/customers' },
}

const MENU_ID = 'rd-nav-menu'

export function SiteNav({ path }: { path: SitePath }) {
  // The customer hero opens on #F5F5F5 (it continues the fork's light bottom
  // half), and standalone pages are light content pages too, so start light
  // there; the business hero and the fork's top half are navy, so start dark.
  // Getting this right avoids a one-frame wrong-glass flash before the probe
  // in use-glass-theme runs.
  const initialGlass: GlassTheme = path === 'customer' || path === 'page' ? 'light' : 'dark'
  const probed = useGlassTheme(initialGlass)
  // On the path homes the sections are transparent and the real backdrop is
  // FlowGround's page ground, which swaps at mid-viewport — follow it
  // directly (see components/paths/shared/flowSignal.ts). Everywhere else
  // it's null and the probe decides.
  const flowGround = useFlowGround()
  const glass: GlassTheme = flowGround ? (flowGround === 'navy' ? 'dark' : 'light') : probed
  const pathname = usePathname()
  const storeUrl = useStoreUrl()
  const [menuOpen, setMenuOpen] = useState(false)
  const burgerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMenuOpen(false), [pathname])

  // Escape closes the sheet and hands focus back to the burger that opened it.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      burgerRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

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

  const cta: Cta = path === 'customer' ? { ...CTA.customer, href: storeUrl } : CTA[path]

  return (
    <nav className="rd-nav" data-glass={glass} aria-label="Primary">
      <Link
        href="/"
        onClick={onLogoClick}
        className="rd-glass rd-logo-bubble rd-nav-ink"
        data-glass={glass}
        aria-label="PapeX, back to the start"
      >
        {/* The real lockup (plane + letterforms), not the plane alone and not
            "PapeX" set in the display face — see components/brand/full-logo.tsx.
            `letters` inherits the nav-glass ink via currentColor; only the
            plane highlights need to know which glass they sit on. */}
        <FullLogo
          size={76}
          lines={glass === 'light' ? 'var(--navy)' : 'var(--white)'}
        />
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
          ref={burgerRef}
          type="button"
          className="rd-glass rd-burger"
          data-glass={glass}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls={MENU_ID}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <div id={MENU_ID} className="rd-menu-sheet">
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
