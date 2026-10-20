'use client'

import { FramerPageShell } from '@/components/framer/framer-page-shell'

export default function PrivacyPolicyPage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-8 px-4 relative overflow-hidden">
        <div className="absolute top-12 left-8 w-32 h-32 gradient-accent rounded-full opacity-[0.08] blur-2xl" />
        <div className="absolute bottom-16 right-16 w-40 h-40 gradient-primary rounded-full opacity-[0.06] blur-3xl" />

        <article className="relative z-10 max-w-4xl mx-auto bg-white/90 backdrop-blur-md border border-white/30 rounded-3xl shadow-xl p-8 md:p-12 space-y-8">
          <header className="space-y-4 text-center md:text-left">
            <div className="space-y-1 text-sm font-semibold text-[#EB7100] tracking-wide uppercase">
              <p>Effective Date: November 10, 2025</p>
              <p>Last Updated: October 20, 2026</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#00121D] uppercase">
              PapeX, Inc. – Privacy Policy
            </h1>
            <p className="text-[#00121D]/80 leading-relaxed">
              This Privacy Policy (&ldquo;Policy&rdquo;) describes how PapeX, Inc. collects, uses, discloses, and safeguards personal and
              non-personal information obtained through the PapeX mobile application and related services (collectively, the
              &ldquo;Service&rdquo;). By accessing or using the Service, you acknowledge that you have read, understood, and agree to the
              terms of this Policy. If you do not agree, you must discontinue use of the Service immediately.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">1. Identity of the Controller</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              The data controller for purposes of this Policy is PapeX, Inc., a Texas S-Corporation with its principal place of
              business in Texas, United States. You may contact us at{' '}
              <a
                href="mailto:privacy@papex.app"
                className="text-[#EB7100] underline decoration-transparent hover:decoration-[#EB7100] transition"
              >
                privacy@papex.app
              </a>{' '}
              for general assistance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">2. Scope of Policy</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              This Policy applies to all users of the PapeX mobile application, website, and integrated services, including POS
              data feeds and third-party integrations. By using any of these services, you acknowledge and agree that this Policy
              governs our collection, use, and disclosure of personal data across all PapeX-related platforms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">3. Information Collected</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We collect information you provide directly, information generated automatically through use of the Service, and
              information obtained from third parties. This may include your name, email address, identifiers (account ID, user
              ID, device ID), search history, and user-generated content.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              We also collect financial information related to transaction receipts, including purchase details, merchant names,
              payment methods, transaction timestamps, and associated metadata obtained through integrated POS systems.
              PapeX does not collect or store payment card numbers or full banking credentials. Such data is processed externally
              by third-party POS systems.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              Device identifiers, advertising identifiers, and related usage/analytics data may be collected through third-party
              services (including AWS and Firebase) for performance monitoring, authentication, and security.
            </p>

            <h3 className="text-xl font-semibold text-[#00121D]">Your PapeX email address</h3>
            <p className="text-[#00121D]/80 leading-relaxed">
              If you use a PapeX email address, we receive the emails sent or forwarded to it, including the sender, subject, body
              and attachments. We never access your personal email inbox. We read emails to find receipts, using the AI services
              described in Section 6. When we recognise an email as a sign-in or verification message and judge that it is not a
              receipt, we do not run it through receipt reading. Other emails are read in full: the text of the email, including
              any code, link or other personal detail in it, is sent to Google&rsquo;s Gemini service and to the AI model that our
              contractor Marvik runs for us, whether or not the email turns out to be a receipt. This includes receipts or order
              confirmations that happen to contain a code, and sign-in or verification messages that we do not recognise as such
              or that include an image or PDF file. If Important mail is available for your account, emails that may contain a
              code or link are also sorted by these AI services, with the codes we detect hidden (see &ldquo;Important mail&rdquo;
              below). Emails that we judge are not receipts do not appear in your receipts. For each one that went through receipt
              reading, we keep a record separately, where you cannot see it, to check and improve this filtering (see Section 7).
              That record includes the email&rsquo;s subject line and part of its text, so it can contain a code or other detail
              from the email.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              When an email becomes a receipt, we keep a copy of the original email and its attachments (see Section 7). On an
              email receipt in the app, where the original is available, &ldquo;View original email&rdquo; shows a plain-text
              version of that email. Only the account that owns the receipt can open it; people you share the receipt with cannot.
            </p>

            <h3 className="text-xl font-semibold text-[#00121D]">Important mail</h3>
            <p className="text-[#00121D]/80 leading-relaxed">
              Emails such as sign-in codes and links to verify an account are not receipts, so they do not appear in your
              receipts. If Important mail is available for your account, we may show sign-in codes, and sign-in, password-reset,
              verification or invitation links, from emails sent to your PapeX email address in the Important section of the Inbox
              in the app, so that you can use them. We show an item only when the sender&rsquo;s email passes standard email authentication checks.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#00121D]/80 leading-relaxed">
              <li>
                <strong>What an item contains:</strong> the code or link, the subject line, the sender&rsquo;s name and domain, and
                when the email arrived. It does not include the email&rsquo;s body, its headers or the sender&rsquo;s email address.
                In the item, where the code appears in the subject line or the sender&rsquo;s name, we replace it with dots.
              </li>
              <li>
                <strong>How long it is shown:</strong> a sign-in code is shown for 24 hours. We then remove the code from the item,
                usually within 15 minutes, and keep showing a record of the email (the sender and when it arrived) until 30 days
                after it arrived. A sign-in or password-reset link is shown for 24 hours, and a verification or invitation link for
                30 days; we remove the link from the item when that time is up. After that we stop showing the item. We do not
                delete items automatically: an item, without its code or link, stays stored with your account until you delete your
                account. Dismissing an item hides it.
              </li>
              <li>
                <strong>View original email:</strong> while an item is shown, you can open a plain-text copy of the email, in which
                links are replaced with &ldquo;[link]&rdquo; and the code appears only during its first 24 hours. We keep this copy,
                and the original message as we received it (which includes any code or link), for 90 days after the email arrives,
                and then delete them automatically. Dismissing the item or deleting your account does not delete them sooner.
              </li>
              <li>
                <strong>Other copies of the email:</strong> removing the code after 24 hours applies only to the Important mail
                item. Other copies of the same email that we keep may still contain the code until they are deleted: the original
                message as we received it (deleted after 90 days) and, if the email went through receipt reading (see &ldquo;Your
                PapeX email address&rdquo; above), the record our filter keeps (deleted after 87 days) or, if the email was saved
                as a receipt, that receipt and its original email, for as long as they are kept (see Section 7).
              </li>
              <li>
                <strong>Who can see it:</strong> only your account. Anyone who can open PapeX while you are signed in can see a code
                shown there, so treat it like a code in your email.
              </li>
              <li>
                <strong>How we sort these emails:</strong> to find these emails and decide what to show, we send emails that may
                contain a code or link to the AI services described in Section 6: Google&rsquo;s Gemini service and the AI model
                that our contractor Marvik runs for us. Before we do, we hide the codes we detect, and we remove the part of each web
                link in the email&rsquo;s text after a &ldquo;?&rdquo; or &ldquo;#&rdquo;, which often carries a sign-in token. The
                rest of the email is sent to them, including any code we do not detect. This hiding applies only to sorting: unless
                we recognise the email as a sign-in or verification message that is not a receipt, it is also read in full for
                receipts, codes and links included (see &ldquo;Your PapeX email address&rdquo; above).
              </li>
              <li>
                <strong>Notifications:</strong> if you allow notifications, we may tell you that a code or link has arrived. The
                notification can name the sender&rsquo;s domain, for example &ldquo;You got a code from example.com&rdquo;, but it
                never shows the code, the subject line or the sender&rsquo;s name.
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-[#00121D]">Push notifications</h3>
            <p className="text-[#00121D]/80 leading-relaxed">
              Push notifications are optional, and we send them only if you allow notifications for PapeX on your phone. We may
              notify you when a receipt you scanned has been saved, when an email receipt arrives, when someone shares a receipt
              with you, and, if Important mail is available for your account, when a sign-in code or link arrives.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              A notification can show a receipt&rsquo;s store name and total, for example &ldquo;Store Name &middot; $42.17&rdquo;.
              Anyone who can see your phone&rsquo;s lock screen may be able to read it. For receipts we identify as coming from a
              cannabis dispensary, notifications do not show the store name or the amount. To remove store names and amounts from
              all of your notifications, turn off &ldquo;Show store and amount&rdquo; in Settings &gt; Notifications in the app;
              notifications about Important mail then do not name the sender either.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              When you allow notifications, the app gets a push token from Expo, the notification service we use, and we store it
              with your PapeX account. We keep one token per account, so notifications go only to the phone that registered most
              recently. To send a notification, we give Expo the token and the notification: its title, its text and an internal
              reference that the app uses to open the right item when you tap it. Expo passes it to Apple&rsquo;s or Google&rsquo;s
              notification service, which delivers it to your phone.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              Settings &gt; Notifications in the app has a switch for each kind of notification; they are on by default once you
              allow notifications. You can also turn notifications off in your phone&rsquo;s settings. We remove the push token from
              your account when you sign out of PapeX on that phone or delete your account. If your phone is offline when you sign
              out, the removal may not complete. Turning a switch off in the app stops us from sending that kind of notification;
              neither that nor turning notifications off on your phone removes the token.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">4. Purpose of Processing</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We process data to operate, maintain, and improve the Service; authenticate users; manage accounts; display and
              store digital receipts; send the notifications you allow; show you sign-in codes and verification links from emails
              sent to your PapeX email address, where that feature is available for your account; prevent abuse of the Service;
              conduct analytics and performance optimization; communicate service updates and security alerts; comply with legal
              obligations; and conduct research and development. We may also process anonymized or aggregated transaction data for
              market research, trend analysis, or commercial insights, provided it cannot reasonably identify an individual user.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              To help prevent abuse, we measure how much file storage each account uses and flag accounts that use far more than
              usual for review by our team. This check is internal: it is not shown to you and it does not delete anything.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">5. Legal Bases for Processing</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              Depending on the activity, we rely on one or more legal bases: performance of a contract; compliance with legal
              obligations; legitimate business interests (e.g., improving products, preventing fraud); and consent (e.g., beta
              testing or marketing communications).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">6. Disclosure of Information</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We do not sell personal identifying information. We may share aggregated or anonymized receipt data with business
              partners, POS vendors, and retailers for legitimate purposes. Data may be shared with financial management
              applications (e.g., QuickBooks, Plaid, Mint) only when authorized by you, under secure, tokenized connections. POS
              vendors accessing PapeX APIs must follow strict confidentiality, encryption, and least-privilege standards.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              <strong>Service providers.</strong> We use other companies to run the Service. They receive personal information to
              provide their services to us:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#00121D]/80 leading-relaxed">
              <li>
                <strong>Google (Gemini).</strong> Every photo or PDF you scan or upload is sent to Google&rsquo;s Gemini AI service
                to check that it is a receipt and, when needed, to read it. The text of emails sent to your PapeX email address,
                whether or not they are receipts and including any codes or links in them, and their image or PDF attachments, are
                also sent to Gemini, except as described in Section 3: we do not run sign-in or verification emails that we
                recognise, and judge are not receipts, through receipt reading, and we hide the codes we detect before an email is
                sorted for Important mail. We use Gemini under Google&rsquo;s paid service terms, under which Google does not use
                this content to improve its products.
              </li>
              <li>
                <strong>Marvik.</strong> Our contractor Marvik runs an AI model, configured by PapeX, on a server that Marvik
                operates. It receives receipt photos, and the text of receipts and of emails sent to your PapeX email address
                (whether or not they are receipts, and including any codes or links in them, with the same exceptions as for
                Gemini), to read and sort them and to check the results.
              </li>
              <li>
                <strong>Nanonets.</strong> A receipt-reading service that may receive a receipt photo when our other services cannot
                read it.
              </li>
              <li>
                <strong>Google (Firebase and Google Cloud)</strong> stores your account, receipts, receipt photos, settings,
                Important mail items and push token, runs parts of the Service, and holds our database backups.
              </li>
              <li>
                <strong>Amazon Web Services</strong> hosts the servers that process your scans and emails, and receives and stores
                the emails sent to your PapeX email address, including the original emails we keep.
              </li>
              <li>
                <strong>Expo, Apple and Google</strong> deliver push notifications (see &ldquo;Push notifications&rdquo; in
                Section 3).
              </li>
              <li>
                <strong>Vercel</strong> hosts our website, including the pages that show receipt links (papex.app/r), so a receipt
                opened through a link passes through Vercel&rsquo;s servers. Vercel also provides website analytics.
              </li>
              <li>
                <strong>Google Analytics</strong> measures use of our website. It receives your IP address, browser details and the
                address of each page you visit. Until October 15, 2026, that address could include a receipt link or an invite
                link itself. Since then, Google Analytics does not run on receipt link, invite or merchant pages and does not
                receive their addresses.
              </li>
              <li>
                <strong>logo.dev</strong> provides store logos. It receives store names from our servers, and your device&rsquo;s IP
                address when the app loads a logo.
              </li>
            </ul>
            <p className="text-[#00121D]/80 leading-relaxed">
              <strong>Receipt links.</strong> You can create a link to a single receipt (papex.app/r). Anyone who has the link can
              view the receipt without signing in, including anyone it is forwarded to. The page shows the receipt&rsquo;s details,
              such as the store, date, items, prices, totals, payment type and any card digits printed on the receipt, and the text
              read from it. If the receipt has a photo that you scanned or uploaded, the page also shows the photo, with location
              and camera details (EXIF and GPS data) removed, unless the receipt has been marked as not being a receipt, has been
              blocked by us, or has no store name, total or items that we could read. A photo shows everything printed on the
              receipt, which can include part of a card number, a loyalty number or your name. A link does not expire, and you
              cannot turn off a single link: it stops working only while the receipt is in Deleted Receipts and after the receipt
              is permanently deleted. Receipts that do not belong to a PapeX account cannot be viewed through a link. To report a
              shared receipt that should not be public, email{' '}
              <a
                href="mailto:privacy@papex.app"
                className="text-[#EB7100] underline decoration-transparent hover:decoration-[#EB7100] transition"
              >
                privacy@papex.app
              </a>.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">
              Information may be disclosed to governmental or regulatory authorities if required by law or in connection with a
              merger, acquisition, reorganization, or sale of Company assets.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">7. Data Retention</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We retain personal and transactional data as long as necessary to fulfill the purposes in this Policy, subject to legal
              requirements. Receipt and account data may be retained indefinitely for archival, analytical, or operational purposes.
              You may request deletion of your account by contacting{' '}
              <a
                href="mailto:privacy@papex.app"
                className="text-[#EB7100] underline decoration-transparent hover:decoration-[#EB7100] transition"
              >
                privacy@papex.app
              </a>, subject to applicable retention requirements.
            </p>
            <p className="text-[#00121D]/80 leading-relaxed">Some information has a specific retention period:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#00121D]/80 leading-relaxed">
              <li>
                <strong>Original emails that became receipts.</strong> We keep the original email and its attachments
                indefinitely, so that you can view the original later. This is a complete copy, so it contains anything the email
                contained, including any code or link. Deleting the receipt or your account does not delete this copy. To ask us to
                delete it, contact us as described in Section 13.
              </li>
              <li>
                <strong>Other emails sent to PapeX email addresses.</strong> We keep the original message as we received it,
                including any code or link in it, for 90 days after it arrives and then delete it automatically, including after
                you delete your account. When an email went through receipt reading and we judged it not to be a receipt (see
                Section 3), we also keep a record that includes its subject line and part of its text, so it can contain a code or
                other detail from the email; it is deleted automatically after 87 days. We keep no such record of a sign-in or
                verification email that we did not run through receipt reading.
              </li>
              <li>
                <strong>Important mail.</strong> See &ldquo;Important mail&rdquo; in Section 3.
              </li>
              <li>
                <strong>Coupon testing.</strong> We are testing a feature, not yet shown in the app, that finds offers and coupon
                codes in emails sent to your PapeX email address. What it finds is deleted automatically after 45 days, including
                after you delete your account.
              </li>
              <li>
                <strong>Database backups.</strong> Our database keeps recovery copies for 7 days and weekly backups for 90 days.
                Information that has been deleted or removed, such as a sign-in code removed from an Important mail item, can remain
                in these copies until they expire.
              </li>
            </ul>
            <p className="text-[#00121D]/80 leading-relaxed">
              <strong>Deleting your account.</strong> You can delete your account in the app under Settings &gt; Advanced Settings
              &gt; Delete Account. This deletes your account and the information stored with it, including your receipts, your
              Important mail items and the records that link your email receipts to their original emails. Some information is not
              deleted right away, including original emails that became receipts (kept indefinitely), copies of other emails
              (deleted 90 days after they arrived), coupon test data (deleted after 45 days), database backups (up to 90 days) and,
              for now, your receipt photos and profile photo in our file storage.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">8. Data Breach Notification</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              If a data breach affects your personal information, we will notify affected users without undue delay, in accordance
              with applicable laws, and provide details on the breach, likely consequences, and remedial actions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">9. International Data Transfers</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              Data is stored primarily within the United States. Users outside the U.S. consent to the transfer of their data to the
              U.S., which may have different data-protection laws. Continued use of the Service constitutes consent to such
              transfers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">10. Cookies and Tracking Technologies</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We use cookies, SDKs, and other tracking technologies for session management, authentication, analytics,
              advertising measurement, and security. You may manage cookie preferences through device or browser settings,
              though disabling cookies may limit functionality. We do not currently respond to &ldquo;Do Not Track&rdquo; signals.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">11. Data Security</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We implement commercially reasonable safeguards, including encryption in transit and at rest (TLS 1.2 and AES-256),
              restricted data access, and secure authentication protocols. While we strive to protect information, no method is
              infallible, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">12. Automated Decision-Making</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We do not make decisions based solely on automated processing that produce legal or similarly significant effects.
              If such features are introduced, users will receive notice and the option to opt out.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">13. Rights of Users</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              Depending on applicable laws, you may have rights to access, correct, delete, restrict, or object to processing of your
              data; request data portability; and exercise other rights without discrimination. Contact us at{' '}
              <a
                href="mailto:privacy@papex.app"
                className="text-[#EB7100] underline decoration-transparent hover:decoration-[#EB7100] transition"
              >
                privacy@papex.app
              </a>{' '}
              with &ldquo;Privacy Request&rdquo; in the subject line. We will acknowledge within 10 days and respond within 45 days,
              extendable once by 45 days if needed.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">14. Sensitive Personal Data</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We do not collect or process sensitive personal data (e.g., race, health, biometric data). If such data is ever
              required, we will request explicit, informed consent and provide opt-out options.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">15. Children’s Privacy</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              The Service is not directed to children under 13. We do not knowingly collect data from children under that age. In
              jurisdictions with higher minimum ages (e.g., 16 in the EEA/UK), we require verifiable parental consent before use.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">16. Financial Data Accuracy Disclaimer</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We display receipt and transaction data as received from connected POS systems and do not independently verify
              merchant-provided information. Please contact merchants directly to resolve discrepancies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">17. Beta Program Notice</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              Users in the PapeX Beta Program acknowledge the Service is provided on a pre-release basis for testing and may
              contain defects or limited functionality. By participating, you consent to our collection of diagnostic and
              performance data for product improvement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">18. Third-Party Services and Links</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              The Service may include integrations or links to third-party applications or websites. We do not control and are not
              responsible for their content, security, or privacy practices. Review the privacy policies of each third-party service
              you access.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">19. Amendments to this Policy</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              We may modify this Policy at any time without prior notice. Changes become effective upon posting in the Service or
              on our website. Continued use of the Service following an amendment constitutes acceptance of the revised Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">20. Governing Law</h2>
            <p className="text-[#00121D]/80 leading-relaxed">
              This Policy is governed by the laws of the State of Texas, without regard to conflict-of-law principles. Any dispute
              arising under or related to this Policy shall be subject to the exclusive jurisdiction of the state and federal courts in
              Travis County, Texas, unless otherwise required by law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#00121D]">21. Contact Information</h2>
            <div className="text-[#00121D]/80 leading-relaxed space-y-2">
              <p>Questions or requests regarding this Policy or our data practices should be directed to:</p>
              <address className="not-italic">
                <div>PapeX, Inc.</div>
                <div>Austin, Texas, United States</div>
                <div>
                  Email:{' '}
                  <a
                    href="mailto:privacy@papex.app"
                    className="text-[#EB7100] underline decoration-transparent hover:decoration-[#EB7100] transition"
                  >
                    privacy@papex.app
                  </a>
                </div>
                <div>
                  Website:{' '}
                  <a
                    href="https://papex.app"
                    className="text-[#EB7100] underline decoration-transparent hover:decoration-[#EB7100] transition"
                  >
                    https://papex.app
                  </a>
                </div>
              </address>
            </div>
          </section>
        </article>
      </div>
    </FramerPageShell>
  )
}

