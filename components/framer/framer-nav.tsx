"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { APP_DOWNLOAD_URL } from "./constants"

function anchorHref(pathname: string, hash: string) {
  return pathname === "/" ? hash : `/${hash}`
}

export function FramerNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="site-header">
        <nav className="site-nav" aria-label="Primary">
          <Link href="/" className="nav-logo" aria-label="PapeX home">
            <Image src="/framer-assets/logo.svg" alt="PapeX" width={112} height={35} priority />
          </Link>
          <div className="nav-links">
            <Link href={anchorHref(pathname, "#feature")}>Features</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="nav-actions">
            <a href={APP_DOWNLOAD_URL} className="btn-download" target="_blank" rel="noopener noreferrer">
              Download App
            </a>
            <button type="button" className="nav-menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      <div
        className={`mobile-menu${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      >
        <div className="mobile-menu-panel" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="mobile-menu-close"
            aria-label="Close menu"
            style={{ float: "right", fontSize: 24, lineHeight: 1, marginBottom: 8 }}
            onClick={() => setMenuOpen(false)}
          >
            &times;
          </button>
          <Link href={anchorHref(pathname, "#feature")} onClick={() => setMenuOpen(false)}>
            Features
          </Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)}>
            Blog
          </Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>
            Contact
          </Link>
          <Link href={anchorHref(pathname, "#integration")} onClick={() => setMenuOpen(false)}>
            Integration
          </Link>
          <Link href={anchorHref(pathname, "#faq")} onClick={() => setMenuOpen(false)}>
            FAQ
          </Link>
          <a href={APP_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
            Download App
          </a>
        </div>
      </div>
    </>
  )
}
