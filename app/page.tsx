import type { Metadata } from "next"
import { FramerLandingPage } from "@/components/framer/framer-landing-page"

export const metadata: Metadata = {
  title: "PapeX | Never Lose a Receipt Again",
  description:
    "PapeX automatically captures and organizes every transaction after purchase, so nothing gets lost, and every deduction is accounted for.",
}

export default function Home() {
  return <FramerLandingPage />
}
