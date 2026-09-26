"use client"

import Link from "next/link"
import {
  isValidElement,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { ScrollReveal, ScrollWords } from "@/components/motion"
import { FlowSection, type Ground } from "./FlowSection"
import { SectionLabel } from "./SectionLabel"
import styles from "./faq.module.css"

/**
 * One FAQ item. `a` is either:
 *   - a string (the normal case, so copy files stay plain `.ts` data).
 *     Blank lines split paragraphs, and `[label](href)` becomes a link:
 *     `/path` → next/link, `#id` → same-page anchor, `https://…` → new tab.
 *   - a ReactNode, rendered as-is (its text is extracted for the JSON-LD).
 * `hidden: true` keeps an item out of the page AND out of the JSON-LD — used
 * for answers still waiting on Nico. Flip it off to publish.
 */
export type FaqItem = {
  q: string
  a: ReactNode | string
  hidden?: boolean
}

export type FaqProps = {
  /** Anchor for the section, e.g. "faq" (footer links point at #faq). */
  id?: string
  /** The bracketed section number, e.g. "07". */
  eyebrowIndex: string
  /** The eyebrow words after the index. Default "FAQ". */
  eyebrow?: string
  heading: string
  items: FaqItem[]
  ground: Ground
}

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g

/** `[label](href)` → the label, for plain text (JSON-LD). */
function stripLinks(text: string): string {
  return text.replace(LINK_RE, "$1")
}

/** Plain text of any ReactNode tree, for the JSON-LD `text` field. */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string") return stripLinks(node)
  if (typeof node === "number" || typeof node === "bigint") return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join("")
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children)
  return ""
}

function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(LINK_RE)) {
    const [whole, label, href] = match
    const at = match.index ?? 0
    if (at > last) out.push(text.slice(last, at))
    const key = `${keyBase}-${at}`
    if (href.startsWith("/")) {
      out.push(
        <Link key={key} href={href}>
          {label}
        </Link>,
      )
    } else if (href.startsWith("#")) {
      out.push(
        <a key={key} href={href}>
          {label}
        </a>,
      )
    } else {
      out.push(
        <a key={key} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>,
      )
    }
    last = at + whole.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function Answer({ a }: { a: FaqItem["a"] }) {
  if (typeof a !== "string") return <>{a}</>
  const paragraphs = a.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{renderInline(p, `p${i}`)}</p>
      ))}
    </>
  )
}

/** Inline JSON must not be able to close its own <script>. */
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

/**
 * The shared FAQ accordion (spec 2026-09-24 §3.2 row 07, §3.3 row 06).
 *
 * Renders its own FlowSection, so a path mounts it in one line. Real
 * disclosure semantics: each question is an `<h3><button aria-expanded
 * aria-controls>`, each answer a `role="region"` labelled by its button.
 * Any number of items can be open at once. Keyboard: Enter/Space toggle
 * (native button), ↑/↓ move between questions, Home/End jump to the ends.
 *
 * Motion lives entirely in faq.module.css (transform/opacity, plus the one
 * grid-rows height channel on the panel wrapper) and is switched off under
 * prefers-reduced-motion.
 *
 * Emits FAQPage JSON-LD from the VISIBLE items only, so structured data never
 * claims an answer the page doesn't show.
 */
export function Faq({ id, eyebrowIndex, eyebrow = "FAQ", heading, items, ground }: FaqProps) {
  const visible = useMemo(() => items.filter((item) => !item.hidden), [items])
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set())
  const baseId = useId()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const toggle = useCallback((index: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const last = visible.length - 1
      let target: number | null = null
      if (event.key === "ArrowDown") target = index === last ? 0 : index + 1
      else if (event.key === "ArrowUp") target = index === 0 ? last : index - 1
      else if (event.key === "Home") target = 0
      else if (event.key === "End") target = last
      if (target === null) return
      event.preventDefault()
      buttons.current[target]?.focus()
    },
    [visible.length],
  )

  const jsonLd = useMemo(
    () =>
      safeJson({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: visible.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: (typeof item.a === "string" ? stripLinks(item.a) : nodeText(item.a)).replace(/\s+/g, " ").trim(),
          },
        })),
      }),
    [visible],
  )

  if (visible.length === 0) return null

  return (
    <FlowSection ground={ground} id={id} index={eyebrowIndex} className={styles.section}>
      <div className={styles.inner}>
        {/* P3-R1: scroll-linked — label, title word by word, hint, then each
            question rises on its own position. */}
        <div className={styles.head}>
          <ScrollReveal>
            <SectionLabel index={eyebrowIndex}>{eyebrow}</SectionLabel>
          </ScrollReveal>
          <ScrollWords as="h2" className={styles.heading}>
            {heading}
          </ScrollWords>
          <ScrollReveal as="p" className={styles.hint}>
            Pick a question to see the answer.
          </ScrollReveal>
        </div>

        <div>
          <ul className={styles.list}>
            {visible.map((item, index) => {
              const isOpen = open.has(index)
              const buttonId = `${baseId}-q${index}`
              const panelId = `${baseId}-a${index}`
              return (
                <ScrollReveal as="li" key={item.q} className={styles.item} data-open={isOpen}>
                  <span aria-hidden="true" className={styles.rule} />
                  <h3 className={styles.qHeading}>
                    <button
                      ref={(el) => {
                        buttons.current[index] = el
                      }}
                      id={buttonId}
                      type="button"
                      className={styles.button}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(index)}
                      onKeyDown={(event) => onKeyDown(event, index)}
                    >
                      <span aria-hidden="true" className={styles.num}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.qText}>{item.q}</span>
                      <span aria-hidden="true" className={styles.icon} data-nojs="faq-icon">
                        <span className={styles.bar} data-nojs="faq-bar" />
                        <span className={`${styles.bar} ${styles.barV}`} data-nojs="faq-bar-v" />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={styles.panel}
                    data-nojs="faq-panel"
                  >
                    <div className={styles.panelClip} data-nojs="faq-clip">
                      <div className={styles.answer} data-nojs="faq-answer">
                        <Answer a={item.a} />
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </ul>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </FlowSection>
  )
}

export default Faq
