"use client"

import Link from "next/link"
import { useState } from "react"
import { Reveal, RevealGroup } from "./anim"
import { FAQ_ITEMS } from "./constants"

export function FramerFaq() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="faq">
      <div className="framer-container faq-layout">
        <Reveal as="header" direction="up" className="faq-head">
          <p className="section-label">FAQ</p>
          <h2 className="section-title">Questions you might have.</h2>
          <p className="section-intro">Everything you need to know before getting started.</p>
          <Link href="/contact" className="btn-outline">
            Ask a question
          </Link>
        </Reveal>
        <RevealGroup as="div" stagger={0.08} className="faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <Reveal as="div" direction="up" key={item.question} className={`faq-item${isOpen ? " open" : ""}`}>
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  {item.question}
                  <svg className="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                {item.answer ? (
                  <div className="faq-answer-wrap">
                    <div className="faq-answer">{item.answer}</div>
                  </div>
                ) : null}
              </Reveal>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}
