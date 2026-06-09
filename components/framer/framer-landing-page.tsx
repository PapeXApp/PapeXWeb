import "@/styles/framer-site.css"
import { Inter } from "next/font/google"
import { FramerFaq } from "./framer-faq"
import { FramerFeatures } from "./framer-features"
import { FramerFooter } from "./framer-footer"
import { FramerHero } from "./framer-hero"
import { FramerHowItWorks } from "./framer-how-it-works"
import { FramerIntegrations } from "./framer-integrations"
import { FramerNav } from "./framer-nav"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export function FramerLandingPage() {
  return (
    <div className={`framer-site ${inter.className}`}>
      <FramerNav />
      <main>
        <FramerHero />
        <FramerFeatures />
        <FramerIntegrations />
        <FramerHowItWorks />
        <FramerFaq />
      </main>
      <FramerFooter />
    </div>
  )
}
