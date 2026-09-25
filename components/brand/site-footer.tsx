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
// Link set (Web 2.1 spec §3.5). The Platform column deep-links to sections on
// the path homes: #features and #faq on /customers, #setup and #faq on
// /business (the #features/#setup/#faq ids land with the /customers and
// /business tasks). Waitlist and POS Calculator are no longer linked: both
// now redirect (next.config.ts, 307: /waitlist → /, /pos-calculator →
// /business). The page code stays in the repo.
//
// `inFlow` (2026-09-22): on the two path homes the footer is rendered INSIDE
// FlowGround, so it joins the page's ground crossfade instead of being a flat
// navy slab bolted on below it. Pass it through FlowGround's `footer` slot
// (2026-09-24), not as a child: the slot keeps it inside the crossfade but
// outside <main> and outside any <section>, which is what makes this <footer>
// the page's contentinfo landmark (docs/design/footer-landmark.md). In that mode
// it paints no background of its own (the flow's ground is already navy
// underneath) and takes its ink from --flow-*. The ten legacy FramerPageShell
// routes mount <SiteFooter /> with no prop and keep the flat navy footer —
// never make the transparent variant the global default.
//
import Link from 'next/link'
import { FullLogo } from './full-logo'
import { AdminLogin } from '@/components/AdminLogin'
import { BlogSubscribeForm } from '@/components/blog/BlogSubscribeForm'
import { SALES_PHONE, SALES_PHONE_HREF, SOCIAL_LINKS, SUPPORT_EMAIL } from './links'

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Platform',
    links: [
      { href: '/customers#features', label: 'Features' },
      { href: '/business#setup', label: 'Integration' },
      { href: '/customers#faq', label: 'FAQ' },
      { href: '/business#faq', label: 'For businesses FAQ' },
    ],
  },
  {
    title: 'Product',
    links: [
      { href: '/customers', label: 'For Customers' },
      { href: '/business', label: 'For Businesses' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/support', label: 'Support' },
      { href: '/pci', label: 'PCI Docs' },
      { href: '/about', label: 'About us' },
    ],
  },
]

export function SiteFooter({ inFlow = false }: { inFlow?: boolean }) {
  return (
    <footer
      className={inFlow ? 'rd-footer rd-footer-flow' : 'rd-footer'}
      data-nav-theme="dark"
    >
      <div className="rd-footer-grid">
        <div>
          <Link
            href="/"
            aria-label="PapeX home"
            style={{ display: 'inline-flex', marginBottom: 18 }}
          >
            {/* The real lockup, same as the nav — the footer is always on
                navy. --foot-ink/-2 resolve to the flat on-dark tones by
                default and to the live --flow-* ink inside the flow, so the
                mark and copy crossfade with the ground instead of sitting
                fixed-white over a half-turned page. */}
            <FullLogo size={96} lines="var(--foot-ink)" />
          </Link>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: 'var(--foot-ink-2)',
              maxWidth: '30ch',
            }}
          >
            Digital receipts, one tap at checkout. No paper, no hassle.
          </p>
          {/* Social chips are brand texture only — PapeX has no confirmed
              profile URLs in this repo yet, so each chip only renders once
              its URL in SOCIAL_LINKS is filled in. */}
          <div style={{ marginTop: 22, display: 'flex', gap: 12 }}>
            {([
              { key: 'linkedin', label: 'in', name: 'LinkedIn' },
              { key: 'x', label: 'X', name: 'X' },
              { key: 'instagram', label: 'IG', name: 'Instagram' },
            ] as const).map(
              (chip) =>
                SOCIAL_LINKS[chip.key] && (
                  <a
                    key={chip.key}
                    href={SOCIAL_LINKS[chip.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`PapeX on ${chip.name}`}
                    className="rd-social-chip"
                  >
                    {chip.label}
                  </a>
                ),
            )}
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="rd-foot-heading">{column.title}</h3>
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
          {/* Newsletter signup REMOVED (Web 2.1, 2026-09-24), then RESTORED
              (Web 2.1, S1b) once it had somewhere real to write: it now posts
              to POST /api/signup (kind "blog"), the same route the blog's own
              sign-up box uses — see components/blog/BlogSubscribeForm.tsx and
              docs/SIGNUP_ROUTE.md. Reuses the existing .rd-foot-input /
              .rd-foot-join classes from papex-brand.css. */}
          <BlogSubscribeForm source="footer" variant="footer" />
        </div>

        <div>
          <h3 className="rd-foot-heading">Get in touch</h3>
          <div
            style={{ fontSize: 14, color: 'var(--foot-ink-2)', lineHeight: 1.7 }}
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
