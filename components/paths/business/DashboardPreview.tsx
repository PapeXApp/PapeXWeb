import Image from "next/image"
import { Reveal, WordReveal } from "@/components/motion"
import { dashboard } from "./content"

// 3.6 Merchant dashboard — the "Coming soon" pill and notify-email form are
// gone; a real screenshot of the shipping dashboard replaces the placeholder,
// and three feature columns replace the empty space the form used to fill
// (PapeX Home.dc.html:872-907). DashboardNotifyForm.tsx stays in the tree,
// unreferenced, per this path's additive-only rule.
export function DashboardPreview() {
  return (
    <section
      data-nav-theme="dark"
      className="px-[clamp(20px,5vw,56px)] py-[clamp(90px,11vw,160px)]"
      style={{ background: "var(--navy)", color: "var(--offwhite)" }}
    >
      <Reveal as="div" className="mx-auto max-w-[1080px]">
        <div className="text-center">
          <div
            className="mb-[18px] text-[13px] font-semibold uppercase tracking-[.24em]"
            style={{ color: "var(--orange)" }}
          >
            {dashboard.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="mx-auto max-w-[22ch] text-[clamp(30px,4.4vw,58px)] font-bold leading-[1.03] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {dashboard.heading}
          </WordReveal>
          <p
            className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-[1.55]"
            style={{ color: "rgba(245,245,245,.62)" }}
          >
            {dashboard.lead}
          </p>
        </div>

        <Reveal
          variant="mask"
          className="mt-[clamp(40px,5vw,60px)] overflow-hidden rounded-[16px] border"
          style={{ borderColor: "rgba(255,255,255,.1)", boxShadow: "0 40px 90px rgba(0,0,0,.5)" }}
        >
          <Image
            src="/product/merchant-dashboard.png"
            alt={dashboard.dashboardAlt}
            width={2880}
            height={1800}
            className="block h-auto w-full"
          />
        </Reveal>

        <div className="mt-[clamp(40px,5vw,60px)] grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(24px,3vw,44px)]">
          {dashboard.columns.map((column) => (
            <Reveal key={column.title} as="div">
              <div
                className="mb-4 h-[3px] w-10 rounded-[3px]"
                style={{ background: "var(--orange)" }}
              />
              <h3
                className="text-[20px] font-bold leading-[1.2]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {column.title}
              </h3>
              <p
                className="mt-2.5 text-[15.5px] leading-[1.55]"
                style={{ color: "rgba(245,245,245,.6)" }}
              >
                {column.body}
              </p>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
