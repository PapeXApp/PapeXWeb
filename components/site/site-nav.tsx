'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from './logo'

const LINKS = [
  { href: '/for-you', label: 'For You' },
  { href: '/for-business', label: 'For Business' },
  { href: '/features', label: 'Features' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
]

/**
 * Persistent top bar. Transparent over the dark hero, then condenses to a
 * blurred navy bar once the user scrolls. Mobile: full-screen overlay menu.
 * `cta` adapts per path (Download App on consumer, Get the RDH on merchant).
 */
export function SiteNav({
  cta = { href: 'https://apps.apple.com/app/papex', label: 'Download App' },
}: {
  cta?: { href: string; label: string }
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background-color .35s ease, box-shadow .35s ease, border-color .35s ease',
        backgroundColor: scrolled ? 'rgba(0,18,29,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(140%) blur(14px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(140%) blur(14px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(245,245,245,0.1)' : 'transparent'}`,
      }}
    >
      <nav className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" style={{ color: '#F5F5F5' }} aria-label="PapeX home">
          <Logo />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rd-nav-link"
              style={{ color: 'rgba(245,245,245,0.82)', fontWeight: 500, fontSize: '0.95rem' }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href={cta.href} className="rd-btn rd-btn-primary hidden sm:inline-flex">
            {cta.label}
          </Link>
          {/* Hamburger */}
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: 5,
              padding: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={barStyle(open, 0)} />
            <span style={barStyle(open, 1)} />
            <span style={barStyle(open, 2)} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(0,18,29,0.98)',
          backdropFilter: 'blur(6px)',
          transform: open ? 'translateY(0)' : 'translateY(-100%)',
          opacity: open ? 1 : 0,
          transition: 'transform .45s cubic-bezier(.22,.7,.2,1), opacity .3s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem',
        }}
        className="lg:hidden"
      >
        <div className="flex flex-col gap-2">
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                color: '#F5F5F5',
                fontFamily: 'var(--font-kameron), serif',
                fontSize: '2rem',
                fontWeight: 600,
                padding: '0.5rem 0',
                borderBottom: '1px solid rgba(245,245,245,0.08)',
                transitionDelay: `${i * 40}ms`,
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={cta.href}
            onClick={() => setOpen(false)}
            className="rd-btn rd-btn-primary"
            style={{ marginTop: '1.5rem', justifyContent: 'center' }}
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </header>
  )
}

function barStyle(open: boolean, i: number): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'block',
    width: 24,
    height: 2,
    borderRadius: 2,
    background: '#F5F5F5',
    transition: 'transform .3s ease, opacity .2s ease',
  }
  if (!open) return base
  if (i === 0) return { ...base, transform: 'translateY(7px) rotate(45deg)' }
  if (i === 1) return { ...base, opacity: 0 }
  return { ...base, transform: 'translateY(-7px) rotate(-45deg)' }
}
