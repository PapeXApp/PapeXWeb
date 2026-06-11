import "@/styles/framer-site.css"
import { Inter } from "next/font/google"
import { FramerFaq } from "./framer-faq"
import { FramerFeatures } from "./framer-features"
import { FramerFooter } from "./framer-footer"
import { FramerHero } from "./framer-hero"
import { FramerHowItWorks } from "./framer-how-it-works"
import { FramerIntegrations } from "./framer-integrations"
import { FramerNav } from "./framer-nav"
import { AnimationProviders, FlightRoute, FlyToTop } from "./anim"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export function FramerLandingPage() {
  return (
    <AnimationProviders>
      <div className={`framer-site ${inter.className}`}>
        <FlyToTop />
        <FramerNav />
        <main>
          <FlightRoute />
          <FramerHero />
          <FramerFeatures />
          <FramerIntegrations />
          <FramerHowItWorks />
          <FramerFaq />
        </main>
        <FramerFooter />
      </div>
    </AnimationProviders>
  )
}
