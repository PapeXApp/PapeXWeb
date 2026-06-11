'use client'

import Link from "next/link"
import Image from "next/image"
import WaitlistFormEnhanced from "@/components/waitlist-form-enhanced"
import { FramerPageShell } from "@/components/framer/framer-page-shell"

export default function WaitlistPage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl w-full mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0a3d62] mb-4 bg-gradient-to-r from-[#0a3d62] via-[#1a6eb0] to-[#ff9933] bg-clip-text text-transparent">Join Our Waitlist</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#0a3d62] via-[#1a6eb0] to-[#ff9933] mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-[#0a3d62] max-w-2xl mx-auto leading-relaxed">
              PapeX is looking for people to join our waitlist as we search for investors. There is no obligation or commitment on your part. If you're interested, all we need is:
            </p>

            <div className="flex flex-row items-center justify-center mt-8 space-x-6 flex-wrap gap-y-4">
              <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full shadow-sm">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0a3d62] via-[#1a6eb0] to-[#ff9933] flex items-center justify-center text-white font-bold">
                  1
                </div>
                <p className="text-lg text-[#0a3d62] font-medium">Full name</p>
              </div>
              <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full shadow-sm">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0a3d62] via-[#1a6eb0] to-[#ff9933] flex items-center justify-center text-white font-bold">
                  2
                </div>
                <p className="text-lg text-[#0a3d62] font-medium">Email address</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 relative overflow-hidden border border-white/40">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#ff9933]/20 to-[#ff9933]/5 rounded-full -mr-32 -mt-32 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#0a3d62]/20 to-[#0a3d62]/5 rounded-full -ml-32 -mb-32 blur-xl"></div>

            <div className="relative z-10">
              <WaitlistFormEnhanced />

              <div className="mt-8 text-center text-sm text-[#0a3d62]">
                <p>Your support is greatly appreciated!</p>
                <p className="mt-2">
                  <Link href="/" className="text-[#ff9933] hover:text-[#e67e22] transition-colors">
                    Return to homepage
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center relative">
            <div className="relative flex items-center">
              <div className="flex-1">
                <div className="w-full h-0.5 border-b border-dashed border-[#ff9933]"></div>
              </div>
              <div className="flex-shrink-0 mx-2 px-2">
                <Image 
                  src="/logos/plane.png"
                  alt="PapeX Logo" 
                  width={42} 
                  height={42}
                  className="transform -rotate-60 opacity-80"
                />
              </div>
              <div className="flex-1">
                <div className="w-full h-0.5 border-b border-dashed border-[#ff9933]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FramerPageShell>
  )
}

