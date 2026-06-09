import Image from "next/image"
import Link from "next/link"

export function FramerFooter() {
  return (
    <footer className="site-footer">
      <div className="framer-container">
        <div className="footer-top">
          <div>
            <Link href="/" className="footer-logo" aria-label="PapeX">
              <Image src="/framer-assets/logo-footer.svg" alt="PapeX" width={112} height={35} />
            </Link>
            <p className="footer-tagline">The future of receipts is digital.</p>
          </div>
          <div>
            <p className="footer-col-label">Platform</p>
            <nav className="footer-links" aria-label="Platform">
              <Link href="/#feature">Features</Link>
              <Link href="/#integration">Integration</Link>
              <Link href="/#faq">FAQ</Link>
            </nav>
          </div>
          <div>
            <p className="footer-col-label">Resources</p>
            <nav className="footer-links" aria-label="Resources">
              <Link href="/contact">Contact</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/terms">Terms</Link>
            </nav>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 PapeX. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
