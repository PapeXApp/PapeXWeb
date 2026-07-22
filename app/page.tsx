import type { Metadata } from "next"
import { Homepage } from "@/components/site/homepage"

export const metadata: Metadata = {
  title: "PapeX | The last receipt you'll ever lose",
  description:
    "PapeX turns paper receipts digital. Tap your phone at checkout and your receipt is saved forever — organized, searchable, and yours. No app required to receive it.",
}

export default function Home() {
  return <Homepage />
}
