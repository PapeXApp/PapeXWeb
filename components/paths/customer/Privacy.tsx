"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ScrollReveal, ScrollWords } from "@/components/motion"
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion"
import { FlowSection } from "../shared/FlowSection"
import { NextSection } from "../shared/NextSection"
import { SectionLabel } from "../shared/SectionLabel"
import { visionContent } from "./content"
import styles from "./privacy.module.css"

/**
 * /customers section 06 — "Your receipt, not your identity." (spec 2026-09-24
 * §3.2). Light ground, between Features (05, navy) and Get it (07, navy).
 *
 * Every claim here is sourced:
 *   - a tap collects no personal info or card details → /support
 *   - receipts only ever show the last 4 digits of the card → /pci
 *   - "Never touches card data" (Nico's line, 2.1 merge) links to /pci
 *   - you can delete receipts and your account in the app → spec §2 Q6
 * The list is titled "What a tap never collects", not "What we never collect":
 * the app itself does hold an account (sign-in), so only the TAP can truthfully
 * promise "no name, no email, no sign-up".
 *
 * The interaction: a small receipt whose card number redacts itself as it
 * comes into view — the first twelve digits turn into navy redaction blocks,
 * the last four stay, and a "Receipt only" stamp lands. It's reversible: the
 * card re-arms once it has left the screen entirely, so scrolling back plays
 * it again. transform / opacity / clip-path only.
 *
 * States: "rest" (server render, no-JS, reduced motion) looks REDACTED with no
 * motion, so the page never shows an unredacted number without the animation
 * that explains it. After mount (motion allowed) it arms to "clear" and the
 * observer flips it to "redacted" on entry.
 */

type Phase = "rest" | "clear" | "redacted"

const NEVER_COLLECTED = [
  "Your name",
  "Your email or phone number",
  "Your card number",
  "An account or a sign-up",
]

/** 4242… is the well-known dummy test card number, not a real card. */
const HIDDEN_GROUPS = ["4242", "4242", "4242"]
const KEPT_GROUP = "4242"

export function Privacy({ eyebrowIndex }: { eyebrowIndex: string }) {
  return (
    <FlowSection id="privacy" ground="light" index={eyebrowIndex} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          {/* P3-R1: scroll-linked — label, title word by word, each line of
              copy, the "never collects" card; the receipt rises beside them. */}
          <ScrollReveal>
            <SectionLabel index={eyebrowIndex}>Privacy</SectionLabel>
          </ScrollReveal>
          <ScrollWords as="h2" className={styles.heading}>
            Your receipt, not your identity.
          </ScrollWords>
          <ScrollReveal as="p" className={styles.lead}>
            A tap sends your receipt, and only your receipt. No sign-up, no personal info.
          </ScrollReveal>
          <ScrollReveal as="p" className={styles.body}>
            Save it to the PapeX app and it&apos;s yours: delete a receipt, or your whole account, any time.
          </ScrollReveal>
          <ScrollReveal as="p" className={styles.body}>
            Never touches card data.{" "}
            <Link href="/pci" className={styles.inlineLink}>
              How we handle payments
            </Link>
          </ScrollReveal>

          <ScrollReveal className={styles.never}>
            <h3 className={styles.neverTitle}>What a tap never collects</h3>
            <ul className={styles.neverList}>
              {NEVER_COLLECTED.map((item) => (
                <li key={item} className={styles.neverItem}>
                  <svg aria-hidden="true" viewBox="0 0 20 20" className={styles.neverIcon}>
                    <circle cx="10" cy="10" r="8" />
                    <path d="M4.5 15.5 15.5 4.5" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/privacy" className={styles.policyLink}>
              Read our privacy policy
              <span aria-hidden="true" className={styles.arrow}>
                →
              </span>
            </Link>
          </ScrollReveal>
        </div>

        <ScrollReveal order={1} className={styles.stage}>
          <RedactingReceipt />
        </ScrollReveal>
      </div>
      <NextSection targetId="get-it" name={visionContent.eyebrow} />
    </FlowSection>
  )
}

function RedactingReceipt() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useSafeReducedMotion()
  const [phase, setPhase] = useState<Phase>("rest")

  useEffect(() => {
    const el = ref.current
    if (reduced || !el || typeof IntersectionObserver === "undefined") {
      setPhase("rest")
      return
    }
    setPhase("clear")
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        // Redact once most of the card is on screen; re-arm only once it is
        // fully gone, so nobody watches it un-redact while scrolling away.
        if (entry.intersectionRatio >= 0.55) setPhase("redacted")
        else if (!entry.isIntersecting) setPhase("clear")
      },
      { threshold: [0, 0.55] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  return (
    <div
      ref={ref}
      className={styles.receipt}
      data-phase={phase}
      role="img"
      aria-label="Example receipt from Tidewick Cafe. The card line shows only the last 4 digits: 4242."
    >
      <div aria-hidden="true">
        <div className={styles.rHead}>
          <span className={styles.rMono}>T</span>
          <span>
            <span className={styles.rMerchant}>Tidewick Cafe</span>
            <span className={styles.rMeta}>Mon Jun 8 · 10:24</span>
          </span>
        </div>

        <div className={styles.rRule} />
        <div className={styles.rRow}>
          <span>Oat latte</span>
          <span>$5.50</span>
        </div>
        <div className={styles.rRow}>
          <span>Almond croissant</span>
          <span>$4.25</span>
        </div>
        <div className={styles.rRow}>
          <span>Tax</span>
          <span>$0.85</span>
        </div>
        <div className={styles.rRule} />
        <div className={`${styles.rRow} ${styles.rTotal}`}>
          <span>Total</span>
          <span>$10.60</span>
        </div>

        <div className={styles.rCard}>
          <span className={styles.rCardLabel}>Card</span>
          <span className={styles.rPan}>
            {HIDDEN_GROUPS.map((digits, i) => (
              <span key={i} className={styles.group} style={{ ["--i" as string]: i }}>
                <span className={styles.digits}>{digits}</span>
                <span className={styles.block}>
                  <span className={styles.dots}>••••</span>
                </span>
              </span>
            ))}
            <span className={styles.kept}>{KEPT_GROUP}</span>
          </span>
        </div>
        <div className={styles.stamp}>Receipt only</div>
      </div>
    </div>
  )
}

export default Privacy
