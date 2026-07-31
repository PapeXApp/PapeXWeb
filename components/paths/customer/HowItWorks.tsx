"use client";

import { PinnedSequence, Reveal, WordReveal } from "@/components/motion";
import type { PinnedSequenceState } from "@/components/motion";
import { howItWorksContent, receipt, receiptsListContent } from "./content";
import { ReceiptCard } from "./ReceiptCard";
import styles from "./customer.module.css";

/** 2.6 How it works — light. The pinned scroll sequence (desktop) + stacked fallback (<820px), both driven by PinnedSequence. */
export function HowItWorks() {
  return (
    <div data-nav-theme="light">
      <PinnedSequence
        steps={howItWorksContent.steps.length}
        className="bg-[var(--offwhite)] text-[var(--navy)]"
        stageClassName="flex items-center"
        mobileClassName="block bg-[var(--offwhite)] text-[var(--navy)] px-[clamp(20px,5vw,56px)] py-[clamp(90px,11vw,160px)]"
        renderMobileStep={(index) => {
          const step = howItWorksContent.steps[index];
          return (
            <>
              {index === 0 ? (
                <Reveal
                  variant="up"
                  style={{ textAlign: "center", margin: "0 auto 48px" }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "clamp(30px,7vw,44px)",
                      lineHeight: 1.03,
                      letterSpacing: "-.02em",
                      maxWidth: "22ch",
                      marginLeft: "auto",
                      marginRight: "auto",
                    }}
                  >
                    {howItWorksContent.mobileHeadline}
                  </h2>
                </Reveal>
              ) : null}
              <Reveal
                variant="up"
                style={{ textAlign: "center", marginTop: index > 0 ? 32 : 0, maxWidth: 1150, marginInline: "auto" }}
              >
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center"
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: "var(--navy)",
                    color: "var(--orange)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 22,
                    margin: "0 auto 18px",
                  }}
                >
                  {index + 1}
                </div>
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20 }}>{step.mobileTitle}</h4>
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 15,
                    color: "#5a5a5a",
                    lineHeight: 1.5,
                    maxWidth: "30ch",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  {step.mobileBody}
                </p>
              </Reveal>
            </>
          );
        }}
      >
        {({ activeIndex, localProgress }: PinnedSequenceState) => (
          <div
            className="grid items-center"
            style={{
              maxWidth: 1150,
              margin: "0 auto",
              width: "100%",
              padding: "0 clamp(20px,5vw,56px)",
              gridTemplateColumns: "1fr 1fr",
              gap: "clamp(30px,6vw,90px)",
            }}
          >
            <div>
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
                {howItWorksContent.eyebrow}
              </div>
              <WordReveal
                as="h2"
                className="[font-family:var(--font-display)] font-bold text-[clamp(34px,4.4vw,60px)] leading-[1.02] tracking-[-.02em]"
              >
                {howItWorksContent.headline}
              </WordReveal>
              <div className="grid" style={{ marginTop: "clamp(30px,4vw,48px)", gap: 8 }}>
                {howItWorksContent.steps.map((step, index) => {
                  const isActive = index === activeIndex;
                  const isPast = index < activeIndex;
                  const fillHeight = isPast ? "100%" : isActive ? `${localProgress * 100}%` : "0%";
                  return (
                    <div
                      key={step.number}
                      className="flex"
                      style={{
                        gap: 22,
                        opacity: isActive ? 1 : 0.32,
                        transform: isActive ? "translateX(0)" : "translateX(-8px)",
                        transition: "opacity .45s ease, transform .45s ease",
                      }}
                    >
                      <div
                        className="relative self-stretch"
                        style={{ width: 3, borderRadius: 3, background: "var(--hairline-light)", flex: "0 0 3px" }}
                      >
                        <div
                          className="absolute left-0 top-0"
                          style={{
                            width: "100%",
                            height: fillHeight,
                            background: "var(--orange)",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                      <div style={{ paddingBottom: index < howItWorksContent.steps.length - 1 ? 22 : 0 }}>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: 14,
                            color: "var(--orange)",
                            letterSpacing: ".04em",
                          }}
                        >
                          {step.number}
                        </div>
                        <h4
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            fontSize: "clamp(21px,2.4vw,28px)",
                            marginTop: 3,
                          }}
                        >
                          {step.title}
                        </h4>
                        <p style={{ marginTop: 7, fontSize: 15, color: "#5a5a5a", lineHeight: 1.5, maxWidth: "34ch" }}>
                          {step.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center">
              <div
                className="relative"
                style={{
                  height: "min(560px,60vh)",
                  aspectRatio: "300 / 600",
                  borderRadius: 44,
                  background: "linear-gradient(160deg,#0a2431,#04161f)",
                  border: "2px solid rgba(255,255,255,.1)",
                  boxShadow: "0 40px 90px rgba(0,18,29,.28)",
                  padding: 14,
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute"
                  style={{
                    top: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 90,
                    height: 24,
                    background: "#04161f",
                    borderRadius: "0 0 14px 14px",
                    zIndex: 8,
                  }}
                />
                <div
                  className="relative"
                  style={{ width: "100%", height: "100%", borderRadius: 30, overflow: "hidden", background: "var(--offwhite)" }}
                >
                  {/* state 0: tap */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{
                      opacity: activeIndex === 0 ? 1 : 0,
                      transform: activeIndex === 0 ? "translateY(0) scale(1)" : "translateY(24px) scale(.97)",
                      pointerEvents: activeIndex === 0 ? "auto" : "none",
                      transition: "opacity .5s ease, transform .5s ease",
                      gap: 24,
                      padding: 28,
                      background: "var(--offwhite)",
                    }}
                  >
                    <div className="relative flex items-center justify-center" style={{ width: 130, height: 130 }}>
                      <span
                        aria-hidden="true"
                        className={styles.pinnedNfcRing}
                        style={{ position: "absolute", top: "50%", left: "50%", width: 130, height: 130, borderRadius: "50%", border: "2px solid var(--orange)" }}
                      />
                      <span
                        aria-hidden="true"
                        className={styles.pinnedNfcRingOffset}
                        style={{ position: "absolute", top: "50%", left: "50%", width: 130, height: 130, borderRadius: "50%", border: "2px solid var(--orange)" }}
                      />
                      <span
                        aria-hidden="true"
                        className="relative"
                        style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--orange)", boxShadow: "0 0 0 10px rgba(235,113,0,.16)" }}
                      />
                    </div>
                    <div className="text-center">
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--navy)" }}>
                        {howItWorksContent.steps[0].phoneHeadline}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#8a8a8a" }}>{howItWorksContent.steps[0].phoneSubline}</div>
                    </div>
                  </div>

                  {/* state 1: receipt appears */}
                  <div
                    className="absolute inset-0 flex flex-col justify-center"
                    style={{
                      opacity: activeIndex === 1 ? 1 : 0,
                      transform: activeIndex === 1 ? "translateY(0) scale(1)" : "translateY(24px) scale(.97)",
                      pointerEvents: activeIndex === 1 ? "auto" : "none",
                      transition: "opacity .5s ease, transform .5s ease",
                      padding: 20,
                      background: "var(--offwhite)",
                    }}
                  >
                    <ReceiptCard data={receipt} />
                    <div className="text-center" style={{ marginTop: 14, fontSize: 12, color: "#8a8a8a" }}>
                      {howItWorksContent.steps[1].phoneCaption}
                    </div>
                  </div>

                  {/* state 2: organized */}
                  <div
                    className="absolute inset-0 flex flex-col"
                    style={{
                      opacity: activeIndex === 2 ? 1 : 0,
                      transform: activeIndex === 2 ? "translateY(0) scale(1)" : "translateY(24px) scale(.97)",
                      pointerEvents: activeIndex === 2 ? "auto" : "none",
                      transition: "opacity .5s ease, transform .5s ease",
                      gap: 11,
                      padding: "20px 16px",
                      background: "var(--offwhite)",
                    }}
                  >
                    <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>
                        Receipts
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex items-center justify-center"
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--orange)", color: "#fff", fontWeight: 700, fontSize: 12 }}
                      >
                        P
                      </span>
                    </div>
                    <div
                      className="flex items-center"
                      style={{ gap: 8, background: "#fff", borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "#9a9a9a" }}
                    >
                      {receiptsListContent.searchPlaceholder}
                    </div>
                    {receiptsListContent.rows.map((row) => (
                      <div
                        key={row.merchant}
                        className="flex items-center justify-between"
                        style={{ background: "#fff", borderRadius: 12, padding: "12px 13px" }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--navy)" }}>{row.merchant}</div>
                          <div style={{ fontSize: 10, color: "var(--orange)", marginTop: 2 }}>{row.category}</div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>{row.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PinnedSequence>
    </div>
  );
}
