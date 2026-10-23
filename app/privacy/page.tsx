// app/privacy/page.tsx
//
// Web 2.3 phone rework (D1): on the redesign shell /support and /about use, via
// the shared LegalPage frame (components/legal). Metadata lives here because
// this is a Server Component again.
//
// PapeX 1.7.3 policy update (feat/173-privacy-policy). The text below is the
// unpublished 1.7.2 policy (feat/privacy-policy-172 @ 3d1f77d) re-applied onto
// this frame, plus the privacy-reconciliation hunks (in-app usage data,
// Apple/Google sign-in, Expo update checks, store-image hosts, advertising
// identifier, logo.dev) and the 1.7.3 decisions: Important mail is on for every
// account, usage data is on by default, retention is described as it is today,
// and the Google Analytics clause is true whether or not Google has been asked
// to delete older data.
//
// PUBLISH STEP, before this reaches main:
//   1. Replace POLICY_DATE below with the publish date, e.g. 'October 28, 2026'.
//      It fills BOTH the "Effective Date" and the "Last Updated" line.
//   2. Check that no placeholder is left (this must print nothing):
//        command grep -n 'PUBLISH[_]DATE' app/privacy/page.tsx
//   3. Deleting an account (1.7.4 FINAL wording). Section 7 and "Deleting your account" say that account data is deleted
//      immediately and that original emails and usage reports are deleted after a short review. Publish only once ALL of
//      these are live: the email Lambda's retired-handle drop (papex-email fix/174-retired-handle-drop), the adapter
//      sweep, mailer, IAM and crons (papex-adapter-backend fix/174-account-delete-live), and the first approved deletion
//      has been observed end to end. Until then the published INTERIM wording (main 22bfaa9b) stays.
//   4. Section 10 uses the no-advertising wording. Keep it only if the GA4 property has Google signals off and no Google
//      Ads link (see the comment in Section 10).
//   5. Remove the PUBLISH GATE comment in Section 3 once its condition holds.
//   6. Section 6 processors: the Nanonets bullet is in the past tense and assumes NANONETS_ENABLED=0 is live; the Anthropic
//      bullet must be published before the Claude fallback is switched on. Keep Gemini current and Marvik past.

import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'
import { LegalPage } from '@/components/legal/LegalPage'

const POLICY_DATE = 'October 25, 2026'

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
      dates={[`Effective Date: ${POLICY_DATE}`, `Last Updated: ${POLICY_DATE}`]}
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
          ID, device ID) and user-generated content. It may also include optional profile details that you
          add, such as a username and a profile photo. If you sign in with your phone number, it includes that number (see
          &ldquo;Signing in&rdquo; below).
        </p>
        <p>
          We also collect financial information related to transaction receipts, including purchase details, merchant names,
          payment methods, transaction timestamps, and associated metadata obtained through integrated POS systems.
          PapeX does not collect or store payment card numbers or full banking credentials. Such data is processed externally
          by third-party POS systems.
        </p>
        <p>
          When you scan or upload a receipt, we receive the photo or PDF and the text and details read from it (see Section 6
          for the companies that read it), and we keep them with your account. Photos of coupons that you add are stored with
          your account in the same way.
        </p>
        <p>
          We collect device identifiers and related data as described below and through our service providers (including
          Amazon Web Services and Google Firebase) for authentication, performance monitoring and security. We do not collect
          your phone&rsquo;s advertising identifier.
        </p>

        <h3>Usage data</h3>
        <p>
          Unless you turn it off, the app sends us information about how it is used: which features you open (for example,
          that you viewed or saved a coupon), whether a scan or other action worked and how long it took, why it failed when
          it did not, the version of the app, whether your phone is an iPhone or an Android device and, in some reports, its
          operating-system version. Each report is linked to your PapeX account ID, and to a random identifier that the app
          creates on your phone. The app and our servers are built to leave out your name, your email address, the contents
          of your receipts, store names and the text of your emails.
        </p>
        <p>
          This information goes to our own servers, which run on Amazon Web Services. It does not go to Google Analytics,
          Firebase Analytics or any advertising or analytics company. To turn it off, go to Settings &gt; Advanced Settings
          &gt; Privacy and turn off &ldquo;Share usage data&rdquo;; the app then stops sending reports and discards any it
          had not yet sent. We keep usage reports for 180 days (see Section 7).
        </p>

        <h3>Signing in</h3>
        <p>
          You can create an account with an email address and password, or sign in with Apple or Google. If you use an email
          address and password, your password goes to Google&rsquo;s Firebase Authentication, which stores it; our own
          servers do not receive it. If you use Apple or Google, we receive the name and email address that they share with us
          (Apple may give us a private relay address instead of your real one); we do not receive your Apple or Google
          password. Sign-in is run by Google&rsquo;s Firebase Authentication, which receives your email address or the token
          that Apple or Google issues.
        </p>
        <p>
          <strong>Phone number.</strong> You can create an account or sign in with a US or Canadian mobile number. We send a
          one-time code by text message through Vonage, our SMS provider. Your number is stored with your account in Firebase
          Authentication so you can sign in with it, and so that someone who types it can find you to share a receipt.
          Message and data rates may apply.
        </p>
        <p>
          If you sign in only with your phone number and lose or change that number, you may not be able to get back into
          your account. Add Apple, Google or email in Account to keep access.
        </p>

        <h3>Phone number on your profile</h3>
        <p>
          Earlier versions of the app let you add a phone number to your profile. We no longer show it in the app or use it
          to find you. It is kept privately with your account, and the app may ask you to verify it; it is used only to fill
          in that prompt, until you verify it or delete your account.
        </p>

        <h3>Security notices</h3>
        <p>
          When your phone number is added, changed or removed, when it is removed from your account because it now belongs
          to someone else, when a new way to sign in is added, or when your account is signed in on a new device, we send a
          notice to your devices and, if you have one, to your verified email address.
        </p>

        <h3>Feedback and support</h3>
        <p>
          If you send feedback or a question through the app, we receive your message, your name and email address, your
          account ID, and your phone&rsquo;s platform and operating-system version. We delete these when you delete your
          account.
        </p>

        <h3>Partner store offers</h3>
        <p>
          A partner store in the Coupons section may offer to send you rewards and offers by email if you choose to share your
          email address with it. If you agree, we store your email address, the store, the wording you agreed to and when you
          agreed, and we may give your email address to that store. You can withdraw in the app, which stops us including you
          in later transfers; we cannot take back an email address that we have already given to a store. We delete what we
          store when you delete your account.
        </p>

        <h3>Sharing with other PapeX users</h3>
        <p>
          If you share a receipt with another PapeX user, or you are in a group with them, they can see your name and your
          profile photo, for example as &ldquo;Shared by&rdquo; on a receipt and in the group&rsquo;s list of members.
          When you add someone to share with by typing their email address or phone number, the app asks our servers whether
          it belongs to a PapeX account and, if it does, shows you that person&rsquo;s name and profile photo and nothing
          else from their profile. The same applies to you: someone who types your email address or phone number can find out
          whether it belongs to a PapeX account and, if it does, sees your name and profile photo. If you add a phone number,
          people who have it can find your PapeX name and photo to share receipts with you. You can turn this off in Account
          &gt; Let people find me by my number.
        </p>
        {/* PUBLISH GATE (W30): this paragraph describes the 1.7.3 app. Publish it together with the profile-privacy server
            changes, and do not add a statement about what other users cannot read until those are live. */}

        <h3>Your PapeX email address</h3>
        <p>
          If you use a PapeX email address, we receive the emails sent or forwarded to it, including the sender, subject, body
          and attachments, whoever sends them. We never access your personal email inbox: we receive only what is sent or
          forwarded to your PapeX address. We read these emails to find receipts, using the AI services described in
          Section 6. When we recognise an email as a sign-in or verification message and judge that it is not a receipt, we do
          not run it through receipt reading. Other emails are read: the text of the email, including any code, link or other
          personal detail in it, is sent to Google&rsquo;s Gemini service, whether or not the email turns out to be a receipt.
          This includes receipts or order confirmations that happen
          to contain a code, and sign-in or verification messages that we do not recognise as such or that include an image or
          PDF file. Emails that contain something that looks like a code or a web link are also sorted for Important mail,
          which sends them to Gemini as well, with the codes we detect hidden (see &ldquo;Important mail&rdquo; below).
          Because most emails contain a web link, this covers most of the emails sent to your PapeX address, receipts
          included.
        </p>
        <p>
          Emails that we judge are not receipts do not appear in your receipts. For each one that went through receipt
          reading, we keep a record separately, where you cannot see it, to check and improve this filtering (see Section 7).
          That record includes the email&rsquo;s subject line and part of its text, so it can contain a code or other detail
          from the email.
        </p>
        <p>
          When an email becomes a receipt, we keep a copy of the original email and its attachments (see Section 7). On an
          email receipt in the app, where the original is available, &ldquo;View original email&rdquo; shows a plain-text
          version of that email. Only the account that owns the receipt can open it; people you share the receipt with cannot.
        </p>
        <p>
          Some store and payment providers send only a link to the receipt on their own website. For a short list of providers
          that we recognise, our servers open that link to fetch the receipt, and that provider&rsquo;s website can see that
          the link was opened. In the same way, when you set up automatic forwarding from your own mail account to your PapeX
          address, our servers open the confirmation link that your mail provider sends, to confirm the forwarding.
        </p>

        <h3>Important mail</h3>
        <p>
          Some emails sent to your PapeX email address are not receipts but are something you need in order to use another
          service: a sign-in code, or a link to verify an account, reset a password or accept an invitation. Important mail
          is the part of the Inbox in the app that shows them to you, so that you can use them. Important mail is available
          for every account that has a PapeX email address.
        </p>
        <ul>
          <li>
            <strong>What mail is processed:</strong> the emails sent or forwarded to your PapeX email address, and only those.
            We look in each of them for a code or a web link. Because most emails contain a link, in practice this applies to
            most emails sent to your PapeX address, including receipts and marketing emails, not only sign-in emails. We show
            an item only when the sender&rsquo;s email passes standard email authentication checks.
          </li>
          <li>
            <strong>Who processes it:</strong> our servers on Amazon Web Services, which receive and store the email;
            Google&rsquo;s Gemini service, described in Section 6 (see &ldquo;How we sort these emails&rdquo; below); and
            Google (Firebase and Google Cloud), which stores the Important mail items.
          </li>
          <li>
            <strong>Why:</strong> to find the sign-in codes and verification links in your mail, to tell them apart from
            receipts and other mail, and to show them to you in the app so that you can use them. We do not use them to sign
            in to anything ourselves.
          </li>
          <li>
            <strong>Your choices:</strong> Important mail cannot be switched off for an account. You can turn off its
            notifications in Settings &gt; Notifications (&ldquo;Sign-in codes &amp; verify links&rdquo;), dismiss any item, or
            delete your account. Emails sent to your PapeX address are still received and read for receipts as described above,
            whether or not you use Important mail.
          </li>
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
            <strong>How we sort these emails:</strong> to find these emails and decide what to show, we send emails that contain
            something that looks like a code or a link to Google&rsquo;s Gemini service, described in Section 6. Before we do,
            we hide the codes we detect, and we remove
            the part of each web link in the email&rsquo;s text after a &ldquo;?&rdquo; or &ldquo;#&rdquo;, which often
            carries a sign-in token. The rest of the email is sent to Gemini, including any code we do not detect. This hiding
            applies only to sorting: unless we recognise the email as a sign-in or verification message that is not a receipt,
            it is also read for receipts, codes and links included (see &ldquo;Your PapeX email address&rdquo; above).
          </li>
          <li>
            <strong>Notifications:</strong> if you allow notifications, we may tell you that a code or link has arrived. The
            notification can name the sender&rsquo;s domain, for example &ldquo;You got a code from example.com&rdquo;, but it
            never shows the code, the subject line or the sender&rsquo;s name.
          </li>
        </ul>

        <h3>Push notifications</h3>
        <p>
          Push notifications are optional, and we send them only if you allow notifications for PapeX on your phone. We may
          notify you when a receipt you scanned has been saved, when an email receipt arrives, when someone shares a receipt
          with you, and when a sign-in code or link arrives in Important mail.
        </p>
        <p>
          A notification can show a receipt&rsquo;s store name and total, for example &ldquo;Store Name &middot; $42.17&rdquo;.
          Anyone who can see your phone&rsquo;s lock screen may be able to read it. For receipts we identify as coming from a
          cannabis dispensary, notifications do not show the store name or the amount. To remove store names and amounts from
          all of your notifications, turn off &ldquo;Show store and amount&rdquo; in Settings &gt; Notifications in the app;
          notifications about Important mail then do not name the sender either.
        </p>
        <p>
          When you allow notifications, the app gets a push token from Expo, the notification service we use, and we store it
          with your PapeX account. We keep one token per account, so notifications go only to the phone that registered most
          recently. To send a notification, we give Expo the token and the notification: its title, its text and an internal
          reference that the app uses to open the right item when you tap it. Expo passes it to Apple&rsquo;s or Google&rsquo;s
          notification service, which delivers it to your phone.
        </p>
        <p>
          Settings &gt; Notifications in the app has a switch for each kind of notification; they are on by default once you
          allow notifications. You can also turn notifications off in your phone&rsquo;s settings. We remove the push token from
          your account when you sign out of PapeX on that phone or delete your account. If your phone is offline when you sign
          out, the removal may not complete. Turning a switch off in the app stops us from sending that kind of notification;
          neither that nor turning notifications off on your phone removes the token.
        </p>
      </section>

      <section>
        <h2>4. Purpose of Processing</h2>
        <p>
          We process data to operate, maintain, and improve the Service; authenticate users; manage accounts; display and
          store digital receipts; read your receipts, photos and emails with the AI services described in Section 6; send the
          notifications you allow; share your email address with a partner store when you choose to; show you sign-in codes
          and verification links from emails sent to your PapeX email address; send you sign-in codes by text message and
          protect sign-in from abuse (rate limits and fraud checks); prevent abuse of the Service; conduct analytics
          and performance optimization; communicate service updates and security alerts; comply with legal obligations; and
          conduct research and development. We may also process anonymized or aggregated transaction data for market research,
          trend analysis, or commercial insights, provided it cannot reasonably identify an individual user.
        </p>
        <p>
          To help prevent abuse, we measure how much file storage each account uses and flag accounts that use far more than
          usual for review by our team. This check is internal: it is not shown to you and it does not delete anything.
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
          <strong>Service providers.</strong> We use other companies to run the Service. They receive personal information to
          provide their services to us:
        </p>
        <ul>
          <li>
            <strong>Google (Gemini).</strong> Every receipt photo or PDF you scan or upload is sent to Google&rsquo;s Gemini AI service
            to check that it is a receipt and, when needed, to read it. The text of emails sent to your PapeX email address,
            whether or not they are receipts and including any codes or links in them, and their image or PDF attachments, are
            also sent to Gemini, except as described in Section 3: we do not run sign-in or verification emails that we
            recognise, and judge are not receipts, through receipt reading, and we hide the codes we detect before an email is
            sorted for Important mail. We use Gemini under Google&rsquo;s paid service terms. Under those terms Google does not
            use this content to improve its products, but it logs requests for a limited period to detect abuse and to meet
            legal requirements, and it may process them in any country where it has facilities.
          </li>
          <li>
            <strong>Marvik (until October 15, 2026).</strong> Until October 15, 2026, our contractor Marvik ran an AI model,
            configured by PapeX, on a server that Marvik operates. It received receipt photos, and the text of receipts and of
            emails sent to your PapeX email address (whether or not they were receipts, and including any codes or links in
            them), to read and sort them and to check the results. We no longer send information to Marvik. Information it
            received before then may still be held on that server.
            {/* If Marvik gives written confirmation of deletion, replace the last sentence with: "Marvik has confirmed that
                it deleted that information on <date>." (W8 E2e.) */}
          </li>
          <li>
            <strong>Nanonets (until October 24, 2026).</strong> Until October 24, 2026, a receipt-reading service, Nanonets,
            could receive a receipt photo, including a photo attached to an email, when our other services could not read it.
            We no longer send information to Nanonets. Information it received before then may still be held by Nanonets.
            {/* Date = the last Nanonets call (2026-10-24 01:18Z, usage 11 of 11 lifetime; W48). Before publishing, check that
                /health/ocr-pipeline still shows 11 used and that NANONETS_ENABLED=0 (E1) is live; if Nanonets was called
                after that date, move the date. Retention at Nanonets is unknown (W7 U5), hence "may still be held". */}
          </li>
          <li>
            <strong>Anthropic (Claude)</strong> &mdash; an AI service that may receive a receipt photo, including a photo
            attached to an email, or the text of a receipt email, when our other services cannot read it. Anthropic processes
            this content under commercial terms that do not allow it to use the content to train its models.
          </li>
          <li>
            <strong>Google (Firebase and Google Cloud)</strong> signs you in, stores your account, receipts, receipt and
            coupon photos, settings, Important mail items and push token, runs parts of the Service, and holds our database backups.
          </li>
          <li>
            <strong>Apple and Google (sign-in).</strong> If you sign in with Apple or Google, they confirm your identity to us
            (see &ldquo;Signing in&rdquo; in Section 3).
          </li>
          <li>
            <strong>Vonage</strong> sends sign-in codes by text message. It receives your phone number and keeps records of the
            messages under its own retention terms.
          </li>
          <li>
            <strong>Apple and Google device checks</strong> (App Attest, DeviceCheck, Play Integrity, through Firebase App
            Check) confirm that requests come from the real PapeX app; they do not tell us who you are.
          </li>
          <li>
            <strong>Amazon Web Services</strong> hosts the servers that process your scans and emails, receives and stores the
            emails sent to your PapeX email address, including the original emails we keep, and stores the usage reports
            described in Section 3.
          </li>
          <li>
            <strong>Expo, Apple and Google</strong> deliver push notifications (see &ldquo;Push notifications&rdquo; in
            Section 3). Expo also provides our software-update service: when the app checks for an update, Expo receives your
            device&rsquo;s IP address, the app&rsquo;s platform and version, and a random identifier that Expo&rsquo;s update
            software creates for this installation of the app.
          </li>
          <li>
            <strong>Vercel</strong> hosts our website, including the pages that show receipt links (papex.app/r), so a receipt
            opened through a link passes through Vercel&rsquo;s servers. Vercel also provides website analytics.
          </li>
          <li>
            <strong>Google Analytics</strong> measures use of our website. It receives your IP address, browser details and the
            address of each page you visit. Until October 15, 2026, the web address of a receipt page, an invitation page or
            a merchant page could itself be the link that gives access to it, and Google Analytics received that address. Since
            then, Google Analytics does not run on those pages and does not receive their addresses. Google may still hold the
            addresses it received before then until they are deleted or expire under the retention settings for our Google
            Analytics account.
          </li>
          <li>
            <strong>Partner stores.</strong> If you choose to share your email address with a partner store (see &ldquo;Partner
            store offers&rdquo; in Section 3), we may give it to that store, and the store&rsquo;s own privacy practices then
            apply to it.
          </li>
          <li>
            <strong>logo.dev</strong> provides store logos. It receives store names from our servers and, when the app loads a
            logo, the store&rsquo;s website address and your device&rsquo;s IP address.
          </li>
          <li>
            <strong>Store image hosts.</strong> The Coupons section shows store logos and photos that your device loads
            directly from image servers run by other companies, for example Weedmaps, Jane, Leafly, Squarespace and Prismic,
            or by content-delivery services such as Amazon CloudFront and Imgix. Those servers receive your device&rsquo;s IP
            address and device details, and can tell which images, and so which stores, you open. We do not control them.
          </li>
        </ul>
        <p>
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
          <a href="mailto:privacy@papex.app">
            privacy@papex.app
          </a>.
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
        <p>Some information has a specific retention period:</p>
        <ul>
          <li>
            <strong>Original emails that became receipts.</strong> We keep the original email and its attachments for as long
            as your account exists, so that you can view the original later. This is a complete copy, so it contains anything
            the email contained, including any code or link. Deleting a receipt does not delete this copy; to ask us to
            delete it, contact us as described in Section 13. When you delete your account, we delete these copies after a
            short review (see &ldquo;Deleting your account&rdquo; below). If you had already deleted a receipt for good, we
            may no longer be able to connect a file attached to its email to your account; to have it deleted, contact us as
            described in Section 13.
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
            <strong>Deleted receipts and photos.</strong> A receipt you delete goes to Deleted Receipts in the app, where it
            stays until you delete it there for good or the app clears it after 30 days; the app does this clearing only when
            you open Deleted Receipts. Deleting a single receipt does not currently delete its photo from our file storage; to
            ask us to delete it, contact us as described in Section 13. Deleting your account deletes all of your photos
            immediately.
          </li>
          <li>
            <strong>Usage data.</strong> The usage reports described in Section 3 are deleted automatically 180 days after they
            are recorded. When you delete your account, we delete them after a short review (see &ldquo;Deleting your
            account&rdquo; below), if that comes first.
          </li>
          <li>
            <strong>Coupon testing.</strong> We are testing a feature, not yet shown in the app, that finds offers and coupon
            codes in emails sent to your PapeX email address. What it finds is deleted automatically after 45 days, or
            immediately when you delete your account.
          </li>
          <li>
            <strong>Database backups.</strong> Our database keeps recovery copies for 7 days and weekly backups for 90 days, and
            our file storage keeps deleted files recoverable for 7 days. Information that has been deleted or removed, such as a
            sign-in code removed from an Important mail item or an account you deleted, can remain in these copies until they
            expire.
          </li>
          <li>
            <strong>Anonymous statistics.</strong> Before we delete an account, we record a few facts about it, each only as a
            broad range or a yes/no: for example how long the account existed, roughly how many receipts, photos or emails it
            had, and which features it used. They contain nothing that identifies you or the account, we only look at them added
            up with at least four other deleted accounts, and we keep them.
          </li>
        </ul>
        <p>
          Automatic deletions run on a schedule, so an item can remain for a day or more after the time stated above.
        </p>
        <p>
          <strong>Deleting your account.</strong> You can delete your account in the app under Settings &gt; Advanced Settings
          &gt; Delete Account, or by contacting us as described in Section 13. Your account and the information stored with it
          in our app database and file storage are deleted immediately, including your receipts and their photos, your profile
          photo, your coupons and coupon photos, cards, Important mail items, settings, partner store sign-ups, feedback, and
          the records that link your email receipts to their original emails. Two kinds of information are deleted after a
          short review by a member of our team, usually within 1 to 4 days: the original emails of your email receipts (see
          above) and the usage reports described in Section 3. Some copies are kept for a set time: emails sent to your PapeX
          email address (deleted 90 days after they arrived, as described above) and database backups and recovery copies (up
          to 90 days). We keep the anonymous statistics described above. Your PapeX email address is never given to anyone
          else: it stays reserved, with no link to you. Emails that reach it after your account is deleted are not added to
          any account and are not kept, except for the copy we receive, which is deleted automatically 90 days after it
          arrived.
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
          Data is stored primarily within the United States. Some of our service providers, for example Google for its Gemini
          service, may process information in other countries. Users outside the U.S. consent to the transfer of their data to
          the U.S., which may have different data-protection laws. Continued use of the Service constitutes consent to such
          transfers.
        </p>
      </section>

      <section>
        <h2>10. Cookies and Tracking Technologies</h2>
        <p>
          On our website we use cookies and similar technologies for session management, authentication, analytics and
          security, including Google Analytics and Vercel Analytics (see Section 6). The PapeX app does not use advertising
          identifiers or advertising SDKs, and we do not track you across other companies&rsquo; apps or websites. You may
          manage cookie preferences through device or browser settings, though disabling cookies may limit functionality. We
          do not currently respond to &ldquo;Do Not Track&rdquo; signals.
          {/* GA4 CHECK, before publishing (W7 U7): this is W8's no-ads wording (E5). It is true only if the GA4 property has
              Google signals off, no Google Ads link and no ads data sharing. If any of those is on, restore "advertising
              measurement" in the first sentence for the website and keep the sentence about the app. */}
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
          We do not ask you for sensitive personal data such as race, health or biometric data. The emails and receipts that you
          send or scan can still contain private details, for example sign-in codes and verification links for other services,
          or what you bought and where. We process them only as described in this Policy (see Sections 3, 6 and 7). If we ever
          need to ask for sensitive personal data, we will request explicit, informed consent and provide opt-out options.
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
