import "@/styles/framer-site.css"
import { Inter } from "next/font/google"
import { FramerFooter } from "./framer-footer"
import { FramerNav } from "./framer-nav"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export function FramerPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`framer-site ${inter.className}`}>
      <FramerNav />
      <main className="framer-subpage">{children}</main>
      <FramerFooter />
    </div>
  )
}
