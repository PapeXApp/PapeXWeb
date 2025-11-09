'use client'

import { MainNavigation, MainFooter } from '@/components/main-navigation'

export default function TermsPage() {
  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <MainNavigation />

      <main className="flex-1 container mx-auto py-12 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-16 right-10 w-36 h-36 gradient-primary rounded-full opacity-[0.07] blur-3xl" />
        <div className="absolute bottom-20 left-16 w-32 h-32 gradient-accent rounded-full opacity-[0.08] blur-2xl" />

        <article className="relative z-10 max-w-4xl mx-auto bg-white/90 backdrop-blur-md border border-white/30 rounded-3xl shadow-xl p-8 md:p-12 space-y-8">
          <header className="space-y-4 text-center md:text-left">
            <div className="space-y-1 text-sm font-semibold text-[#ff9933] tracking-wide uppercase">
              <p>Effective Date: November 10, 2025</p>
              <p>Last Updated: November 7, 2025</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62] uppercase">
              PapeX, Inc. – Terms of Agreement
            </h1>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              These Terms of Agreement (the &ldquo;Terms&rdquo;) constitute a legally binding contract between you (&ldquo;User,&rdquo;
              &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and PapeX, Inc. (&ldquo;PapeX,&rdquo; &ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a Texas S-Corporation. By
              accessing or using the PapeX mobile application, website, or integrated services (collectively, the &ldquo;Service&rdquo;),
              you agree to be bound by these Terms and our Privacy Policy, which is incorporated herein by reference. If you do
              not agree, discontinue use of the Service immediately.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">1. Acceptance of Terms</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              These Terms constitute a legally binding contract between you and PapeX, Inc. By accessing or using the Service,
              you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If
              you do not agree, you must discontinue use of the Service immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">2. Description of the Service</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              PapeX provides tools for users to digitize, store, and manage receipts, integrate with point-of-sale (&ldquo;POS&rdquo;)
              systems, and export financial data to external accounting or tax software. The Service is offered on a beta basis
              and may include features that are experimental or subject to modification.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">3. Eligibility and Account Registration</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              To use the Service, you must be at least sixteen (16) years old or the minimum age required by local law. Users
              under the age of eighteen (18) must have permission from a parent or legal guardian. You agree to provide
              accurate, current, and complete registration information and to maintain the confidentiality of your account
              credentials.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">4. Beta Program and Future Subscriptions</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              The PapeX Beta Program is provided free of charge. Following public release, subscription fees may apply after
              users reach their free receipt export token limit. Users who retain receipts within the app without exporting data
              will continue to have free access. PapeX reserves the right to introduce pricing tiers or additional paid features in
              the future.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">5. User Responsibilities and Conduct</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              You agree not to: (i) use the Service for any unlawful, fraudulent, or unauthorized purpose; (ii) attempt to
              reverse-engineer, copy, or modify the Service or its software; (iii) interfere with or disrupt servers, networks, or
              security features; (iv) engage in automated data scraping or bulk extraction of information; or (v) misrepresent
              your identity or affiliation with any entity. PapeX reserves the right to suspend or terminate accounts for
              violations of these Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">6. Ownership and Intellectual Property</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              All intellectual property rights in the Service, including but not limited to the software, code, user interfaces, and
              design elements, are owned by PapeX, Inc. and protected under U.S. and international copyright and trademark
              laws. You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service solely in
              accordance with these Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">7. License to Use the Service</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              Subject to your compliance with these Terms, PapeX grants you a personal, non-commercial, revocable license to
              use the Service. You may not sublicense, sell, lease, or otherwise transfer access to the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">8. Data and Privacy</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              Your use of the Service is governed by the PapeX Privacy Policy, available at{' '}
              <a
                href="https://www.papex.app/privacy"
                className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
              >
                https://www.papex.app/privacy
              </a>. By using the Service, you consent to the collection, processing, and storage of your information as outlined
              in the Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">9. Third-Party Services and Integrations</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              The Service may include integrations with third-party services, including POS systems and financial management
              applications. PapeX is not responsible for the availability, accuracy, or security of third-party services, and your
              use of such integrations is governed by their respective terms and policies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">10. Disclaimers and Limitation of Liability</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              The Service, including all beta features, is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind.
              PapeX disclaims all implied warranties of merchantability, fitness for a particular purpose, and non-infringement. To
              the maximum extent permitted by law, PapeX shall not be liable for any indirect, incidental, consequential, or
              special damages, including loss of profits, data, or goodwill, arising from or in connection with your use of the
              Service, even if advised of the possibility of such damages. PapeX&rsquo;s total liability under these Terms shall not
              exceed the greater of fifty dollars ($50) or the amount you paid (if any) for use of the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">11. Indemnification</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              You agree to indemnify, defend, and hold harmless PapeX, its officers, employees, agents, and affiliates from any
              claims, liabilities, damages, losses, and expenses (including reasonable attorneys&rsquo; fees) arising from your use or
              misuse of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">12. Termination</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              PapeX may suspend or terminate your access to the Service at any time, with or without notice, for any reason,
              including violation of these Terms. Upon termination, all licenses granted to you shall immediately cease.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">13. Electronic Signature and Consent</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              By creating an account, clicking &ldquo;I Agree,&rdquo; or otherwise electronically accepting these Terms, you consent to the
              use of electronic records and signatures in connection with your use of the Service. You acknowledge that your
              electronic agreement constitutes your signature and acceptance of this contract to the same extent as a written
              signature. PapeX may provide notices, disclosures, and agreements electronically, and you agree that such
              communications satisfy any legal requirements that such communications be in writing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">14. Governing Law and Dispute Resolution</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              These Terms are governed by the laws of the State of Texas, without regard to conflict of laws principles. Any
              dispute arising under or relating to these Terms shall be resolved through binding arbitration conducted in Travis
              County, Texas, under the rules of the American Arbitration Association. Judgment on the arbitration award may be
              entered in any court having jurisdiction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">15. Changes to Terms</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              PapeX reserves the right to modify or update these Terms at any time. Updates will be posted within the Service or
              on our website. Continued use of the Service after any changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">16. Contact Information</h2>
            <div className="text-[#0a3d62]/80 leading-relaxed space-y-2">
              <p>Questions or concerns regarding these Terms should be directed to:</p>
              <address className="not-italic">
                <div>PapeX, Inc.</div>
                <div>Austin, Texas, United States</div>
                <div>
                  Email:{' '}
                  <a
                    href="mailto:legal@papex.app"
                    className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
                  >
                    legal@papex.app
                  </a>
                </div>
                <div>
                  Website:{' '}
                  <a
                    href="https://www.papex.app"
                    className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
                  >
                    https://www.papex.app
                  </a>
                </div>
              </address>
            </div>
          </section>
        </article>
      </main>

      <MainFooter />
    </div>
  )
}

