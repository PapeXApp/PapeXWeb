'use client'

import { MainNavigation, MainFooter } from '@/components/main-navigation'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <MainNavigation />

      <main className="flex-1 container mx-auto py-12 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-12 left-8 w-32 h-32 gradient-accent rounded-full opacity-[0.08] blur-2xl" />
        <div className="absolute bottom-16 right-16 w-40 h-40 gradient-primary rounded-full opacity-[0.06] blur-3xl" />

        <article className="relative z-10 max-w-4xl mx-auto bg-white/90 backdrop-blur-md border border-white/30 rounded-3xl shadow-xl p-8 md:p-12 space-y-8">
          <header className="space-y-4 text-center md:text-left">
            <div className="space-y-1 text-sm font-semibold text-[#ff9933] tracking-wide uppercase">
              <p>Effective Date: November 10, 2025</p>
              <p>Last Updated: November 7, 2025</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62] uppercase">
              PapeX, Inc. – Privacy Policy
            </h1>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              This Privacy Policy (&ldquo;Policy&rdquo;) describes how PapeX, Inc. collects, uses, discloses, and safeguards personal and
              non-personal information obtained through the PapeX mobile application and related services (collectively, the
              &ldquo;Service&rdquo;). By accessing or using the Service, you acknowledge that you have read, understood, and agree to the
              terms of this Policy. If you do not agree, you must discontinue use of the Service immediately.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">1. Identity of the Controller</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              The data controller for purposes of this Policy is PapeX, Inc., a Texas S-Corporation with its principal place of
              business in Texas, United States. You may contact us at{' '}
              <a
                href="mailto:privacy@papex.app"
                className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
              >
                privacy@papex.app
              </a>{' '}
              for general assistance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">2. Scope of Policy</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              This Policy applies to all users of the PapeX mobile application, website, and integrated services, including POS
              data feeds and third-party integrations. By using any of these services, you acknowledge and agree that this Policy
              governs our collection, use, and disclosure of personal data across all PapeX-related platforms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">3. Information Collected</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We collect information you provide directly, information generated automatically through use of the Service, and
              information obtained from third parties. This may include your name, email address, identifiers (account ID, user
              ID, device ID), search history, and user-generated content.
            </p>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We also collect financial information related to transaction receipts, including purchase details, merchant names,
              payment methods, transaction timestamps, and associated metadata obtained through integrated POS systems.
              PapeX does not collect or store payment card numbers or full banking credentials. Such data is processed externally
              by third-party POS systems.
            </p>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              Device identifiers, advertising identifiers, and related usage/analytics data may be collected through third-party
              services (including AWS and Firebase) for performance monitoring, authentication, and security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">4. Purpose of Processing</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We process data to operate, maintain, and improve the Service; authenticate users; manage accounts; display and
              store digital receipts; conduct analytics and performance optimization; communicate service updates and security
              alerts; comply with legal obligations; and conduct research and development. We may also process anonymized or
              aggregated transaction data for market research, trend analysis, or commercial insights, provided it cannot
              reasonably identify an individual user.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">5. Legal Bases for Processing</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              Depending on the activity, we rely on one or more legal bases: performance of a contract; compliance with legal
              obligations; legitimate business interests (e.g., improving products, preventing fraud); and consent (e.g., beta
              testing or marketing communications).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">6. Disclosure of Information</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We do not sell personal identifying information. We may share aggregated or anonymized receipt data with business
              partners, POS vendors, and retailers for legitimate purposes. Data may be shared with financial management
              applications (e.g., QuickBooks, Plaid, Mint) only when authorized by you, under secure, tokenized connections. POS
              vendors accessing PapeX APIs must follow strict confidentiality, encryption, and least-privilege standards.
            </p>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              Information may be disclosed to governmental or regulatory authorities if required by law or in connection with a
              merger, acquisition, reorganization, or sale of Company assets.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">7. Data Retention</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We retain personal and transactional data as long as necessary to fulfill the purposes in this Policy, subject to legal
              requirements. Receipt and account data may be retained indefinitely for archival, analytical, or operational purposes.
              You may request deletion of your account by contacting{' '}
              <a
                href="mailto:privacy@papex.app"
                className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
              >
                privacy@papex.app
              </a>, subject to applicable retention requirements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">8. Data Breach Notification</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              If a data breach affects your personal information, we will notify affected users without undue delay, in accordance
              with applicable laws, and provide details on the breach, likely consequences, and remedial actions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">9. International Data Transfers</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              Data is stored primarily within the United States. Users outside the U.S. consent to the transfer of their data to the
              U.S., which may have different data-protection laws. Continued use of the Service constitutes consent to such
              transfers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">10. Cookies and Tracking Technologies</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We use cookies, SDKs, and other tracking technologies for session management, authentication, analytics,
              advertising measurement, and security. You may manage cookie preferences through device or browser settings,
              though disabling cookies may limit functionality. We do not currently respond to &ldquo;Do Not Track&rdquo; signals.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">11. Data Security</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We implement commercially reasonable safeguards, including encryption in transit and at rest (TLS 1.2 and AES-256),
              restricted data access, and secure authentication protocols. While we strive to protect information, no method is
              infallible, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">12. Automated Decision-Making</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We do not make decisions based solely on automated processing that produce legal or similarly significant effects.
              If such features are introduced, users will receive notice and the option to opt out.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">13. Rights of Users</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              Depending on applicable laws, you may have rights to access, correct, delete, restrict, or object to processing of your
              data; request data portability; and exercise other rights without discrimination. Contact us at{' '}
              <a
                href="mailto:privacy@papex.app"
                className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
              >
                privacy@papex.app
              </a>{' '}
              with &ldquo;Privacy Request&rdquo; in the subject line. We will acknowledge within 10 days and respond within 45 days,
              extendable once by 45 days if needed.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">14. Sensitive Personal Data</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We do not collect or process sensitive personal data (e.g., race, health, biometric data). If such data is ever
              required, we will request explicit, informed consent and provide opt-out options.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">15. Children’s Privacy</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              The Service is not directed to children under 13. We do not knowingly collect data from children under that age. In
              jurisdictions with higher minimum ages (e.g., 16 in the EEA/UK), we require verifiable parental consent before use.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">16. Financial Data Accuracy Disclaimer</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We display receipt and transaction data as received from connected POS systems and do not independently verify
              merchant-provided information. Please contact merchants directly to resolve discrepancies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">17. Beta Program Notice</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              Users in the PapeX Beta Program acknowledge the Service is provided on a pre-release basis for testing and may
              contain defects or limited functionality. By participating, you consent to our collection of diagnostic and
              performance data for product improvement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">18. Third-Party Services and Links</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              The Service may include integrations or links to third-party applications or websites. We do not control and are not
              responsible for their content, security, or privacy practices. Review the privacy policies of each third-party service
              you access.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">19. Amendments to this Policy</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              We may modify this Policy at any time without prior notice. Changes become effective upon posting in the Service or
              on our website. Continued use of the Service following an amendment constitutes acceptance of the revised Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">20. Governing Law</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">
              This Policy is governed by the laws of the State of Texas, without regard to conflict-of-law principles. Any dispute
              arising under or related to this Policy shall be subject to the exclusive jurisdiction of the state and federal courts in
              Travis County, Texas, unless otherwise required by law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">21. Contact Information</h2>
            <div className="text-[#0a3d62]/80 leading-relaxed space-y-2">
              <p>Questions or requests regarding this Policy or our data practices should be directed to:</p>
              <address className="not-italic">
                <div>PapeX, Inc.</div>
                <div>Austin, Texas, United States</div>
                <div>
                  Email:{' '}
                  <a
                    href="mailto:privacy@papex.app"
                    className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition"
                  >
                    privacy@papex.app
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

