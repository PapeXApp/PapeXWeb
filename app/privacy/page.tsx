// app/privacy/page.tsx
//
// Web 2.3 phone rework (D1): moved off the legacy FramerPageShell (and off
// 'use client') onto the redesign shell /support and /about use, via the
// shared LegalPage frame (components/legal). The legal text below is
// unchanged, word for word. Metadata used to live in a sibling layout.tsx
// only because this page was a client component; it is a Server Component
// again, so the metadata is back here.

import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'
import { LegalPage } from '@/components/legal/LegalPage'

const OG_ALT =
  'The PapeX logo and the words Your receipt, one tap away, beside an iPhone showing a PapeX receipt'

const TITLE = 'Privacy Policy | PapeX'
const DESCRIPTION = 'How PapeX collects, uses and protects your information.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://papex.app/privacy' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app/privacy',
    siteName: 'PapeX',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="PapeX, Inc. – Privacy Policy"
      dates={['Effective Date: November 10, 2025', 'Last Updated: November 7, 2025']}
    >
      <p>
        This Privacy Policy (&ldquo;Policy&rdquo;) describes how PapeX, Inc. collects, uses, discloses, and safeguards personal and
        non-personal information obtained through the PapeX mobile application and related services (collectively, the
        &ldquo;Service&rdquo;). By accessing or using the Service, you acknowledge that you have read, understood, and agree to the
        terms of this Policy. If you do not agree, you must discontinue use of the Service immediately.
      </p>

      <section>
        <h2>1. Identity of the Controller</h2>
        <p>
          The data controller for purposes of this Policy is PapeX, Inc., a Texas S-Corporation with its principal place of
          business in Texas, United States. You may contact us at{' '}
          <a href="mailto:privacy@papex.app">
            privacy@papex.app
          </a>{' '}
          for general assistance.
        </p>
      </section>

      <section>
        <h2>2. Scope of Policy</h2>
        <p>
          This Policy applies to all users of the PapeX mobile application, website, and integrated services, including POS
          data feeds and third-party integrations. By using any of these services, you acknowledge and agree that this Policy
          governs our collection, use, and disclosure of personal data across all PapeX-related platforms.
        </p>
      </section>

      <section>
        <h2>3. Information Collected</h2>
        <p>
          We collect information you provide directly, information generated automatically through use of the Service, and
          information obtained from third parties. This may include your name, email address, identifiers (account ID, user
          ID, device ID), search history, and user-generated content.
        </p>
        <p>
          We also collect financial information related to transaction receipts, including purchase details, merchant names,
          payment methods, transaction timestamps, and associated metadata obtained through integrated POS systems.
          PapeX does not collect or store payment card numbers or full banking credentials. Such data is processed externally
          by third-party POS systems.
        </p>
        <p>
          Device identifiers, advertising identifiers, and related usage/analytics data may be collected through third-party
          services (including AWS and Firebase) for performance monitoring, authentication, and security.
        </p>
      </section>

      <section>
        <h2>4. Purpose of Processing</h2>
        <p>
          We process data to operate, maintain, and improve the Service; authenticate users; manage accounts; display and
          store digital receipts; conduct analytics and performance optimization; communicate service updates and security
          alerts; comply with legal obligations; and conduct research and development. We may also process anonymized or
          aggregated transaction data for market research, trend analysis, or commercial insights, provided it cannot
          reasonably identify an individual user.
        </p>
      </section>

      <section>
        <h2>5. Legal Bases for Processing</h2>
        <p>
          Depending on the activity, we rely on one or more legal bases: performance of a contract; compliance with legal
          obligations; legitimate business interests (e.g., improving products, preventing fraud); and consent (e.g., beta
          testing or marketing communications).
        </p>
      </section>

      <section>
        <h2>6. Disclosure of Information</h2>
        <p>
          We do not sell personal identifying information. We may share aggregated or anonymized receipt data with business
          partners, POS vendors, and retailers for legitimate purposes. Data may be shared with financial management
          applications (e.g., QuickBooks, Plaid, Mint) only when authorized by you, under secure, tokenized connections. POS
          vendors accessing PapeX APIs must follow strict confidentiality, encryption, and least-privilege standards.
        </p>
        <p>
          Information may be disclosed to governmental or regulatory authorities if required by law or in connection with a
          merger, acquisition, reorganization, or sale of Company assets.
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          We retain personal and transactional data as long as necessary to fulfill the purposes in this Policy, subject to legal
          requirements. Receipt and account data may be retained indefinitely for archival, analytical, or operational purposes.
          You may request deletion of your account by contacting{' '}
          <a href="mailto:privacy@papex.app">
            privacy@papex.app
          </a>, subject to applicable retention requirements.
        </p>
      </section>

      <section>
        <h2>8. Data Breach Notification</h2>
        <p>
          If a data breach affects your personal information, we will notify affected users without undue delay, in accordance
          with applicable laws, and provide details on the breach, likely consequences, and remedial actions.
        </p>
      </section>

      <section>
        <h2>9. International Data Transfers</h2>
        <p>
          Data is stored primarily within the United States. Users outside the U.S. consent to the transfer of their data to the
          U.S., which may have different data-protection laws. Continued use of the Service constitutes consent to such
          transfers.
        </p>
      </section>

      <section>
        <h2>10. Cookies and Tracking Technologies</h2>
        <p>
          We use cookies, SDKs, and other tracking technologies for session management, authentication, analytics,
          advertising measurement, and security. You may manage cookie preferences through device or browser settings,
          though disabling cookies may limit functionality. We do not currently respond to &ldquo;Do Not Track&rdquo; signals.
        </p>
      </section>

      <section>
        <h2>11. Data Security</h2>
        <p>
          We implement commercially reasonable safeguards, including encryption in transit and at rest (TLS 1.2 and AES-256),
          restricted data access, and secure authentication protocols. While we strive to protect information, no method is
          infallible, and we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>12. Automated Decision-Making</h2>
        <p>
          We do not make decisions based solely on automated processing that produce legal or similarly significant effects.
          If such features are introduced, users will receive notice and the option to opt out.
        </p>
      </section>

      <section>
        <h2>13. Rights of Users</h2>
        <p>
          Depending on applicable laws, you may have rights to access, correct, delete, restrict, or object to processing of your
          data; request data portability; and exercise other rights without discrimination. Contact us at{' '}
          <a href="mailto:privacy@papex.app">
            privacy@papex.app
          </a>{' '}
          with &ldquo;Privacy Request&rdquo; in the subject line. We will acknowledge within 10 days and respond within 45 days,
          extendable once by 45 days if needed.
        </p>
      </section>

      <section>
        <h2>14. Sensitive Personal Data</h2>
        <p>
          We do not collect or process sensitive personal data (e.g., race, health, biometric data). If such data is ever
          required, we will request explicit, informed consent and provide opt-out options.
        </p>
      </section>

      <section>
        <h2>15. Children’s Privacy</h2>
        <p>
          The Service is not directed to children under 13. We do not knowingly collect data from children under that age. In
          jurisdictions with higher minimum ages (e.g., 16 in the EEA/UK), we require verifiable parental consent before use.
        </p>
      </section>

      <section>
        <h2>16. Financial Data Accuracy Disclaimer</h2>
        <p>
          We display receipt and transaction data as received from connected POS systems and do not independently verify
          merchant-provided information. Please contact merchants directly to resolve discrepancies.
        </p>
      </section>

      <section>
        <h2>17. Beta Program Notice</h2>
        <p>
          Users in the PapeX Beta Program acknowledge the Service is provided on a pre-release basis for testing and may
          contain defects or limited functionality. By participating, you consent to our collection of diagnostic and
          performance data for product improvement.
        </p>
      </section>

      <section>
        <h2>18. Third-Party Services and Links</h2>
        <p>
          The Service may include integrations or links to third-party applications or websites. We do not control and are not
          responsible for their content, security, or privacy practices. Review the privacy policies of each third-party service
          you access.
        </p>
      </section>

      <section>
        <h2>19. Amendments to this Policy</h2>
        <p>
          We may modify this Policy at any time without prior notice. Changes become effective upon posting in the Service or
          on our website. Continued use of the Service following an amendment constitutes acceptance of the revised Policy.
        </p>
      </section>

      <section>
        <h2>20. Governing Law</h2>
        <p>
          This Policy is governed by the laws of the State of Texas, without regard to conflict-of-law principles. Any dispute
          arising under or related to this Policy shall be subject to the exclusive jurisdiction of the state and federal courts in
          Travis County, Texas, unless otherwise required by law.
        </p>
      </section>

      <section>
        <h2>21. Contact Information</h2>
        <div>
          <p>Questions or requests regarding this Policy or our data practices should be directed to:</p>
          <address>
            <div>PapeX, Inc.</div>
            <div>Austin, Texas, United States</div>
            <div>
              Email:{' '}
              <a href="mailto:privacy@papex.app">
                privacy@papex.app
              </a>
            </div>
            <div>
              Website:{' '}
              <a href="https://papex.app">
                https://papex.app
              </a>
            </div>
          </address>
        </div>
      </section>
    </LegalPage>
  )
}
