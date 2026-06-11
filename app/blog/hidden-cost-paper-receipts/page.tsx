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
              src="/blog/blog_image.png"
              alt="The Hidden Cost of Paper Receipts"
              fill
              className="object-cover object-center"
              priority
            />
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-[#0a3d62] mb-4 leading-tight">
              The Hidden Cost of Paper Receipts: Why Your Business Should Care
            </h1>
            <div className="flex items-center gap-4 text-sm text-[#0a3d62]/70 mb-6">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>May 24, 2025</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <article className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-lg border border-[#8ab5d1]/20">
              <p className="text-lg text-[#0a3d62] leading-relaxed mb-6">
                Every day, millions of shoppers walk away from stores clutching small paper receipts. These little strips of paper seem harmless enough. But when we zoom out and look at the bigger picture, the truth is shocking. Paper receipts are creating massive problems that most of us never think about – harming both our planet and your business's bottom line.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Mountain of Paper Receipts We Create
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Did you know that in the United States alone, businesses print over 148 billion paper receipts every year? That's enough receipts to circle the Earth more than 375 times if placed end-to-end!
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                These paper receipts aren't just taking up space, they're actively harming our planet:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li><strong>Trees Cut Down:</strong> Making all these paper receipts requires cutting down roughly 10 million trees each year</li>
                <li><strong>Water Wasted:</strong> The process uses nearly 1 billion gallons of water – enough to fill 1,500 Olympic swimming pools</li>
                <li><strong>Energy Consumed:</strong> Producing receipts creates a carbon footprint equal to running 471,000 cars for a year</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                All of this waste happens just so customers can get a piece of paper they'll likely throw away within minutes.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Toxic Truth About Receipt Paper
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                Most people don't realize that <a href="https://www.theguardian.com/us-news/2025/apr/14/paper-receipt-chemical-bisphenol-s" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">standard paper receipts aren't just regular paper</a>. Over 90% of paper receipts are printed on thermal paper, which is coated with harmful chemicals like BPA or BPS. These chemicals help create the printed text without using ink.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                Why should you care about these chemicals?
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>They can enter your body through your skin when you handle receipts</li>
                <li>They contaminate recycling streams, meaning most receipts can't be recycled</li>
                <li>When thrown away, these chemicals can leak into soil and water supplies</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                The CDC has found that <a href="https://www.epa.gov/sites/default/files/2015-05/documents/biomonitoring-bpa.pdf" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">93% of Americans have BPA in their bodies</a>, and receipt handling is one major way we're exposed to it.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Business Cost of Paper Receipts
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                Beyond the environmental damage, paper receipts are hurting your business too:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li><strong>Direct Costs:</strong> Businesses spend between $0.015 and $0.05 on every paper receipt printed</li>
                <li><strong>Equipment Maintenance:</strong> Thermal printers need regular maintenance and replacement</li>
                <li><strong>Storage Costs:</strong> Keeping physical receipts for tax purposes requires space and organization</li>
                <li><strong>Lost Time:</strong> Employees spend hours dealing with receipt-related issues</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                For a medium-sized retailer processing 1,000 transactions daily, receipt costs can add up to over $18,000 per year!
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                A Better Way: Digital Receipts with PapeX
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                What if there was a solution that eliminated all these problems while making things easier for both businesses and customers?
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                That's exactly why we created <a href="https://www.papex.app/" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">PapeX</a>, to serve as a digital receipt platform that saves trees, cuts costs, and simplifies record-keeping.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                With PapeX, when customers make a purchase:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>Their receipt is instantly delivered to their phone</li>
                <li>No paper is wasted, and no chemicals are used</li>
                <li>The receipt is automatically organized and stored securely</li>
                <li>Businesses save money and time on every transaction</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                Our digital receipt solution <a href="https://www.papex.app/#business-model" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">costs just $0.01 per receipt</a> – less than paper receipts – while completely eliminating the environmental impact.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                Small Change, Big Impact
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                By switching from paper to digital receipts, your business can:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>Save money on every transaction</li>
                <li>Show customers you care about the environment</li>
                <li>Streamline your operations</li>
                <li>Make tax time and expense tracking easier</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                If just half of the businesses in America switched to PapeX digital receipts, we could save:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#0a3d62] space-y-2">
                <li>5 million trees each year</li>
                <li>500 million gallons of water</li>
                <li>Reduce carbon emissions equal to taking 250,000 cars off the road</li>
              </ul>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                It's a simple shift that adds up to a meaningful difference—for your business and the planet.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-4">
                The Smarter Way to Do Receipts
              </h2>
              <p className="text-[#0a3d62] leading-relaxed mb-4">
                The future of retail is paperless, and businesses that move quickly will lead the way.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-6">
                PapeX makes the switch to digital receipts seamless and affordable. Our platform works with most popular POS systems and requires zero change to <a href="https://www.papex.app/survey/" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">your existing checkout flow</a>.
              </p>
              <p className="text-[#0a3d62] leading-relaxed mb-8">
                If you're ready to stop wasting money on paper receipts while helping save the planet, <a href="https://www.papex.app/waitlist/" target="_blank" rel="noopener noreferrer" className="text-[#ff9933] hover:underline">join our waitlist today</a> at papex.app. Be among the first to eliminate paper receipts from your business forever.
              </p>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-[#0a3d62]/5 to-[#ff9933]/5 p-6 rounded-lg border border-[#ff9933]/20 text-center">
                <h3 className="text-xl font-bold text-[#0a3d62] mb-3">Ready to Go Paperless?</h3>
                <p className="text-[#0a3d62] mb-4">Join thousands of businesses making the switch to digital receipts.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link 
                    href="https://www.papex.app/waitlist/" 
                    className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] hover:opacity-90 text-white font-medium shadow-md border-none rounded-full px-6 py-3 transition-all"
                  >
                    Join Our Waitlist
                  </Link>
                  <Link 
                    href="https://www.papex.app/survey/" 
                    className="bg-white text-[#0a3d62] border border-[#0a3d62]/20 hover:bg-[#0a3d62] hover:text-white font-medium rounded-full px-6 py-3 transition-all"
                  >
                    Take Our Survey
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