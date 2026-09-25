'use client'

// components/blog/BlogSubscribeForm.tsx
//
// The ONE "get new PapeX blog posts by email" sign-up box (Web 2.1, S1b +
// S3b). Two homes share this single component instead of two copies of the
// same state machine:
//   - the footer (variant="footer", source="footer") — imported directly by
//     components/brand/site-footer.tsx, dropped into the "Get in touch"
//     column, styled with the footer's own .rd-foot-* classes so it reads as
//     part of the dark grid instead of a foreign box.
//   - the blog (variant="card", source="blog-index" | "blog-post") — a
//     self-contained light FlowSection, mounted at the end of app/blog/page.tsx
//     and app/blog/[slug]/page.tsx.
//
// Talks to POST /api/signup through lib/signup/client.ts (see
// docs/SIGNUP_ROUTE.md for the contract). No client-side email format check:
// the server owns validation and its message wins — see STATUS_MESSAGES below
// for exactly how each response maps to copy.

import Link from 'next/link'
import { useId, useRef, useState, type FormEvent } from 'react'
import { subscribeToBlog } from '@/lib/signup/client'
import type { SignupResult } from '@/lib/signup/client'
import type { BlogSource } from '@/lib/signup/schema'
import { HONEYPOT_FIELD } from '@/lib/signup/schema'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import styles from './blog.module.css'

type Status = 'idle' | 'sending' | 'success' | 'error'

export const BLOG_SUBSCRIBE_HEADING = 'Get new PapeX blog posts by email'
const SUCCESS_MESSAGE = "Thanks — you'll get the next post."
const CHECK_EMAIL_MESSAGE = 'Check your email address.'
const RATE_LIMITED_MESSAGE = 'Too many tries. Try again in a few minutes.'
const UNAVAILABLE_MESSAGE = "Sign-up isn't available right now. Try again later."

/** Maps a failed SignupResult to the one of three copy states S1b/S3b spec. */
function errorMessageFor(result: Extract<SignupResult, { ok: false }>): string {
  if (result.error === 'rate_limited') return RATE_LIMITED_MESSAGE
  if (result.error === 'invalid_fields' || result.error === 'invalid_request') return CHECK_EMAIL_MESSAGE
  // Anything else, incl. "unavailable" (503), "not_configured", "server_error",
  // "too_large", "unsupported_media_type", "invalid_json" and "network".
  return UNAVAILABLE_MESSAGE
}

interface BlogSubscribeFormProps {
  source: BlogSource
  /** Site path the sign-up came from, e.g. "/blog/some-post". Omit for the footer. */
  path?: string
  /** "footer" sits in the dark .rd-footer grid; "card" is the blog's own light section. */
  variant: 'footer' | 'card'
}

function SubscribeForm({ source, path, variant }: BlogSubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const inputId = useId()
  const statusId = useId()
  // Honeypot: uncontrolled, off-screen, never focusable — same pattern as
  // DemoForm's. A person can't fill it; a naive bot does, and the route
  // quietly drops the submission.
  const honeypotRef = useRef<HTMLInputElement | null>(null)

  const isFooter = variant === 'footer'
  const sending = status === 'sending'

  // Fine print under the form, both variants (coordinator addition,
  // 2026-09-24): small and muted, but still >=12px and legible on either
  // ground — foot-ink-3 is the footer's own muted tone, on-light-muted is
  // the blog card's. The link keeps the surrounding size/colour and just
  // adds an underline, so it doesn't jump out of "fine print" register.
  const finePrint = (
    <p
      className={styles.subscribeFinePrint}
      style={{ color: isFooter ? 'var(--foot-ink-3)' : 'var(--on-light-muted)' }}
    >
      Only new posts, nothing else. Reply to any email to unsubscribe.{' '}
      <Link href="/privacy" className={styles.subscribeFinePrintLink}>
        Privacy policy
      </Link>
    </p>
  )

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return
    setStatus('sending')
    setMessage('')

    const hp = honeypotRef.current?.value || undefined
    // The footer renders on every page, so it has no fixed `path` prop —
    // read the page the visitor is actually on at submit time (spec S1b:
    // `path: location.pathname`). The blog card variant always passes an
    // explicit path (blog-index or a post's own path) and that wins.
    const effectivePath = path ?? (typeof window !== 'undefined' ? window.location.pathname : undefined)
    const result = await subscribeToBlog({ email: email.trim(), source, path: effectivePath, hp })

    if (result.ok) {
      setStatus('success')
      setMessage(SUCCESS_MESSAGE)
      setEmail('')
      return
    }
    setStatus('error')
    setMessage(errorMessageFor(result))
  }

  if (status === 'success') {
    return (
      <div className={isFooter ? undefined : styles.subscribeCard}>
        <h3 className={isFooter ? 'rd-foot-heading' : styles.subscribeTitle}>{BLOG_SUBSCRIBE_HEADING}</h3>
        <p
          role="status"
          aria-live="polite"
          className={isFooter ? undefined : styles.subscribeStatus}
          style={isFooter ? { fontSize: 14, color: 'var(--foot-ink-2)' } : undefined}
        >
          {message}
        </p>
        {finePrint}
      </div>
    )
  }

  return (
    <div className={isFooter ? undefined : styles.subscribeCard}>
      <h3 className={isFooter ? 'rd-foot-heading' : styles.subscribeTitle}>{BLOG_SUBSCRIBE_HEADING}</h3>
      <form
        onSubmit={handleSubmit}
        noValidate
        className={isFooter ? styles.subscribeFormFooter : styles.subscribeForm}
      >
        {/* Off-screen honeypot, never visible or focusable. */}
        <div
          aria-hidden="true"
          style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
        >
          <input ref={honeypotRef} type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-describedby={message ? statusId : undefined}
          className={isFooter ? 'rd-foot-input' : styles.subscribeInput}
        />
        <button
          type="submit"
          disabled={sending}
          aria-busy={sending}
          className={isFooter ? 'rd-foot-join' : 'rd-btn rd-btn-primary'}
        >
          {sending ? 'Sending…' : 'Subscribe'}
        </button>
      </form>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={isFooter ? undefined : styles.subscribeStatus}
        style={
          isFooter
            ? { fontSize: 13, marginTop: 10, color: status === 'error' ? '#ff9d7a' : 'var(--foot-ink-2)' }
            : { color: status === 'error' ? '#c2410c' : undefined }
        }
      >
        {message}
      </p>
      {finePrint}
    </div>
  )
}

/**
 * Footer variant: no wrapping section — the caller (site-footer.tsx) drops
 * this straight into its own grid cell.
 *
 * Card variant: a self-contained light FlowSection, so app/blog/page.tsx and
 * app/blog/[slug]/page.tsx can mount it at the end with one line and no
 * extra markup of their own.
 */
export function BlogSubscribeForm(props: BlogSubscribeFormProps) {
  if (props.variant === 'footer') return <SubscribeForm {...props} />
  return (
    <FlowSection ground="light" className={styles.subscribeSection}>
      <SubscribeForm {...props} />
    </FlowSection>
  )
}
