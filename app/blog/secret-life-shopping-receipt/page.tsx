'use client'

import Image from "next/image"
import Link from "next/link"
import { Calendar, ArrowLeft } from "lucide-react"
import { FramerPageShell } from "@/components/framer/framer-page-shell"

export default function BlogPost() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back to Blog */}
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-[#0a3d62] hover:text-[#ff9933] transition-colors mb-8 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Hero Image */}
          <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden mb-8">
            <Image
              src="/blog/blog4.png"
              alt="The Secret Life of Your Shopping Receipt"
              fill
              className="object-cover object-top"
              priority
            />
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-[#0a3d62] mb-4 font-gloock leading-tight">
              The Secret Life of Your Shopping Receipt: What Happens After You Toss It
            </h1>
            <div className="flex items-center gap-4 text-sm text-[#0a3d62]/70 mb-6">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>June 16, 2025</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <article className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#8ab5d1]/20">
              <p className="text-lg text-[#0a3d62] leading-relaxed mb-6">
                You grab your coffee, stuff the receipt in your pocket, and forget about it. Later, you find it crumpled in your jeans and toss it in the trash without a second thought. But what if I told you that innocent slip of paper has quite the story to tell?
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Let's follow one receipt on its unlikely journey through our world.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4 font-gloock">
                The Birth of a Receipt
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                Our story begins at 8:23 AM on a Tuesday. Sarah buys her usual oat milk latte, and with a quick whirr from the thermal printer, our receipt enters the world. It's roughly 4 inches long, weighs almost nothing, and contains a chemical coating that makes it shiny and heat-sensitive.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                That shiny coating? It's not just for looks. Most receipts are coated with BPA (bisphenol A) or BPS (bisphenol S)—chemicals that help the text appear when heated but can't be recycled with regular paper. Our receipt is now officially part of a massive daily ritual happening across America.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4 font-gloock">
                The Short Life at Home
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                Sarah pockets the receipt, where it mingles with her keys and phone for exactly 3 hours and 22 minutes. She discovers it while looking for her earbuds, glances at it briefly (wondering why a simple coffee costs so much), and tosses it in the kitchen trash.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                This is where things get interesting.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4 font-gloock">
                The Landfill Years
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                Our receipt joins millions of others in a garbage truck, then gets compressed and transported to a landfill. Unlike regular paper that breaks down relatively quickly, thermal paper receipts are built to last. The chemical coating that made them functional now makes them incredibly persistent.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                In the landfill, our receipt settles in for the long haul. While a regular piece of paper might decompose in 2-6 weeks, our receipt could stick around for years. The chemicals don't just disappear—they can leach into groundwater, potentially affecting local ecosystems.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4 font-gloock">
                The Recycling Confusion
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                But wait—what if Sarah had tried to recycle it instead?
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Here's where the plot thickens. If our receipt had ended up in the recycling bin, it would have caused problems there too. The thermal coating can contaminate entire batches of recycled paper, turning what should be a clean process into a complicated mess. Most recycling facilities actually have to filter out thermal paper receipts, sending them right back to... you guessed it... the landfill.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4 font-gloock">
                The Email Alternative Plot Twist
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Now, some receipts take a different path entirely. They get sent to email inboxes, where they live digital lives, cluttering up Gmail accounts and getting lost in endless threads. These digital receipts don't harm trees, but they come with their own problems—they're easy to lose track of, hard to organize, and contribute to the digital overwhelm that many of us feel every day.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4 font-gloock">
                A Different Ending
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                But what if there was another way? What if receipts could be useful without being wasteful?
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Imagine if every time you made a purchase, your receipt simply appeared in an app on your phone—organized, searchable, and ready when you need it for returns, taxes, or expense tracking. No paper waste, no cluttered email, no lost receipts stuffed in pockets.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                This isn't just wishful thinking. The technology exists to make receipts work for us instead of against our planet. When every purchase can be automatically captured and organized digitally, we eliminate the waste while keeping all the utility.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4 font-gloock">
                The Real Impact
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                The next time you're handed a receipt, remember its secret life. That small slip of paper represents a choice—between old habits and new possibilities, between waste and efficiency, between losing track of purchases and having them organized automatically.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Your receipt's story doesn't have to end in a landfill. With the right technology, it could have a much more useful—and sustainable—plot.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-8">
                What story will your next receipt tell?
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-8">
                Ready to change how you handle receipts? PapeX automatically captures and organizes every receipt from any purchase, with no paper waste and no email clutter. <a href="https://www.papex.app/waitlist/" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">Join our waitlist</a> to be among the first to experience truly effortless receipt management.
              </p>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-[#0a3d62]/5 to-[#ff9933]/5 p-6 rounded-lg border border-[#ff9933]/20 text-center">
                <h3 className="text-xl font-bold text-[#0a3d62] mb-3 font-gloock">Experience the Future of Receipts</h3>
                <p className="text-[#0a3d62] mb-4">Stop losing receipts. Start organizing them automatically.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link 
                    href="https://www.papex.app/waitlist/" 
                    className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] hover:opacity-90 text-white font-medium shadow-md border-none rounded-full px-6 py-3 transition-all"
                  >
                    Join Our Waitlist
                  </Link>
                  <Link 
                    href="https://www.papex.app/" 
                    className="bg-white text-[#0a3d62] border border-[#0a3d62]/20 hover:bg-[#0a3d62] hover:text-white font-medium rounded-full px-6 py-3 transition-all"
                  >
                    Learn More About PapeX
                  </Link>
                </div>
              </div>
            </div>
          </article>

          {/* Navigation */}
          <div className="mt-12 flex justify-between items-center">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-[#0a3d62] hover:text-[#ff9933] transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Posts
            </Link>
          </div>
        </div>

        <div className="mt-16 relative">
          <div className="relative flex items-center">
            <div className="flex-1">
              <div className="w-full h-0.5 border-b border-dashed border-[#ff9933]"></div>
            </div>
            <div className="flex-shrink-0 ml-2">
              <Image 
                src="/logos/trans.png"
                alt="PapeX Logo" 
                width={32} 
                height={32}
                className="transform rotate-45"
              />
            </div>
          </div>
        </div>
      </div>
    </FramerPageShell>
  )
} 