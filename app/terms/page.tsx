// app/terms/page.tsx
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

const TITLE = 'Terms of Service | PapeX'
const DESCRIPTION = 'The terms for using PapeX and papex.app.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://papex.app/terms' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app/terms',
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

export default function TermsPage() {
  return (
    <LegalPage
      title="PapeX, Inc. – Terms of Service"
      dates={['Effective Date: November 10, 2025', 'Last Updated: November 7, 2025']}
    >
      <p>
        These Terms of Agreement (the &ldquo;Terms&rdquo;) constitute a legally binding contract between you (&ldquo;User,&rdquo;
        &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and PapeX, Inc. (&ldquo;PapeX,&rdquo; &ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a Texas S-Corporation. By
        accessing or using the PapeX mobile application, website, or integrated services (collectively, the &ldquo;Service&rdquo;),
        you agree to be bound by these Terms and our Privacy Policy, which is incorporated herein by reference. If you do
        not agree, discontinue use of the Service immediately.
      </p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          These Terms constitute a legally binding contract between you and PapeX, Inc. By accessing or using the Service,
          you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If
          you do not agree, you must discontinue use of the Service immediately.
        </p>
      </section>

      <section>
        <h2>2. Description of the Service</h2>
        <p>
          PapeX provides tools for users to digitize, store, and manage receipts, integrate with point-of-sale (&ldquo;POS&rdquo;)
          systems, and export financial data to external accounting or tax software. The Service is offered on a beta basis
          and may include features that are experimental or subject to modification.
        </p>
      </section>

      <section>
        <h2>3. Eligibility and Account Registration</h2>
        <p>
          To use the Service, you must be at least sixteen (16) years old or the minimum age required by local law. Users
          under the age of eighteen (18) must have permission from a parent or legal guardian. You agree to provide
          accurate, current, and complete registration information and to maintain the confidentiality of your account
          credentials.
        </p>
      </section>

      <section>
        <h2>4. Beta Program and Future Subscriptions</h2>
        <p>
          The PapeX Beta Program is provided free of charge. Following public release, subscription fees may apply after
          users reach their free receipt export token limit. Users who retain receipts within the app without exporting data
          will continue to have free access. PapeX reserves the right to introduce pricing tiers or additional paid features in
          the future.
        </p>
      </section>

      <section>
        <h2>5. User Responsibilities and Conduct</h2>
        <p>
          You agree not to: (i) use the Service for any unlawful, fraudulent, or unauthorized purpose; (ii) attempt to
          reverse-engineer, copy, or modify the Service or its software; (iii) interfere with or disrupt servers, networks, or
          security features; (iv) engage in automated data scraping or bulk extraction of information; or (v) misrepresent
          your identity or affiliation with any entity. PapeX reserves the right to suspend or terminate accounts for
          violations of these Terms.
        </p>
      </section>

      <section>
        <h2>6. Ownership and Intellectual Property</h2>
        <p>
          All intellectual property rights in the Service, including but not limited to the software, code, user interfaces, and
          design elements, are owned by PapeX, Inc. and protected under U.S. and international copyright and trademark
          laws. You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service solely in
          accordance with these Terms.
        </p>
      </section>

      <section>
        <h2>7. License to Use the Service</h2>
        <p>
          Subject to your compliance with these Terms, PapeX grants you a personal, non-commercial, revocable license to
          use the Service. You may not sublicense, sell, lease, or otherwise transfer access to the Service.
        </p>
      </section>

      <section>
        <h2>8. Data and Privacy</h2>
        <p>
          Your use of the Service is governed by the PapeX Privacy Policy, available at{' '}
          <a href="https://papex.app/privacy">
            https://papex.app/privacy
          </a>. By using the Service, you consent to the collection, processing, and storage of your information as outlined
          in the Privacy Policy.
        </p>
      </section>

      <section>
        <h2>9. Third-Party Services and Integrations</h2>
        <p>
          The Service may include integrations with third-party services, including POS systems and financial management
          applications. PapeX is not responsible for the availability, accuracy, or security of third-party services, and your
          use of such integrations is governed by their respective terms and policies.
        </p>
      </section>

      <section>
        <h2>10. Disclaimers and Limitation of Liability</h2>
        <p>
          The Service, including all beta features, is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind.
          PapeX disclaims all implied warranties of merchantability, fitness for a particular purpose, and non-infringement. To
          the maximum extent permitted by law, PapeX shall not be liable for any indirect, incidental, consequential, or
          special damages, including loss of profits, data, or goodwill, arising from or in connection with your use of the
          Service, even if advised of the possibility of such damages. PapeX&rsquo;s total liability under these Terms shall not
          exceed the greater of fifty dollars ($50) or the amount you paid (if any) for use of the Service.
        </p>
      </section>

      <section>
        <h2>11. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless PapeX, its officers, employees, agents, and affiliates from any
          claims, liabilities, damages, losses, and expenses (including reasonable attorneys&rsquo; fees) arising from your use or
          misuse of the Service, violation of these Terms, or infringement of any third-party rights.
        </p>
      </section>

      <section>
        <h2>12. Termination</h2>
        <p>
          PapeX may suspend or terminate your access to the Service at any time, with or without notice, for any reason,
          including violation of these Terms. Upon termination, all licenses granted to you shall immediately cease.
        </p>
      </section>

      <section>
        <h2>13. Electronic Signature and Consent</h2>
        <p>
          By creating an account, clicking &ldquo;I Agree,&rdquo; or otherwise electronically accepting these Terms, you consent to the
          use of electronic records and signatures in connection with your use of the Service. You acknowledge that your
          electronic agreement constitutes your signature and acceptance of this contract to the same extent as a written
          signature. PapeX may provide notices, disclosures, and agreements electronically, and you agree that such
          communications satisfy any legal requirements that such communications be in writing.
        </p>
      </section>

      <section>
        <h2>14. Governing Law and Dispute Resolution</h2>
        <p>
          These Terms are governed by the laws of the State of Texas, without regard to conflict of laws principles. Any
          dispute arising under or relating to these Terms shall be resolved through binding arbitration conducted in Travis
          County, Texas, under the rules of the American Arbitration Association. Judgment on the arbitration award may be
          entered in any court having jurisdiction.
        </p>
      </section>

      <section>
        <h2>15. Changes to Terms</h2>
        <p>
          PapeX reserves the right to modify or update these Terms at any time. Updates will be posted within the Service or
          on our website. Continued use of the Service after any changes constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>16. Contact Information</h2>
        <div>
          <p>Questions or concerns regarding these Terms should be directed to:</p>
          <address>
            <div>PapeX, Inc.</div>
            <div>Austin, Texas, United States</div>
            <div>
              Email:{' '}
              <a href="mailto:legal@papex.app">
                legal@papex.app
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
