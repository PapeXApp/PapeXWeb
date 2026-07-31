"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Reveal, Ripple, WordReveal } from "@/components/motion";
import { personasContent, type PersonaId } from "./content";
import styles from "./customer.module.css";

/** 2.4 Personas — white, interactive persona selection (keeper / casual / non-keeper). */
export function Personas() {
  const [selected, setSelected] = useState<PersonaId | null>(null);

  const statusMessage = selected
    ? personasContent.cards.find((card) => card.id === selected)?.message ?? personasContent.defaultStatus
    : personasContent.defaultStatus;

  return (
    <section
      data-nav-theme="light"
      style={{
        background: "var(--white)",
        color: "var(--navy)",
        padding: "clamp(90px,11vw,160px) clamp(20px,5vw,56px)",
      }}
    >
      <div style={{ maxWidth: 1150, margin: "0 auto" }}>
        <Reveal variant="up" style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: ".24em",
              textTransform: "uppercase",
              color: "var(--orange)",
              marginBottom: 18,
            }}
          >
            {personasContent.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="mx-auto max-w-[24ch] [font-family:var(--font-display)] font-bold text-[clamp(30px,4.4vw,58px)] leading-[1.03] tracking-[-.02em]"
          >
            {personasContent.headline}
          </WordReveal>
        </Reveal>

        <div
          role="radiogroup"
          aria-label="Which one are you?"
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "clamp(16px,2vw,26px)",
            marginTop: "clamp(50px,6vw,80px)",
          }}
        >
          {personasContent.cards.map((card) => {
            const isSelected = selected === card.id;
            return (
              <Reveal variant="up" key={card.id}>
                <Ripple variant="orange">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelected(card.id)}
                    className={cn(
                      "relative block w-full overflow-hidden text-left",
                      styles.personaCard,
                      isSelected && styles.personaCardSelected,
                    )}
                    style={{
                      background: isSelected ? "#fff" : "var(--offwhite)",
                      border: isSelected ? "1.5px solid var(--orange)" : "1.5px solid transparent",
                      padding: "34px 30px",
                      borderRadius: 20,
                      transform: isSelected ? "translateY(-8px)" : "translateY(0)",
                      boxShadow: isSelected ? "0 26px 55px rgba(235,113,0,.22)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      /* TODO: promote to token — README lists Courier New as the mono
                       * placeholder/persona-eyebrow face but no --font-mono var exists yet. */
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: 12,
                        letterSpacing: ".1em",
                        color: "var(--orange)",
                        marginBottom: 16,
                      }}
                    >
                      {card.eyebrow}
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 24,
                        lineHeight: 1.15,
                      }}
                    >
                      {card.title}
                    </h3>
                    <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.5, color: "#5a5a5a" }}>{card.body}</p>
                  </button>
                </Ripple>
              </Reveal>
            );
          })}
        </div>

        <Reveal
          variant="up"
          style={{ textAlign: "center", marginTop: 36, fontSize: 15, color: "#8a8a8a", minHeight: 24 }}
        >
          <p aria-live="polite">{statusMessage}</p>
        </Reveal>
      </div>
    </section>
  );
}
