'use client'

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Facebook, Instagram, Linkedin, Twitter, Menu, X } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { AdminLogin } from "@/components/AdminLogin"

export function MainNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isScrolled 
        ? 'glass backdrop-blur-md bg-[#d0e4f4]/90 border-b border-white/20 shadow-lg' 
        : 'border-b border-[#8ab5d1] backdrop-blur-sm bg-[#d0e4f4]/80'
    }`}>
      <div className="container mx-auto py-3 px-4 flex items-center justify-between">
        <div className="flex items-center flex-shrink-0 min-w-0">
          <Link href="/" className="transform transition-transform duration-300 hover:scale-105">
            <Image 
              src="/logos/papex1.png" 
              alt="PapeX Logo" 
              width={160} 
              height={160}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex flex-1 justify-center mx-4">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <Link href={pathname === "/" ? "#about" : "/#about"} legacyBehavior passHref>
                <NavigationMenuLink className="px-1 lg:px-2 xl:px-4 py-2 text-[#0a3d62] hover:text-[#ff9933] bg-transparent font-semibold text-xs lg:text-sm xl:text-lg transition-colors duration-300 whitespace-nowrap">
                  Problem & Solution
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href={pathname === "/" ? "#business-model" : "/#business-model"} legacyBehavior passHref>
                <NavigationMenuLink className="px-1 lg:px-2 xl:px-4 py-2 text-[#0a3d62] hover:text-[#ff9933] bg-transparent font-semibold text-xs lg:text-sm xl:text-lg transition-colors duration-300 whitespace-nowrap">
                  Business Model
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href={pathname === "/" ? "#market-opportunity" : "/#market-opportunity"} legacyBehavior passHref>
                <NavigationMenuLink className="px-1 lg:px-2 xl:px-4 py-2 text-[#0a3d62] hover:text-[#ff9933] bg-transparent font-semibold text-xs lg:text-sm xl:text-lg transition-colors duration-300 whitespace-nowrap">
                  Revenue Streams
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href={pathname === "/" ? "#traction" : "/#traction"} legacyBehavior passHref>
                <NavigationMenuLink className="px-1 lg:px-2 xl:px-4 py-2 text-[#0a3d62] hover:text-[#ff9933] bg-transparent font-semibold text-xs lg:text-sm xl:text-lg transition-colors duration-300 whitespace-nowrap">
                  Milestones
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/blog" legacyBehavior passHref>
                <NavigationMenuLink className="px-1 lg:px-2 xl:px-4 py-2 text-[#0a3d62] hover:text-[#ff9933] bg-transparent font-semibold text-xs lg:text-sm xl:text-lg transition-colors duration-300 whitespace-nowrap">
                  Blog
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/survey" legacyBehavior passHref>
                <NavigationMenuLink className="px-1 lg:px-2 xl:px-4 py-2 text-[#0a3d62] hover:text-[#ff9933] bg-transparent font-semibold text-xs lg:text-sm xl:text-lg transition-colors duration-300 whitespace-nowrap">
                  Take Our Survey
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/waitlist" legacyBehavior passHref>
                <NavigationMenuLink className="px-1 lg:px-2 xl:px-4 py-2 text-[#0a3d62] hover:text-[#ff9933] bg-transparent font-semibold text-xs lg:text-sm xl:text-lg transition-colors duration-300 whitespace-nowrap">
                  Join Waitlist
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Desktop Contact Button */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <Link href="/contact">
            <Button variant="default" className="btn-modern gradient-accent hover:shadow-2xl text-white font-medium border-none rounded-full px-2 lg:px-3 xl:px-6 py-1 lg:py-2 xl:py-3 text-xs lg:text-sm xl:text-lg transform transition-all duration-300 hover:scale-105 whitespace-nowrap">
              Contact Us
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex-shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3 text-[#0a3d62] hover:text-[#ff9933] transition-colors duration-300 focus:outline-none rounded-lg hover:bg-white/30"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-7 w-7 transition-transform duration-300" />
            ) : (
              <Menu className="h-7 w-7 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-dark animate-slide-in-up">
          <div className="container mx-auto px-4 py-6 space-y-2">
            <Link 
              href={pathname === "/" ? "#about" : "/#about"}
              className="block py-4 px-4 text-[#0a3d62] hover:text-[#ff9933] hover:bg-gradient-to-r hover:from-white/20 hover:to-white/5 font-semibold text-lg transition-all duration-300 rounded-lg backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Problem & Solution
            </Link>
            <Link 
              href={pathname === "/" ? "#business-model" : "/#business-model"}
              className="block py-4 px-4 text-[#0a3d62] hover:text-[#ff9933] hover:bg-gradient-to-r hover:from-white/20 hover:to-white/5 font-semibold text-lg transition-all duration-300 rounded-lg backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Business Model
            </Link>
            <Link 
              href={pathname === "/" ? "#market-opportunity" : "/#market-opportunity"}
              className="block py-4 px-4 text-[#0a3d62] hover:text-[#ff9933] hover:bg-gradient-to-r hover:from-white/20 hover:to-white/5 font-semibold text-lg transition-all duration-300 rounded-lg backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Revenue Streams
            </Link>
            <Link 
              href={pathname === "/" ? "#traction" : "/#traction"}
              className="block py-4 px-4 text-[#0a3d62] hover:text-[#ff9933] hover:bg-gradient-to-r hover:from-white/20 hover:to-white/5 font-semibold text-lg transition-all duration-300 rounded-lg backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Milestones
            </Link>
            <Link 
              href="/blog"
              className="block py-4 px-4 text-[#0a3d62] hover:text-[#ff9933] hover:bg-gradient-to-r hover:from-white/20 hover:to-white/5 font-semibold text-lg transition-all duration-300 rounded-lg backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              href="/survey"
              className="block py-4 px-4 text-[#0a3d62] hover:text-[#ff9933] hover:bg-gradient-to-r hover:from-white/20 hover:to-white/5 font-semibold text-lg transition-all duration-300 rounded-lg backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Take Our Survey
            </Link>
            <Link 
              href="/waitlist"
              className="block py-4 px-4 text-[#0a3d62] hover:text-[#ff9933] hover:bg-gradient-to-r hover:from-white/20 hover:to-white/5 font-semibold text-lg transition-all duration-300 rounded-lg backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Join Waitlist
            </Link>
            <div className="pt-4 border-t border-[#8ab5d1]/30 mt-6">
              <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full btn-modern gradient-accent text-white font-medium border-none rounded-full px-6 py-4 text-lg shadow-xl">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export function MainFooter() {
  return (
    <footer className="gradient-primary text-white py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 gradient-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-gradient-to-r from-white to-transparent rounded-full blur-2xl"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-6 md:mb-0 animate-slide-in-left">
            <div className="p-2 glass rounded-full">
              <Image 
                src="/logos/plane.png"
                alt="PapeX Logo" 
                width={60} 
                height={60}
                priority
                className="animate-float"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-4 md:mb-0 order-2 md:order-none mx-auto animate-slide-in-up">
            <Link href="/#about" className="text-white hover:text-[#ff9933] transition-all duration-300 font-semibold text-base relative group">
              <span className="relative z-10">Problem & Solution</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff9933]/10 to-[#e67e22]/10 rounded-md transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
            </Link>
            <Link href="/#business-model" className="text-white hover:text-[#ff9933] transition-all duration-300 font-semibold text-base relative group">
              <span className="relative z-10">Business Model</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff9933]/10 to-[#e67e22]/10 rounded-md transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
            </Link>
            <Link href="/#market-opportunity" className="text-white hover:text-[#ff9933] transition-all duration-300 font-semibold text-base relative group">
              <span className="relative z-10">Revenue Streams</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff9933]/10 to-[#e67e22]/10 rounded-md transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
            </Link>
            <Link href="/#traction" className="text-white hover:text-[#ff9933] transition-all duration-300 font-semibold text-base relative group">
              <span className="relative z-10">Milestones</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff9933]/10 to-[#e67e22]/10 rounded-md transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
            </Link>
            <Link href="/blog" className="text-white hover:text-[#ff9933] transition-all duration-300 font-semibold text-base relative group">
              <span className="relative z-10">Blog</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff9933]/10 to-[#e67e22]/10 rounded-md transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
            </Link>
            <Link href="/survey" className="text-white hover:text-[#ff9933] transition-all duration-300 font-semibold text-base relative group">
              <span className="relative z-10">Take Our Survey</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff9933]/10 to-[#e67e22]/10 rounded-md transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
            </Link>
            <Link href="/waitlist" className="text-white hover:text-[#ff9933] transition-all duration-300 font-semibold text-base relative group">
              <span className="relative z-10">Join Waitlist</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff9933]/10 to-[#e67e22]/10 rounded-md transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
            </Link>
          </div>

          <div className="order-1 md:order-none mb-6 md:mt-0 animate-slide-in-right">
            <Link href="/contact">
              <Button className="btn-modern gradient-accent hover:shadow-2xl text-white font-medium border-none rounded-full px-6 py-3 text-lg transform hover:scale-105 transition-all duration-300">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Social Media Links */}
        <div className="flex justify-center gap-6 mt-8 animate-slide-in-up">
          <Link href="https://www.linkedin.com/company/papexreceipts/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#ff9933] transition-all duration-300 p-3 glass rounded-full card-hover">
            <Linkedin className="h-6 w-6" />
          </Link>
          <Link href="https://x.com/Papex_App" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#ff9933] transition-all duration-300 p-3 glass rounded-full card-hover">
            <Twitter className="h-6 w-6" />
          </Link>
          <Link href="https://www.instagram.com/papex.app?igsh=ZjVkbm80eWprcTgz" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#ff9933] transition-all duration-300 p-3 glass rounded-full card-hover">
            <Facebook className="h-6 w-6" />
          </Link>
          <Link href="https://www.instagram.com/papex.app?igsh=ZjVkbm80eWprcTgz" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#ff9933] transition-all duration-300 p-3 glass rounded-full card-hover">
            <Instagram className="h-6 w-6" />
          </Link>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm animate-slide-in-up space-y-3">
          <div className="flex items-center justify-center gap-4 flex-wrap text-white/80">
            <Link
              href="/privacy"
              className="hover:text-[#ff9933] transition-colors duration-300"
            >
              Privacy Policy
            </Link>
            <span className="hidden sm:inline-block">•</span>
            <Link
              href="/terms"
              className="hover:text-[#ff9933] transition-colors duration-300"
            >
              Terms of Service
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <p className="opacity-80">&copy; {new Date().getFullYear()} PapeX. All rights reserved.</p>
            <AdminLogin />
          </div>
        </div>
      </div>
    </footer>
  )
} 