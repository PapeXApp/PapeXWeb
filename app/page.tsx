'use client'

import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, DollarSign, BarChart3 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { MainNavigation, MainFooter } from "@/components/main-navigation"
import Head from "next/head"

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PapeX",
    "alternateName": "PapeX Digital Receipts",
    "url": "https://papex.app",
    "logo": "https://papex.app/favlogo.png",
    "description": "PapeX revolutionizes digital receipts by eliminating paper waste and streamlining financial management. Our platform integrates with POS systems to deliver instant digital receipts.",
    "foundingDate": "2024",
    "founders": [
      {
        "@type": "Person",
        "name": "Nicolas Courbage"
      },
      {
        "@type": "Person", 
        "name": "Michael Khoury"
      }
    ],
    "sameAs": [
      "https://www.linkedin.com/company/papexreceipts/",
      "https://www.instagram.com/papex_receipts",
      "https://twitter.com/papex_receipts"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://papex.app/contact"
    },
    "offers": {
      "@type": "Offer",
      "name": "Digital Receipt Platform",
      "description": "Digital receipt solution for businesses",
      "price": "0.01",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "0.01",
        "priceCurrency": "USD",
        "unitText": "per receipt"
      }
    }
  }

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
    <div className="flex flex-col min-h-screen gradient-mesh scroll-smooth">
      <MainNavigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto py-16 px-4 md:py-24 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          {/* Floating background elements */}
          <div className="absolute top-20 left-10 w-32 h-32 gradient-accent rounded-full opacity-10 blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 gradient-primary rounded-full opacity-10 blur-xl animate-float" style={{animationDelay: '2s'}}></div>
          
          <div className="md:w-1/2 space-y-6 animate-slide-in-left">
            <h1 className="text-4xl md:text-6xl font-bold text-[#0a3d62] leading-tight">
              Revolutionizing <br />
              <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">Digital Receipts</span>
            </h1>
            <p className="text-xl text-[#0a3d62] md:pr-12 opacity-90">
              PapeX is developing a digital platform that eliminates the need for physical, email, or text receipts, seamlessly bridging the gap between financial transactions and financial management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/waitlist" className="w-full sm:w-auto">
                <Button className="w-full btn-modern gradient-accent hover:shadow-2xl text-white font-medium border-none rounded-full px-8 py-4 h-auto text-lg transform hover:scale-105 transition-all duration-300">
                  Join Our Waitlist
                </Button>
              </Link>
              <Link href="/survey" className="w-full sm:w-auto">
                <Button className="w-full btn-modern gradient-accent hover:shadow-2xl text-white font-medium border-none rounded-full px-8 py-4 h-auto text-lg transform hover:scale-105 transition-all duration-300">
                  Take Our Survey
                </Button>
              </Link>
              <Link 
                href="#business-model" 
                className="w-full sm:w-auto hidden md:block"
              >
                <Button
                  variant="outline"
                  className="w-full bg-white/80 hover:bg-white text-[#0a3d62] border-2 border-[#0a3d62]/30 hover:border-[#ff9933] hover:text-[#ff9933] rounded-full font-medium px-8 py-4 h-auto text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  Learn More
                </Button>
              </Link>
              <Link 
                href="#about" 
                className="w-full sm:w-auto md:hidden"
              >
                <Button
                  variant="outline"
                  className="w-full bg-white/80 hover:bg-white text-[#0a3d62] border-2 border-[#0a3d62]/30 hover:border-[#ff9933] hover:text-[#ff9933] rounded-full font-medium px-8 py-4 h-auto text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="md:hidden flex justify-center pt-8">
              <div className="relative inline-block">
                <div className="absolute h-32 w-32 border-2 border-[#ff9933] rounded-full animate-pulse-slow opacity-30 -z-10"></div>
                <div className="absolute h-40 w-40 border border-[#0a3d62] rounded-full animate-ping opacity-20 -z-10"></div>
                <Image 
                  src="/logos/plane.png"
                  alt="PapeX Logo" 
                  width={100}
                  height={100}
                  className="object-contain animate-float"
                  priority
                />
              </div>
            </div>
          </div>
          <div className="md:w-1/2 relative hidden md:block animate-slide-in-right">
            <div className="relative h-80 w-full flex items-center justify-center">
              <div className="relative inline-block">
                <div className="absolute h-40 w-40 border-2 border-[#ff9933] rounded-full animate-pulse-slow opacity-30 -z-10"></div>
                <div className="absolute h-48 w-48 border border-[#0a3d62] rounded-full animate-ping opacity-20 -z-10"></div>
                <div className="w-auto h-auto flex items-center justify-center">
                  <Image 
                    src="/logos/plane.png"
                    alt="PapeX Logo" 
                    width={140}
                    height={140}
                    className="sm:w-[180px] sm:h-[180px] w-[120px] h-[120px] object-contain animate-float"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Demo Section */}
        <section className="py-16 md:py-20 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute top-10 left-20 w-64 h-64 gradient-secondary rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-20 w-48 h-48 gradient-accent rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-[#0a3d62] text-center mb-8 animate-slide-in-up">
              See PapeX in <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">Action</span>
            </h2>
            <p className="text-lg text-[#0a3d62] text-center max-w-3xl mx-auto mb-10 opacity-90 animate-slide-in-up">
              Watch how PapeX streamlines the receipt process, saving time for both businesses and customers while eliminating paper waste.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* YouTube Video */}
              <div className="rounded-xl overflow-hidden shadow-2xl card-hover">
                <div className="aspect-[9/16] max-w-sm mx-auto">
                  <iframe
                    src="https://www.youtube.com/embed/P-9kLv4Kj10"
                    title="PapeX Demo"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    frameBorder="0"
                  ></iframe>
                </div>
              </div>
              
              {/* Instagram Reel */}
              <div className="rounded-xl overflow-hidden shadow-2xl card-hover">
                <div className="aspect-[9/16] max-w-sm mx-auto">
                  <iframe
                    src="https://www.instagram.com/reel/DJkVQCuhdQq/embed"
                    title="PapeX Instagram Demo"
                    className="w-full h-full"
                    allowFullScreen
                    frameBorder="0"
                    scrolling="no"
                  ></iframe>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center mt-8 gap-4 md:gap-0">
              <div className="inline-flex items-center gap-2 text-[#ff9933] font-medium animate-slide-in-up">
                <CheckCircle className="h-5 w-5" />
                <span>No more paper receipts</span>
              </div>
              <div className="inline-flex items-center gap-2 text-[#ff9933] font-medium ml-0 md:ml-8 animate-slide-in-up">
                <CheckCircle className="h-5 w-5" />
                <span>Faster checkout experience</span>
              </div>
              <div className="inline-flex items-center gap-2 text-[#ff9933] font-medium ml-0 md:ml-8 animate-slide-in-up">
                <CheckCircle className="h-5 w-5" />
                <span>Easy expense tracking</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="about" className="scroll-mt-[15vh] gradient-primary text-white py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-[#ff9933] to-[#e67e22] rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-48 h-48 bg-gradient-to-r from-white to-transparent rounded-full blur-2xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row gap-12">
              <div className="md:w-1/2 animate-slide-in-left">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">The Problem</h2>
                <p className="text-lg mb-6 opacity-90">
                  Businesses annually spend on average, between $3B - $6B on receipt paper in the U.S. alone, and that
                  excludes printer and ink costs. These costs are not only monetary but also waste valuable time at
                  checkout and have environmental impact.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                  <div className="flex items-start gap-4 glass p-6 rounded-xl card-hover">
                    <DollarSign className="h-8 w-8 text-[#ff9933] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-xl mb-2">Costly</h3>
                      <p className="opacity-90">Billions spent annually on paper receipts and related costs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 glass p-6 rounded-xl card-hover">
                    <Clock className="h-8 w-8 text-[#ff9933] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-xl mb-2">Time-Consuming</h3>
                      <p className="opacity-90">Wastes valuable time at checkout for both businesses and customers</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 gradient-secondary text-[#0a3d62] p-8 rounded-2xl card-hover animate-slide-in-right relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-r from-[#ff9933]/20 to-[#e67e22]/20 rounded-full blur-xl"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Solution</h2>
                  <p className="text-lg mb-6 opacity-90">
                    PapeX is developing a digital platform that will eliminate the need for physical, email, or text
                    receipts, seamlessly bridging the gap between the final stages of the retail transaction process and
                    individual or professional financial or expense management.
                  </p>
                  <div className="space-y-4 mt-8">
                    <div className="flex items-center gap-3 glass-dark p-4 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-[#ff9933] flex-shrink-0" />
                      <p className="font-medium">Eliminate paper waste</p>
                    </div>
                    <div className="flex items-center gap-3 glass-dark p-4 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-[#ff9933] flex-shrink-0" />
                      <p className="font-medium">Save time at checkout</p>
                    </div>
                    <div className="flex items-center gap-3 glass-dark p-4 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-[#ff9933] flex-shrink-0" />
                      <p className="font-medium">Streamline expense management</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Model Section */}
        <section id="business-model" className="scroll-mt-[15vh] py-16 md:py-24 gradient-mesh relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute top-10 left-10 w-96 h-96 gradient-accent rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 gradient-primary rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-[#0a3d62] text-center mb-12 animate-slide-in-up">
              Win-Win-Win <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">Business Model</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass p-8 rounded-2xl border-t-4 border-[#ff9933] card-hover animate-slide-in-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 gradient-accent rounded-full blur-xl opacity-20"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-[#0a3d62] mb-4">Win for POS Vendors</h3>
                  <p className="text-[#0a3d62] mb-6 opacity-90">
                    Point-of-Sale (POS) vendors will generate new revenue streams through our integration.
                  </p>
                  <div className="h-1 w-16 gradient-accent rounded mb-6"></div>
                  <p className="text-[#0a3d62] font-medium">
                    New revenue opportunities without changing existing systems.
                  </p>
                </div>
              </div>
              <div className="glass p-8 rounded-2xl border-t-4 border-[#ff9933] card-hover animate-slide-in-up relative overflow-hidden" style={{animationDelay: '0.2s'}}>
                <div className="absolute top-0 right-0 w-20 h-20 gradient-accent rounded-full blur-xl opacity-20"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-[#0a3d62] mb-4">Win for Merchants</h3>
                  <p className="text-[#0a3d62] mb-6 opacity-90">
                    Merchants will save time, money, and reduce waste by eliminating physical receipts.
                  </p>
                  <div className="h-1 w-16 gradient-accent rounded mb-6"></div>
                  <p className="text-[#0a3d62] font-medium">
                    Lower costs, faster checkout times, and minimized waste leading to a better customer experience.
                  </p>
                </div>
              </div>
              <div className="glass p-8 rounded-2xl border-t-4 border-[#ff9933] card-hover animate-slide-in-right relative overflow-hidden" style={{animationDelay: '0.4s'}}>
                <div className="absolute top-0 right-0 w-20 h-20 gradient-accent rounded-full blur-xl opacity-20"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-[#0a3d62] mb-4">Win for Customers</h3>
                  <p className="text-[#0a3d62] mb-6 opacity-90">
                    Individuals or entities receiving receipts will benefit from faster checkouts and more efficient
                    financial and expense management.
                  </p>
                  <div className="h-1 w-16 gradient-accent rounded mb-6"></div>
                  <p className="text-[#0a3d62] font-medium">Simplified expense tracking and financial management, all while reducing their carbon footprint.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Opportunity */}
        <section id="market-opportunity" className="scroll-mt-[15vh] gradient-primary py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-r from-[#ff9933] to-[#e67e22] rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-r from-white to-transparent rounded-full blur-2xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2 animate-slide-in-left">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Market <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">Opportunity</span></h2>
                <p className="text-lg text-white mb-8 opacity-90">
                  PapeX targets anyone who receives or issues receipts, including both brick-and-mortar businesses and
                  online retailers. We will generate revenue through a combination of pay-per-print and
                  subscription-based pricing, depending on the model chosen by the merchant.
                </p>
                <p className="text-lg text-white opacity-90">
                  In addition to these core pricing models, we will generate revenue through non-PII data monetization and B2B integrations with tax, accounting, and financial software.
                </p>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="relative w-80 h-80">
                  {/* Base circle with low opacity */}
                  <div className="absolute inset-0 rounded-full border-8 border-white opacity-20"></div>
                  
                  {/* Orange section - 26.26% */}
                  <div
                    className="absolute inset-0 rounded-full border-8 border-[#ff9933] opacity-80"
                    style={{ 
                      clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)"
                    }}
                  ></div>
                  
                  {/* Blue section - 20.51% */}
                  <div
                    className="absolute inset-0 rounded-full border-8 border-[#44c8e8] opacity-80"
                    style={{ 
                      clipPath: "polygon(50% 50%, 50% 0, 100% 0, 100% 50%)"
                    }}
                  ></div>
                  
                  {/* White section - 53.23% */}
                  <div
                    className="absolute inset-0 rounded-full border-8 border-white"
                    style={{ 
                      clipPath: "polygon(50% 50%, 50% 0, 0 0, 0 100%, 50% 100%)"
                    }}
                  ></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center flex-col text-center">
                    <p className="text-sm text-white">Core Receipt Based</p>
                    <p className="text-2xl font-bold text-[#ff9933]">26.26%</p>
                    
                    <div className="h-1 w-16 bg-white my-2"></div>
                    
                    <p className="text-sm text-white">B2B Subscription Service</p>
                    <p className="text-2xl font-bold text-[#44c8e8]">20.51%</p>
                    
                    <div className="h-1 w-16 bg-white my-2"></div>
                    
                    <p className="text-sm text-white">Data Monetization</p>
                    <p className="text-2xl font-bold text-white">53.23%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Traction Section */}
        <section id="traction" className="scroll-mt-[15vh] py-16 md:py-24 gradient-mesh relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute top-20 left-20 w-80 h-80 gradient-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-64 h-64 gradient-accent rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-[#0a3d62] text-center mb-12 animate-slide-in-up">Traction & <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">Milestones</span></h2>
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-1 gradient-accent rounded-full"></div>

                <div className="relative pl-12 pb-12 animate-slide-in-left">
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full gradient-accent shadow-lg flex items-center justify-center card-hover">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="glass p-6 rounded-xl card-hover">
                    <h3 className="text-xl font-bold text-[#0a3d62] mb-2">Clover POS Integration</h3>
                    <p className="text-[#0a3d62] opacity-90">
                      Successfully developed an almost fully functional integration for the Clover POS system, relying
                      solely on a dedicated group of students with support from professionals and advisors.
                    </p>
                  </div>
                </div>

                <div className="relative pl-12 pb-12 animate-slide-in-left" style={{animationDelay: '0.2s'}}>
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full gradient-accent shadow-lg flex items-center justify-center card-hover">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div className="glass p-6 rounded-xl card-hover">
                    <h3 className="text-xl font-bold text-[#0a3d62] mb-2">Growing Waitlist</h3>
                    <p className="text-[#0a3d62] opacity-90">
                      Market interest is evident, with a growing waitlist of potential customers eager to adopt the
                      solution.
                    </p>
                  </div>
                </div>

                <div className="relative pl-12 animate-slide-in-left" style={{animationDelay: '0.4s'}}>
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full gradient-accent shadow-lg flex items-center justify-center card-hover">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="glass p-6 rounded-xl card-hover">
                    <h3 className="text-xl font-bold text-[#0a3d62] mb-2">Pitch Competition Winner</h3>
                    <p className="text-[#0a3d62] opacity-90">
                      PapeX gained recognition by winning a pitch competition judged by the top 50 fastest-growing
                      Syracuse alumni entrepreneurs, securing $6,000 in funding to further development.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Waitlist Section */}
        <section id="waitlist" className="scroll-mt-[15vh] gradient-primary text-white py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-r from-[#ff9933] to-[#e67e22] rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-gradient-to-r from-white to-transparent rounded-full blur-2xl animate-float" style={{animationDelay: '3s'}}></div>
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 animate-slide-in-up">Help us build it better</h2>
            <p className="text-xl max-w-2xl mx-auto mb-12 opacity-90 animate-slide-in-up">
              PapeX is currently building our waitlist as we seek investors. There's no obligation or commitment on your part, but if you're interested click here!
            </p>

            <div className="max-w-md mx-auto animate-slide-in-up">
              <Link href="/waitlist">
                <Button className="w-full btn-modern gradient-accent hover:shadow-2xl text-white font-medium border-none rounded-full px-8 py-4 h-auto text-lg transform hover:scale-105 transition-all duration-300 mb-8">
                  Join Our Waitlist
                </Button>
              </Link>
              <Link href="/survey">
                <Button className="w-full btn-modern glass hover:glass-dark text-white font-medium border-2 border-white/30 hover:border-[#ff9933] rounded-full px-8 py-4 h-auto text-lg transform hover:scale-105 transition-all duration-300">
                  Take Our Survey
                </Button>
              </Link>
            </div>

            <p className="mt-12 text-lg opacity-90 animate-slide-in-up">Your support is greatly appreciated!</p>

            {/* Removed decorative dotted line, plane, and oval for a cleaner, centered section */}
          </div>
        </section>
      </main>

      <section className="bg-white/80 backdrop-blur-sm border-t border-[#0a3d62]/10 py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-[#0a3d62]/80">
          <span>Looking for the fine print?</span>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-[#ff9933] transition-colors duration-300">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline-block">•</span>
            <Link href="/terms" className="hover:text-[#ff9933] transition-colors duration-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </section>

      <MainFooter />
    </div>
    </>
  )
}

