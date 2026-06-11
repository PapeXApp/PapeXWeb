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
              src="/blog/history 2.jpeg"
              alt="The History of Receipts: From Handwritten Notes to Digital Revolution"
              fill
              className="object-cover object-[center_top_25%]"
              priority
            />
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-[#0a3d62] mb-4 leading-tight">
              The History of Receipts: From Handwritten Notes to Digital Revolution
            </h1>
            <div className="flex items-center gap-4 text-sm text-[#0a3d62]/70 mb-6">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>June 1, 2025</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <article className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#8ab5d1]/20">
              <p className="text-lg text-[#0a3d62] leading-relaxed mb-6">
                Picture this: It's 1700, and you just bought bread from your local baker. He pulls out a quill pen, dips it in ink, and carefully writes on a small piece of paper: "One loaf of bread—3 pence." He hands it to you with flour-dusted fingers.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                That's how receipts started. And for the next 300 years, they barely changed.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Until now.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Very Beginning: Proof of Purchase Through the Ages
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Receipts are older than you might think. Ancient civilizations used <a href="https://www.smithsonianmag.com/smart-news/researchers-decipher-cuneiform-tablet-and-discover-its-a-furniture-receipt-180984805/?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">clay tablets</a>, stone carvings, and papyrus to record trades. The earliest known written receipts were cuneiform tablets from 2029-1982 BCE, documenting transactions like rent payments and goods lists. Wealthy Egyptians used papyrus for receipts, while common people used broken pottery. Everyone needed proof they paid for something.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Why? Same reason we do today. To prove ownership. To return faulty goods. To keep track of spending.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Some things never change.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Handwritten Era: 1600s-1800s
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                For centuries, receipts meant one thing: handwriting.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Every merchant kept a quill pen and ink nearby. They'd write each receipt by hand—what you bought, how much you paid, the date, their signature.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                It was slow. Really slow. Imagine waiting for your barista to handwrite your coffee receipt every morning.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                The problem? Only one copy existed. Lose it, and you were out of luck.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Then came carbon paper in the 1800s. Game changer. Merchants could make copies—one for the customer, one for their records. Suddenly, both parties had proof.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Machine Age: 1879-1960s
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                In 1879, James Ritty invented the cash register. But early versions didn't print receipts—merchants still wrote by hand.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                That changed in 1883 with the first receipt-printing cash register. Now merchants could ring up sales quickly and print basic receipts automatically. Checkout went from a few minutes to about a minute.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                The 1900s brought bigger mechanical receipt machines that could print multiple copies and add totals automatically. The printing press revolutionized receipts in the mid-19th century, allowing pre-printed receipt templates to become standard for purchases and bank transactions. They were huge, expensive, and broke down constantly—but they worked.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Then came the breakthrough: thermal paper in the 1960s. This special paper changed color when heated—no ink needed. Thermal printers were smaller, more reliable, and cheaper. By the 1970s, most businesses switched to thermal receipt printers.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                That white paper that <a href="https://telemarkcorp.com/what-is-thermal-paper-receipt-and-how-does-it-work/?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">turns black in a hot car</a>? That's thermal paper. It's what most stores still use today.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Digital Age: 1980s-2010s
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                The 1980s brought computers to retail. Point-of-sale (POS) systems could now include detailed item descriptions, exact timestamps, and return policies. But receipts were still printed on paper.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                The internet changed online shopping in the 2000s. Email receipts became standard for websites like Amazon and eBay. Some physical stores started asking, "Would you like your receipt emailed?"
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                But email receipts were clunky—you had to give your email address, they ended up in spam folders, your inbox got cluttered, and merchants <a href="https://us.norton.com/blog/privacy/email-receipt?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">used your email for marketing spam</a>. Most people still chose paper.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Then smartphones arrived. Apple Pay launched in 2014, followed by Google Pay. Suddenly we could pay with our phones in seconds.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                This created a weird situation: Digital payment → Paper receipt → Manual data entry into digital expense tracking.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                It made no sense.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Missing Link: Today's Challenge
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Today, we live in this strange world:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>Payments (Apple Pay, credit cards, digital wallets)</li>
                <li>Banking (online banking, mobile apps)</li>
                <li>Shopping (Amazon, digital stores)</li>
                <li>Expense tracking (Mint, QuickBooks, Expensify)</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                What's Still Paper:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>Receipts</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                We pay digitally, then get paper proof, then manually enter that information back into digital systems.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Digital Receipt Revolution: What's Coming Next
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                The next chapter in receipt history is being written right now.
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>Automatic delivery to your phone</li>
                <li>No email addresses needed</li>
                <li>No scanning or manual entry required</li>
                <li>Instant, seamless, effortless</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Just like payments evolved from coins to cards to tap-to-pay, receipts are evolving from handwritten notes to thermal paper to true digital delivery.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                What This Means for You
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                If you're a business owner, you're part of this history. Your POS system represents 300+ years of innovation.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                But you're also at a turning point. The next evolution is happening now.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                If you're a customer, you've lived through this transition. You remember when checkout was slower, when receipts faded and got lost easily. You've seen the improvements.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                And you're about to see the biggest improvement yet.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Pattern Is Clear
              </h2>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>Made transactions faster</li>
                <li>Reduced errors</li>
                <li>Improved record-keeping</li>
                <li>Cut costs</li>
                <li>Enhanced customer experience</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Digital receipts solve all these problems better than anything before.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                Looking Back, Moving Forward
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                From clay tablets to thermal paper took 5,000 years.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                From thermal paper to true digital receipts? It's happening in our lifetime.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                We're not just seeing the future unfold. We're building it.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                The question isn't whether receipts will go digital. The question is how quickly it will happen.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                And whether you'll be part of the revolution or watching from the sidelines.
              </p>

              <hr className="my-8" />

              <p className="text-[#0a3d62] leading-relaxed mb-6 font-bold">
                Ready to write the next chapter in receipt history? <a href="https://www.papex.app/waitlist/" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">Join our waitlist</a> at <a href="https://papex.app" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">papex.app</a>. Be among the first to make paper receipts a thing of the past.
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