'use client'

// components/brand/site-nav.tsx
//
// The "liquid glass" nav: three separate floating capsules (logo left, links
// centre, CTA right) rather than one bar. The bar itself is pointer-events:none
// with pointer-events:auto per child, so the page stays interactive in the gaps
// between bubbles (see .rd-nav in styles/papex-brand.css).
//
// Nav link set (Web 2.1 spec §3.5): Home · For Customers · For Businesses ·
// Blog · About us. /contact redirects to /about (next.config.ts, S2).
//
// CTA per page (Phase 4, s-02/s-03/f-01): /customers gets "Download the
// app", matched to the visitor's device (useStoreUrl below); /business gets
// "Request a demo", which scrolls to the demo form (#demo on the business
// page). Standalone pages pick by audience: the merchant pages (/support,
// /pci) get "Request a demo", every other one "Download the app". The fork
// shows no button at all (it asks the visitor to choose; a button would
// choose for them) but keeps its invisible box, so the links bubble sits in
// the same place on every page.
//
// Hero contract (s-02): a page hero marks its own primary button with
// `data-hero-cta`. While any such element is on screen the nav button is
// hidden (visibility, never display, so nothing shifts); it appears once the
// hero button scrolls away, or straight away on a page that has none.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
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
  { href: '/about', label: 'About us' },
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

const DOWNLOAD: Cta = { label: 'Download the app', href: APP_STORE_URL, external: true }
const DEMO: Cta = { label: 'Request a demo', href: '/business#demo' }

/** Standalone pages written for store owners; they get the demo button. */
const MERCHANT_PAGES = ['/support', '/pci']

/** The nav button for a page. `storeUrl` is the device-matched store link
 *  (the App Store on the server and on every non-Android device). */
function ctaFor(path: SitePath, pathname: string | null, storeUrl: string): Cta {
  if (path === 'business') return DEMO
  if (path === 'page' && pathname && MERCHANT_PAGES.includes(pathname)) return DEMO
  // customer, the fork's (never shown) placeholder, and every other page.
  return { ...DOWNLOAD, href: storeUrl }
}

/** Whether the nav button should show. Hidden while a `[data-hero-cta]`
 *  element is on screen, shown once none is (or the page has none).
 *
 *  The first render has to guess, because the server can't see the page:
 *  the two path homes are the pages whose heroes carry the attribute, so they
 *  start hidden (no flash of a second button beside the hero's); every other
 *  page starts shown (no flash of a missing one). The observer corrects the
 *  guess on the first frame after hydration. */
function useHeroCtaHidden(path: SitePath, pathname: string | null): boolean {
  const [hidden, setHidden] = useState(path === 'customer' || path === 'business')
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll('[data-hero-cta]'))
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') {
      setHidden(false)
      return
    }
    const visible = new Set<Element>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      }
      setHidden(visible.size > 0)
    })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [pathname])
  return hidden
}

const MENU_ID = 'rd-nav-menu'

export function SiteNav({ path }: { path: SitePath }) {
  // The customer hero opens on #F5F5F5 (it continues the fork's light bottom
  // half), and standalone pages are light content pages too, so start light
  // there; the business hero and the fork's top half are navy, so start dark.
  // Getting this right avoids a one-frame wrong-glass flash before the probe
  // in use-glass-theme runs.
  const initialGlass: GlassTheme = path === 'customer' || path === 'page' ? 'light' : 'dark'
  // On the path homes the sections are transparent and the real backdrop is
  // FlowGround's page ground, which swaps at mid-viewport — follow it
  // directly (see components/paths/shared/flowSignal.ts). Everywhere else
  // it's null and the probe decides. While the ground is known the probe is
  // switched off: its per-scroll-frame elementFromPoint + style walk was
  // pure cost there (scroll perf, 2026-09-29).
  const flowGround = useFlowGround()
  const probed = useGlassTheme(initialGlass, !flowGround)
  const glass: GlassTheme = flowGround ? (flowGround === 'navy' ? 'dark' : 'light') : probed
  const pathname = usePathname()
  const storeUrl = useStoreUrl()
  const heroCtaOnScreen = useHeroCtaHidden(path, pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  /** Close the phone menu. Focus goes back to the burger that opened it,
   *  except when a link was followed (the page is changing under it). */
  const closeMenu = useCallback((returnFocus: boolean) => {
    setMenuOpen(false)
    if (returnFocus) burgerRef.current?.focus()
  }, [])

  useEffect(() => setMenuOpen(false), [pathname])

  // While the sheet is open (s-06): Escape or a tap outside closes it and
  // hands focus back to the burger, and the page underneath can't scroll.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu(true)
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (sheetRef.current?.contains(target) || burgerRef.current?.contains(target)) return
      closeMenu(true)
    }
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      root.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen, closeMenu])

  // Keep Tab inside the open menu: the burger (which closes it) plus the
  // sheet's links, in a loop.
  const onMenuTab = useCallback((event: ReactKeyboardEvent) => {
    if (event.key !== 'Tab') return
    const links = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>('a[href]') ?? [])
    const burger = burgerRef.current
    if (!burger || links.length === 0) return
    const first = links[0]
    const last = links[links.length - 1]
    const active = document.activeElement
    if (!event.shiftKey && active === last) {
      event.preventDefault()
      burger.focus()
    } else if (event.shiftKey && active === burger) {
      event.preventDefault()
      last.focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      burger.focus()
    }
  }, [])

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

  const cta = ctaFor(path, pathname, storeUrl)
  // f-01: never on the fork. s-02: not while the hero's own button shows.
  const ctaHidden = path === 'fork' || heroCtaOnScreen

  return (
    <nav className="rd-nav" data-glass={glass} aria-label="Primary">
      <Link
        href="/"
        onClick={onLogoClick}
        className="rd-glass rd-logo-bubble rd-nav-ink"
        data-glass={glass}
        aria-label="PapeX home"
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

      <div className="rd-nav-actions" onKeyDown={menuOpen ? onMenuTab : undefined}>
        {/* Hidden = visibility:hidden (.rd-btn-nav[data-hidden]): out of the
            tab order and the accessibility tree, but its box stays, so the
            burger and the links bubble never move when it appears. On the
            fork ("fork") phones drop the box too: there the links bubble is
            already gone and nothing can shift. */}
        {cta.external ? (
          <a
            className="rd-btn rd-btn-primary rd-btn-nav"
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            data-hidden={ctaHidden ? (path === 'fork' ? 'fork' : 'true') : undefined}
          >
            {cta.label}
          </a>
        ) : (
          <Link
            className="rd-btn rd-btn-primary rd-btn-nav"
            href={cta.href}
            data-hidden={ctaHidden ? (path === 'fork' ? 'fork' : 'true') : undefined}
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
          onClick={() => (menuOpen ? closeMenu(true) : setMenuOpen(true))}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <div id={MENU_ID} ref={sheetRef} className="rd-menu-sheet" onKeyDown={onMenuTab}>
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
