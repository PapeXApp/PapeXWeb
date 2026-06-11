"use client"

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
              src="/blog/receipt-hate.png"
              alt="Why Every Business Owner Secretly Hates Printing Receipts (But Keeps Doing It)"
              fill
              className="object-cover object-center"
              priority
            />
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-[#0a3d62] mb-4 leading-tight">
              Why Every Business Owner Secretly Hates Printing Receipts (But Keeps Doing It)
            </h1>
            <div className="flex items-center gap-4 text-sm text-[#0a3d62]/70 mb-6">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>June 7, 2025</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <article className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#8ab5d1]/20">
              <p className="text-lg text-[#0a3d62] leading-relaxed mb-6">
                Picture this: It's 2:47 PM on a Tuesday, your lunch rush just ended, and you're staring at the receipt printer that's been jamming all morning. Again.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Most business owners dislike checkout tasks. After payment processing fees, receipt printing is usually their next complaint. Walk into most businesses today, and you'll hear the familiar sound of thermal printers. They churn out paper receipts, one transaction at a time.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Overlooked Costs Adding Up Behind Your Counter
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Many customers don't know this: that simple receipt costs your business more than expected.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                The math is tough: Paper receipts cost about $0.015 to $0.05 each. Plus, every transaction needs a proof of purchase. Those costs add up fast when you're processing hundreds of transactions daily.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                But the actual cost isn't just the paper. It's everything else that comes with it:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>Printer maintenance and repairs (because thermal printers love to jam at the worst possible moments)</li>
                <li>Staff time replacing paper rolls, clearing jams, and dealing with "sorry, our printer is down"</li>
                <li>Storage space for boxes of receipt paper that somehow always run out during your busiest days</li>
                <li>Customer frustration when receipts fade, smudge, or don't print at all</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                For something so small, receipts create a surprisingly big mess behind the counter.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                When Checkout Gets Clunky
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Every business owner knows this routine by heart:
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                "Would you like your receipt?"
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Half your customers say no—and you print it anyway because your system defaults to printing. The other half say yes, then quickly shove it in their pocket. It will stay there until laundry day, slowly turning into unreadable thermal paper confetti.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                You watch customers fumble for email addresses at checkout, slowing down your line. You see them decline email receipts because they're tired of inbox clutter. And you keep printing paper receipts because, well, what else are you supposed to do?
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                This Should Be Automatic by Now
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Here's the frustration every business owner feels: everything else has gone digital. You take payments with your phone, manage inventory in the cloud, and track sales in real-time.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                But somehow, you're still feeding paper into a machine like technology forgot about this one thing.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                We've digitized payments. But the last step—proof of purchase—still relies on a paper receipt.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                This costs money, creates waste, and often fails when you need it most.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                We're Stuck in the Middle
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                The truth is, receipt printing exists in this weird limbo between old and new systems. Your point-of-sale system is digital. Your payment processing is digital. Your customers want digital convenience. But that final handoff—the receipt—gets printed on paper, creating an analog roadblock in an otherwise digital transaction.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Business owners keep printing receipts because:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>Customer expectations: People still expect to receive proof of purchase</li>
                <li>Returns and exchanges: You need transaction records for refunds</li>
                <li>Accounting requirements: Businesses need receipt data for bookkeeping and taxes</li>
                <li>Lack of better alternatives: Email receipts create spam, and there hasn't been a seamless digital option</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Everything else has evolved. The receipt just hasn't gotten the memo.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                What If There Was a Better Way?
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Imagine if receipts just… worked. No paper to load, no printers to jam, no asking for email addresses. Just automatic, digital proof of purchase that shows up on your customer's phone the second they pay.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                This kind of simplicity isn't futuristic—it's already here. PapeX is designed so receipts automatically appear on your phone.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                There's no extra hardware or change to your checkout flow. It's a small shift with a big impact, making receipts one less thing you have to think about.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Future is Digital
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Every time you reload that receipt printer, you're paying for a system that's stuck in the past.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                And yet, it doesn't have to be this way.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                PapeX offers an easier alternative—one that fits into how you already operate, without adding complexity. Your checkout process doesn't need an overhaul—just a smarter way to handle receipts.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Less paper, fewer delays, and one less thing to worry about behind the counter.
              </p>

              <hr className="my-8" />

              <p className="text-[#0a3d62] leading-relaxed mb-6 font-bold">
                Ready to eliminate printer headaches and cut receipt costs for good? <a href="https://papex.app" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">Join our waitlist at papex.app</a>. Be among the first businesses to make paper receipts a thing of the past.
              </p>
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
      </div>
    </FramerPageShell>
  )
} 