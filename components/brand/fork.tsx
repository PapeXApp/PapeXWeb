'use client'

// components/brand/fork.tsx
//
// Screen 1 — the fork. A full-viewport fixed split: dark #00121D "For
// Customers" on top, light #F5F5F5 "For Business" below. One deliberate
// gesture commits to a path; the chosen half's flex-grow runs 1 -> 40 over
// 620ms cubic-bezier(.7,0,.3,1) while the loser collapses, and then we
// navigate.
//
// Color continuity is the whole point: the halves are flat brand colors and
// each destination hero opens on the same flat color, so the expansion reads
// as one surface growing rather than a page swap. Do not put gradients on the
// half backgrounds.
//
// Commit inputs (README "The commit interaction"):
//   wheel up   |deltaY| >= 6  -> customer      wheel down -> business
//   swipe      |dy|     >= 40 -> same mapping
//   click either half, or a nav link while the fork is up (FORK_COMMIT_EVENT)
// A wheelLock latch means one trackpad flick can only ever commit once.

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PATH_HREF, setPathChoice, type PathChoice } from '@/lib/pathChoice'
import { FORK_COMMIT_EVENT } from './site-nav'

const COMMIT_MS = 620
const WHEEL_MIN = 6
const SWIPE_MIN = 40

export function Fork() {
  const router = useRouter()
  const [committing, setCommitting] = useState<PathChoice | null>(null)
  // Refs, not state: the latch must be readable synchronously inside the
  // wheel handler on the very next event, before React re-renders.
  const lock = useRef(false)
  const timer = useRef<number | null>(null)

  const commit = useCallback(
    (choice: PathChoice) => {
      if (lock.current) return
      lock.current = true
      setPathChoice(choice)

      const href = PATH_HREF[choice]
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduced) {
        // Skip the expansion entirely and just go.
        router.push(href)
        return
      }

      setCommitting(choice)
      timer.current = window.setTimeout(() => {
        window.scrollTo(0, 0)
        router.push(href)
      }, COMMIT_MS)
    },
    [router],
  )

  // Warm both destinations so the 620ms expansion is not followed by a stall.
  useEffect(() => {
    router.prefetch(PATH_HREF.customer)
    router.prefetch(PATH_HREF.business)
  }, [router])

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (lock.current || Math.abs(event.deltaY) < WHEEL_MIN) return
      commit(event.deltaY < 0 ? 'customer' : 'business')
    }

    let startY = 0
    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0].clientY
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (lock.current) return
      const dy = startY - event.changedTouches[0].clientY
      if (Math.abs(dy) < SWIPE_MIN) return
      // Swipe up (content moves up, dy > 0) reveals what is above: customers.
      commit(dy < 0 ? 'customer' : 'business')
    }

    const onNavCommit = (event: Event) => {
      const choice = (event as CustomEvent<PathChoice>).detail
      if (choice === 'customer' || choice === 'business') commit(choice)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener(FORK_COMMIT_EVENT, onNavCommit)

    // The fork owns the viewport; stop the page behind it from scrolling (and
    // stop iOS rubber-banding from eating the swipe).
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener(FORK_COMMIT_EVENT, onNavCommit)
      document.body.style.overflow = previousOverflow
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [commit])

  const stateFor = (side: PathChoice) =>
    committing === null ? 'idle' : committing === side ? 'won' : 'lost'

  return (
    <div className="rd-fork" data-committing={committing !== null} data-nav-theme="dark">
      <button
        type="button"
        className="rd-fork-half rd-hairlines"
        data-side="customer"
        data-state={stateFor('customer')}
        onClick={() => commit('customer')}
        aria-label="Enter the customer site"
      >
        <span
          className="rd-fork-glow"
          style={{
            background:
              'radial-gradient(120% 90% at 30% 20%, rgba(235,113,0,.16), transparent 60%)',
          }}
          aria-hidden="true"
        />
        <Image
          src="/brand/plane-white.png"
          alt=""
          width={260}
          height={260}
          className="rd-fork-watermark"
          style={{ top: '22%', left: '5%', opacity: 0.05 }}
        />
        <span className="rd-fork-content">
          <span
            className="rd-eyebrow rd-eyebrow-wide"
            style={{ display: 'block', color: 'var(--orange)', marginBottom: 16 }}
          >
            For Customers
          </span>
          <span
            className="rd-display"
            style={{
              display: 'block',
              fontSize: 'var(--fs-fork-heading)',
              lineHeight: 1.02,
              maxWidth: '15ch',
              margin: '0 auto',
              color: 'var(--offwhite)',
            }}
          >
            Never lose a receipt again.
          </span>
          <span
            className="rd-fork-cue"
            style={{ color: 'rgba(245,245,245,.62)' }}
          >
            <span className="rd-chevron rd-chevron-up" aria-hidden="true" />
            Scroll up or click to enter
          </span>
        </span>
      </button>

      <div className="rd-fork-seam" aria-hidden="true">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 22px',
            width: '100%',
          }}
        >
          <div
            style={{
              height: 1,
              flex: 1,
              background: 'linear-gradient(90deg,transparent,rgba(235,113,0,.5))',
            }}
          />
          <span
            className="rd-seam-glow"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--orange)',
              whiteSpace: 'nowrap',
              letterSpacing: '.02em',
            }}
          >
            Choose your path
          </span>
          <div
            style={{
              height: 1,
              flex: 1,
              background: 'linear-gradient(90deg,rgba(235,113,0,.5),transparent)',
            }}
          />
        </div>
      </div>

      <button
        type="button"
        className="rd-fork-half"
        data-side="business"
        data-state={stateFor('business')}
        onClick={() => commit('business')}
        aria-label="Enter the business site"
      >
        <span
          className="rd-fork-glow"
          style={{
            background:
              'radial-gradient(120% 90% at 70% 80%, rgba(235,113,0,.1), transparent 60%)',
          }}
          aria-hidden="true"
        />
        <Image
          src="/brand/plane-blue.png"
          alt=""
          width={260}
          height={260}
          className="rd-fork-watermark"
          style={{ bottom: '20%', right: '5%', opacity: 0.06 }}
        />
        <span className="rd-fork-content">
          <span
            className="rd-eyebrow rd-eyebrow-wide"
            style={{ display: 'block', color: 'var(--orange)', marginBottom: 16 }}
          >
            For Business
          </span>
          <span
            className="rd-display"
            style={{
              display: 'block',
              fontSize: 'var(--fs-fork-heading)',
              lineHeight: 1.02,
              maxWidth: '16ch',
              margin: '0 auto',
              color: 'var(--navy)',
            }}
          >
            Modern checkout. Zero paper.
          </span>
          <span className="rd-fork-cue" style={{ color: 'rgba(0,18,29,.55)' }}>
            <span className="rd-chevron rd-chevron-down" aria-hidden="true" />
            Scroll down or click to enter
          </span>
        </span>
      </button>
    </div>
  )
}
