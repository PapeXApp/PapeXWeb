// app/privacy/page.tsx
//
// PapeX consumer privacy policy (rewritten for app 1.7.0).
//
// Source of truth: the counsel-reviewed markdown
// (privacy-policy-170-lawyer.md, goals/papexv2-release-1-7-0/reports/ in
// Noah's Claude memory). Every factual statement here was checked against
// PapeXV2 release/1.7.0, the adapter, the email Lambda, the RDH backend and
// live infrastructure on 2026-09-24. Don't add claims that haven't been
// checked the same way.
//
// BEFORE PUBLISHING: set POLICY_DATE to the publication date, and resolve the
// open questions in the lawyer copy (their default wording is already here).

import type { Metadata } from 'next'
import { FramerPageShell } from '@/components/framer/framer-page-shell'

const POLICY_DATE = '[date of publication]'

export const metadata: Metadata = {
  title: 'Privacy Policy | PapeX',
  description:
    'What PapeX collects, how we use it, who we share it with, how long we keep it, and your choices.',
  alternates: { canonical: 'https://papex.app/privacy' },
}

export default function PrivacyPolicyPage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-8 px-4 relative overflow-hidden">
        <div className="absolute top-12 left-8 w-32 h-32 gradient-accent rounded-full opacity-[0.08] blur-2xl" />
        <div className="absolute bottom-16 right-16 w-40 h-40 gradient-primary rounded-full opacity-[0.06] blur-3xl" />

        <article className="relative z-10 max-w-4xl mx-auto bg-white/90 backdrop-blur-md border border-white/30 rounded-3xl shadow-xl p-8 md:p-12 space-y-8">
          <header className="space-y-4 text-center md:text-left">
            <div className="space-y-1 text-sm font-semibold text-[#ff9933] tracking-wide uppercase">
              <p>Effective Date: {POLICY_DATE}</p>
              <p>Last Updated: {POLICY_DATE}</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62] uppercase">PapeX Privacy Policy</h1>
            <p className="text-[#0a3d62]/80 leading-relaxed">This policy explains what information PapeX collects, what we do with it, who else sees it, how long we keep it, and the choices you have. We’ve tried to keep it short and plain. If something is unclear, email us (see “Contact us” at the end).</p>
          </header>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">1. Who we are</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">PapeX, Inc. (“PapeX”, “we”, “us”) makes the PapeX receipts app. PapeX, Inc. is a Texas S-Corporation based in Austin, Texas, United States.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed">For anything about your privacy, email <strong><a href="mailto:support@papex.app" className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition">support@papex.app</a></strong>.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">2. What this policy covers</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">This policy covers:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li>the PapeX mobile app for iPhone, iPad and Android;</li>
              <li>the PapeX App Clip, the small version of the app that opens when you tap a PapeX receipt device or open a PapeX receipt link on an iPhone;</li>
              <li>the receipt viewer at papex.app/r; and</li>
              <li>the consumer pages of our website, papex.app.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">It doesn’t cover how stores and other businesses use the PapeX merchant dashboard or PapeX receipt devices in their role as a business. It also doesn’t cover other companies’ websites or apps that PapeX links to, such as a store’s own website.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">3. The short version</h2>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li>PapeX keeps your receipts. You can scan paper receipts, have receipts emailed to your personal PapeX email address, or tap a PapeX receipt device at a participating store.</li>
              <li>Receipts are read on our servers, not on your phone. To read them, we send receipt photos and receipt and email text to service providers that read them for us: Google (Gemini), a PapeX-configured AI model that a contractor runs for us on hardware it operates, and Nanonets.</li>
              <li>The app collects first-party usage analytics. It’s on by default, and you can turn it off. It goes only to PapeX’s own servers. The app has no advertising SDKs and no advertising identifiers, and it doesn’t track you across other companies’ apps or websites.</li>
              <li>Other PapeX users can see your basic profile, including your email address, so they can find you and share receipts with you (section 4.1).</li>
              <li>Anyone who has a receipt link you create can view that receipt (section 4.5).</li>
              <li>We don’t sell your personal information.</li>
              <li>If you choose to join a specific store’s rewards or email list in the app, we give that store your email address and a record of your consent. That happens only for the stores you pick.</li>
              <li>You can delete your account in the app: Settings &gt; Advanced Settings &gt; Delete Account. Section 8 explains what that deletes today and what it doesn’t.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">4. What we collect and why</h2>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.1 Your account</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">When you create an account, we collect:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>Email sign-up:</strong> your email address and a password. Our authentication provider (Google Firebase) handles your password. PapeX never sees or stores it in readable form.</li>
              <li><strong>Sign in with Apple or Google:</strong> the name and email address that Apple or Google share with us. If you use Apple’s “Hide My Email”, we receive a relay address instead of your real one.</li>
              <li><strong>Profile details you choose to add:</strong> your name or preferred name, a username, a profile photo, and, if you choose, your phone number. Your phone number is optional. We use it only so people who know it can find you in PapeX to share receipts with you. You can’t sign in with a phone number.</li>
              <li><strong>An account ID</strong> that our authentication provider creates for you.</li>
              <li><strong>Your PapeX email address</strong> (see section 4.3), if you set one up.</li>
              <li><strong>Your receipt categories and settings.</strong> This includes your appearance choice, your Advanced Settings choices and your analytics choice. These sync to your account so they follow you to a new phone.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Who can see your profile.</strong> To let people find you and share receipts with you, any signed-in PapeX user can read your profile record. That record includes your name, username, profile photo, email address, your phone number if you added one, your PapeX email address, your receipt category names, the groups you belong to, and a technical token used to send notifications to your phone. Don’t put anything in your profile that you don’t want other PapeX users to see.</p>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.2 Receipts you scan or upload</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">When you scan a receipt with your camera or pick a photo from your library, we collect the photo and the details we read from it. That includes the store’s name and address, the date and time, items, prices, taxes, totals, the payment type, the last digits of a card if they’re printed, a receipt number, and any loyalty or points details printed on the receipt. We also keep the text read from the receipt. A photo contains whatever is printed on the paper.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>How your receipt is read.</strong> Your photo is sent over an encrypted connection to PapeX’s servers. From there it goes to one or more of these service providers, which read the receipt for us:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>Google, through its Gemini AI service.</strong> Gemini checks each photo to confirm it’s a receipt, and it may also read the receipt;</li>
              <li><strong>a PapeX-configured AI model run by our contractor, Marvik,</strong> on hardware Marvik operates for PapeX in the United States. It reads the receipt and checks the result; and</li>
              <li><strong>Nanonets,</strong> a receipt-reading service we use as a backup.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">We use these providers only to read and check receipts for us.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed">We store the receipt details in our database and the photo in our file storage, both hosted by Google Firebase. We also keep a fingerprint of each photo so we can warn you if you scan the same receipt twice.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>We don’t check receipts for accuracy.</strong> What we show is what we read from the receipt, and reading can go wrong. If something on a receipt looks wrong, check the paper receipt or contact the store.</p>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.3 Email receipts and your PapeX email address</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">You can get a personal PapeX email address. New addresses end in <strong>@papexmail.com</strong>. Older addresses end in <strong>@receipts.papex.app</strong> and still work. You can give this address to a store at checkout, or forward email receipts to it. <strong>PapeX never accesses your personal email inbox.</strong> We only receive messages that are sent or forwarded to your PapeX address.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed">When an email arrives at your PapeX address:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li>Our email service (Amazon Web Services) receives and stores the whole message, including the sender, subject, body and attachments.</li>
              <li>We match it to your account by the address it was sent to.</li>
              <li>We read it to pull out the receipt details. The email’s text goes to Google Gemini and to the contractor-run model described in section 4.2. If the email has little or no text, its attachments (such as a PDF receipt) are read the same way as a scanned photo, which can include Nanonets. Nanonets never receives the email’s text.</li>
              <li>We keep a small log entry for each message (a message ID, a fingerprint of its text, your account ID, the time and whether it was processed) so the same email isn’t saved twice.</li>
              <li>We may send you a notification that a new email receipt has arrived (section 4.9).</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Automatic forwarding.</strong> If you set up automatic forwarding from Gmail, Outlook, iCloud or Yahoo, your email provider sends a confirmation email to your PapeX address. Our system confirms it for you by opening the confirmation link in that email. We keep a record of the email provider, the address the confirmation came from, and the time.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Automatic filtering.</strong> Some emails sent to PapeX addresses are marketing, not receipts. An automatic check decides whether each email looks like a receipt. If it decides an email isn’t a receipt, the email doesn’t appear in your receipts. We keep the details we read from it, your account ID and the reasons for the decision in a separate, restricted internal store that you can’t see in the app. We use it to check that the filter works and to recover any real receipt it got wrong. These records are deleted automatically after 87 days. We don’t notify you when an email is filtered. If you think a receipt is missing, email us and we’ll look.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Emails to an address that isn’t set up yet.</strong> If an email arrives at a PapeX address that isn’t linked to an account, we keep the details we read from it without an account. If that address is later set up in an account, those receipts are added to that account.</p>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.4 Receipts from a PapeX receipt device (tap, QR code and App Clip)</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">Some stores have a PapeX receipt device next to their receipt printer. When the store prints your receipt, the device sends a copy of the printout to PapeX and offers a tap point and QR code. <strong>The receipt is created by the store.</strong> It contains what the store prints, such as items, prices, totals, the time, and sometimes a card’s last digits, a cashier’s name, or your name or loyalty number. If the printout arrives only as an image, we read it with the same service providers described in section 4.2.</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>Viewing without an account.</strong> When you tap the device or scan its QR code, your phone opens that one receipt, either in the PapeX App Clip on an iPhone or in your web browser at papex.app/r. You don’t need an account. The App Clip doesn’t ask who you are. It contains no analytics or other third-party code, and it doesn’t store anything on your phone. It fetches the receipt, and any offers the store attached to it, using a random receipt ID that points to the receipt, not to you.</li>
              <li><strong>What our servers log.</strong> Like any website, our servers record each request, including your IP address, the time, the type of request and whether it succeeded. Our receipt service also logs the receipt ID each time a receipt is opened. We use these logs for security and to count how often receipts are opened. They’re kept for 30 days. The browser version at papex.app/r is part of our website, so the website analytics in section 4.13 also apply there, and they receive the full page address, which includes the receipt ID.</li>
              <li><strong>Saving to your account.</strong> If you have the PapeX app and are signed in, tapping the device opens the app, and the receipt is saved to your account. On other phones and computers, you can sign in (or create an account) on papex.app/r to save it. When you save a receipt, we store it in your account and record which account saved it. Only one account can save a given receipt.</li>
              <li><strong>What the store learns.</strong> The store can see how many of its receipts were saved to a PapeX account. It can’t see who saved them.</li>
              <li><strong>Store offers on device receipts.</strong> A store can attach offers to its receipts. When an offer is shown, we record that it was shown for that receipt, with the store, the offer and the time. That record doesn’t include your account, a device ID or your IP address. If you’re signed in to the app and the receipt is yours, an offer that comes with it can be saved to your coupon wallet when you open the receipt.</li>
              <li><strong>Sharing.</strong> You can share a device receipt with a person or a group, but you can’t create a public link to it.</li>
            </ul>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.5 Sharing receipts, groups and links</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">You can share a receipt with another PapeX user, share receipts with a group (such as a family group), or create a link to a receipt.</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>Sharing with a person:</strong> they see the receipt, and your name and profile photo as the sender. They can accept or decline. The receipt records who it’s shared with, including their name and profile photo.</li>
              <li><strong>Groups:</strong> members of a group see the receipts shared to that group, and each other’s names and profile photos. The group’s owner can add and remove members.</li>
              <li><strong>Finding someone to share with:</strong> if you type someone’s email address or phone number, we use it only to search for them among PapeX users. If there’s no match, nothing is saved.</li>
              <li><strong>Receipt links</strong> (papex.app/r?rid=…): <strong>anyone who has the link can view that receipt</strong>, with no sign-in, including anyone the link is forwarded to. The link shows the receipt’s details: the store and its address, the date, items, prices and totals, the payment type and any card digits printed on the receipt, the receipt number, and the full text read from the receipt. It doesn’t show the photo or any account IDs. A link has no expiry date, and you can’t turn off a single link. It stops working when you delete the receipt.</li>
              <li><strong>Saving a receipt someone shared by link.</strong> If you open a receipt link in the PapeX app and tap Save, we save a copy of that receipt in your own account, labelled “Saved from a shared link”. The copy doesn’t record who shared the receipt with you or the link itself, and it leaves out the payment details and the full receipt text. Saved copies count toward your spending unless you turn on Settings &gt; Advanced Settings &gt; Exclude shared-link receipts. In the App Clip, the save button opens the PapeX app.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">If you delete a receipt, the people and groups you shared it with lose it too. A copy that someone saved from a link stays in their account until they delete it.</p>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.6 Store profiles, offers and coupons</h3>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>Store profiles and offers.</strong> PapeX shows a store’s profile and any offers the store provides, next to that store’s receipts, and only to people who have a receipt from that store. Some participating stores are licensed cannabis dispensaries. Their profiles, menus and offers appear only to users who have a receipt from that dispensary. The app works out which stores you have receipts from on your phone. That list isn’t sent to PapeX or to the stores.</li>
              <li><strong>PapeX doesn’t sell products, take orders or process payments.</strong> If you follow a link to a store’s own website, that store’s privacy policy applies there.</li>
              <li><strong>Logos and photos.</strong> To show store logos and photos, your phone loads images directly from third-party image services and store websites, such as logo.dev, Weedmaps and Leafly image servers, and stores’ own sites. Like any website, those services receive your IP address and the address of the image requested.</li>
              <li><strong>Your coupon wallet.</strong> If you save or photograph a coupon, we store the coupon and its photo in your account. Barcodes are read on your phone. On iPhone, coupon text may also be read on your phone using Apple’s built-in text recognition.</li>
            </ul>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.7 Joining a store’s rewards or email list</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">Some store profiles let you join that store’s rewards or email list. This is always optional and always for one store at a time. Before you join, the app shows the store’s name and asks you to agree to share your email with that store so it can send you rewards and offers. At a licensed cannabis dispensary, you must also confirm that you are 21 or older.</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>What we record:</strong> the email address you enter, which can be different from your account email; the store; the consent wording you agreed to and its version; whether you confirmed you are 21 or older (dispensaries only); the app version; and the date you joined.</li>
              <li><strong>What we send the store:</strong> your email address, the store’s name, the consent version, the 21-or-older confirmation (dispensaries only) and the date you joined. We send it to the store ourselves. The store can’t look up sign-ups in PapeX.</li>
              <li><strong>This is identified information, not anonymous data.</strong> The store receives your actual email address. After that, the store’s own privacy practices govern how it uses the address.</li>
              <li><strong>We share it only with the store you picked.</strong> Joining one store’s list never shares your email with any other store.</li>
              <li><strong>Withdrawing.</strong> Tap “Withdraw” on that store’s card. We mark your sign-up as withdrawn and stop including your email in anything we send that store afterwards. Withdrawing in PapeX can’t remove an email address the store already has. To stop emails you already get from the store, use the store’s unsubscribe link or contact the store.</li>
              <li>We keep your sign-up record, including a withdrawn one, until you delete your account. Deleting your account deletes your sign-up records with us, but it can’t pull back an email address a store has already received.</li>
            </ul>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.8 “Not a receipt” reports, feedback and support</h3>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>Reporting an email receipt.</strong> If something that arrived by email isn’t really a receipt, you can mark it “Not a receipt” or “It’s a coupon”. The app may also ask you when an email receipt looks doubtful. We record your account ID, which receipt you reported, the reason you picked and the time. We use these reports to hide that item for you and to improve our email filtering. They don’t include the email’s contents, and they never affect anyone else’s receipts.</li>
              <li><strong>Feedback and questions.</strong> If you send feedback or a question in the app, we collect your message, name, email address and account ID, and your phone’s platform, system version and app version.</li>
              <li><strong>Emailing us.</strong> If you email us, we receive your email and anything you include.</li>
            </ul>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.9 Notifications</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">If you allow notifications, the app gets a push token for your phone from Expo, our notification provider, and stores it with your profile. We use it to tell you, for example, that an email receipt has arrived or that someone shared a receipt with you. Notification text can include a store name and a receipt total. It passes through Expo and through Apple’s or Google’s notification services on its way to your phone. You can turn notifications off in your phone’s settings.</p>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.10 Usage analytics in the app</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">The app collects usage analytics to help us improve PapeX.</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>What:</strong> which features you use, how long a scan takes, when something fails, and similar events. Each batch of events comes with the app version, your platform (iOS or Android), a random ID the app creates for your phone, and your account ID.</li>
              <li><strong>What it leaves out:</strong> receipt contents, store names, amounts, names, email addresses, phone numbers, locations, search terms and free text you type, and advertising identifiers. The app doesn’t use Apple’s advertising identifier (IDFA) and doesn’t track you across other companies’ apps or websites.</li>
              <li><strong>Where it goes:</strong> only to PapeX’s own servers, hosted on Amazon Web Services. We don’t use a third-party analytics SDK in the app, and we don’t share analytics with advertisers or data brokers.</li>
              <li><strong>Your choice:</strong> analytics is on by default. You can turn it off at any time in <strong>Settings &gt; Advanced Settings &gt; Privacy &gt; Share usage data</strong>. Your choice follows your account to other devices.</li>
              <li><strong>How long:</strong> analytics events are deleted automatically after 180 days.</li>
            </ul>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.11 What stays on your phone</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">Some things never leave your phone:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li>your search history (the app keeps it separately for receipts, stores and coupons);</li>
              <li>your favorite stores, the stores you’ve hidden, and the store profiles the app remembers for you;</li>
              <li>analytics events that haven’t been sent yet, and the random ID the app uses for analytics.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">Receipts and coupons you hide are saved to your account, so they stay hidden on your other devices.</p>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.12 App updates</h3>
            <p className="text-[#0a3d62]/80 leading-relaxed">The app checks Expo’s update service for updates. That request includes your IP address, the app version and your platform.</p>
            <h3 className="text-xl font-semibold text-[#0a3d62]">4.13 Our website (papex.app)</h3>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>Analytics:</strong> our website uses Google Analytics (Google) and Vercel Web Analytics (Vercel) on every page, including the receipt viewer at papex.app/r. Google Analytics uses cookies and receives your IP address, your browser details and the full address of each page you visit, which on papex.app/r includes the receipt ID.</li>
              <li><strong>Signing in to save a receipt:</strong> if you sign in or create an account on papex.app/r, you use your PapeX account (see section 4.1), and your browser keeps you signed in.</li>
              <li><strong>Waitlist:</strong> if you join our waitlist, we collect your name and email address, and your company, role and message if you add them.</li>
              <li><strong>Surveys:</strong> our survey page embeds a Google Form. What you enter goes to Google Forms under Google’s terms.</li>
              <li><strong>Hosting:</strong> our website host, Vercel, logs requests (such as IP address, time and page) for security and operations.</li>
            </ul>
            <h3 className="text-xl font-semibold text-[#0a3d62]">What we don’t collect</h3>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li>your phone’s precise or approximate location. The store address on a receipt is the store’s, not yours;</li>
              <li>your phone’s contacts. The app doesn’t ask for access to them;</li>
              <li>audio. The app doesn’t use your microphone;</li>
              <li>advertising identifiers;</li>
              <li>full card numbers or bank logins. We never ask for these. A receipt shows whatever is printed on it, which is usually at most the last four digits of a card; and</li>
              <li>your search terms. Search history stays on your phone.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>A note on what receipts reveal.</strong> We don’t ask for sensitive information. But a receipt shows what you bought, and a purchase can say something personal about you. We treat receipt contents as private to your account and the people you share with, except where this policy says otherwise (such as receipt links), and we use them only as this policy describes.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">5. How we use information</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">We use information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li>run PapeX: create your account, sign you in, read and store your receipts, show your receipts, stores, offers and coupons, and deliver email and device receipts to the right account;</li>
              <li>let you share receipts with the people and groups you choose;</li>
              <li>send you notifications you’ve allowed;</li>
              <li>pass your email to a store, but only when you join that store’s list;</li>
              <li>keep PapeX secure: prevent fraud, abuse, spam and duplicate receipts;</li>
              <li>understand how the app is used and fix problems (using analytics, if you’ve left it on);</li>
              <li>test and improve our receipt reading and email filtering, using receipts and emails we receive and your “Not a receipt” reports. For example, we keep a set of emails received at PapeX addresses to test our email filter (section 7);</li>
              <li>respond to you; and</li>
              <li>meet legal obligations.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">We don’t use your information for targeted advertising, and we don’t sell it.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">6. Who we share information with</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Service providers</strong> that process information for PapeX:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr><th scope="col" className="border border-[#0a3d62]/15 bg-[#0a3d62]/5 px-3 py-2 text-left font-semibold text-[#0a3d62] align-top">Provider</th><th scope="col" className="border border-[#0a3d62]/15 bg-[#0a3d62]/5 px-3 py-2 text-left font-semibold text-[#0a3d62] align-top">What they do for us</th><th scope="col" className="border border-[#0a3d62]/15 bg-[#0a3d62]/5 px-3 py-2 text-left font-semibold text-[#0a3d62] align-top">What they receive</th></tr>
                </thead>
                <tbody>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Google (Firebase)</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Sign-in, database, file storage, server functions, backups</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Your account, receipts, photos and settings</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Google (Gemini)</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Checks and reads receipt photos and email text</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipt photos, receipt text, email text and attachments</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Marvik (contractor)</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Runs a PapeX-configured AI model that reads and checks receipts, on hardware in the United States</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipt photos, receipt text, email text and attachments</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Nanonets</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Reads receipt photos (backup)</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipt photos and some email attachments</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Amazon Web Services</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Our servers, email receiving, the receipt-device service, the analytics database, server logs</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipts in transit, emails sent to your PapeX address, device receipts, analytics, server logs</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Expo</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Push notifications; app updates</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Your push token and notification text; update requests</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Apple / Google</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Sign-in (if you use it); notification delivery</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">What’s needed to sign you in or deliver a notification</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Vercel</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Website and receipt-viewer hosting; website analytics</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Website requests</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Google (Analytics, Forms)</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Website analytics; website survey</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Website usage, including page addresses; survey answers</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">logo.dev, Weedmaps, Leafly and store websites</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Store logos and photos</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Your IP address and the image requested, when your phone loads an image</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Stores you choose.</strong> When you join a store’s rewards or email list (section 4.7), we give your email and consent record to that store.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>People you share with.</strong> When you share a receipt, join a group or create a receipt link (section 4.5). Other signed-in PapeX users can also see your profile (section 4.1).</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Legal and safety reasons.</strong> When the law requires it, or when it’s needed to protect the rights, safety or property of PapeX, our users or others.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Business transfers.</strong> If PapeX is involved in a merger, acquisition, financing or sale of assets, information may transfer as part of that deal. This policy will continue to apply to it.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>We don’t sell your personal information,</strong> and we don’t share it for cross-context behavioral advertising.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">7. How long we keep information</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr><th scope="col" className="border border-[#0a3d62]/15 bg-[#0a3d62]/5 px-3 py-2 text-left font-semibold text-[#0a3d62] align-top">Information</th><th scope="col" className="border border-[#0a3d62]/15 bg-[#0a3d62]/5 px-3 py-2 text-left font-semibold text-[#0a3d62] align-top">How long</th></tr>
                </thead>
                <tbody>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Account and profile</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Until you delete your account</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipts you keep</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Until you delete them or your account</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipts you delete</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Kept in Settings &gt; Deleted Receipts for 30 days. After that, they’re permanently deleted the next time you open Deleted Receipts</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipt photos and your profile photo</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Until you ask us to delete them. Deleting a receipt or your account doesn’t yet remove its photo from our file storage automatically (section 8)</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Raw emails sent to PapeX addresses, including filtered-out emails</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">90 days, then deleted automatically</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Emails filtered out as “not a receipt” (the details we read and your account ID)</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">87 days, then deleted automatically</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipts from emails sent to an address that isn’t set up yet</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">No fixed period</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Email duplicate-check log and automatic-forwarding records</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">No fixed period. They aren’t deleted when you delete your account</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">A set of about 150 raw emails received at PapeX addresses before September 3, 2026, kept to test our email filter</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">No fixed period</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">“Not a receipt” reports</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Until you delete your account</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Store rewards sign-ups, including withdrawn ones</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Until you delete your account. The store keeps what it received under its own policy</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">App usage analytics</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">180 days, then deleted automatically, including after you delete your account</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipts from PapeX receipt devices, and records of offers shown on them</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">No fixed period</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Server logs for the receipt-device service</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">30 days</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Server logs for email processing</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">No fixed period</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Other server logs</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">As long as needed for security and troubleshooting</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Database backups</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Up to 90 days</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[#0a3d62]/80 leading-relaxed">We may keep information longer when the law requires it, or to resolve disputes, prevent fraud or enforce our terms.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">8. Deleting your account</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>In the app:</strong> go to <strong>Settings &gt; Advanced Settings &gt; Delete Account</strong>. You’ll be asked to confirm. If you haven’t signed in recently, you’ll need to sign in again first. If you use Sign in with Apple, we also revoke PapeX’s access with Apple.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed">Deleting your account in the app permanently deletes:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li>your profile and your sign-in account;</li>
              <li>your receipts, your coupon wallet and coupon photos, your saved cards and your synced settings;</li>
              <li>your store rewards sign-up records and your “Not a receipt” reports;</li>
              <li>your membership in your family group. If you own a family group that still has other members, ownership passes to another member. If you’re the only member, the group is deleted; and</li>
              <li>on the phone you delete from: your search history, favorites, hidden stores, remembered stores and unsent analytics.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">Some information isn’t deleted automatically when you delete your account today:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>Your receipt photos and profile photo</strong> in our file storage.</li>
              <li><strong>Feedback and questions</strong> you sent in the app.</li>
              <li><strong>Your name and profile photo on receipts other people shared with you,</strong> and your place in their sharing lists.</li>
              <li><strong>Your email duplicate-check log and automatic-forwarding records.</strong></li>
              <li><strong>Emails filtered out as “not a receipt”</strong> (deleted after 87 days) and <strong>raw emails</strong> (deleted after 90 days).</li>
              <li><strong>Usage analytics</strong> already collected (deleted after 180 days).</li>
              <li><strong>Database backups</strong> (up to 90 days).</li>
              <li><strong>What a store already received</strong> through a rewards sign-up. Contact the store to remove it.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">To have the items above removed sooner, email us from the address that was on your account, and we’ll delete them by hand where we can.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Other ways to delete.</strong> If you can’t use the app, email us and we’ll delete your account by hand.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Deleting single items:</strong> you can delete individual receipts and coupons without deleting your account. See section 7 for how long deleted receipts and their photos are kept.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">9. Your choices and rights</h2>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>Access and export.</strong> You can see your receipts in the app and export them as PDF or CSV. To request a copy of other information we hold about you, email us.</li>
              <li><strong>Correct.</strong> You can edit your profile and your receipts in the app, or ask us to correct other information.</li>
              <li><strong>Delete.</strong> See section 8.</li>
              <li><strong>Analytics.</strong> Settings &gt; Advanced Settings &gt; Privacy &gt; Share usage data.</li>
              <li><strong>Notifications.</strong> Your phone’s settings.</li>
              <li><strong>Store lists.</strong> Withdraw on the store’s card (section 4.7).</li>
              <li><strong>Camera and photos.</strong> You can change PapeX’s camera and photo access in your phone’s settings. Scanning needs the camera or a photo.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">Depending on where you live, you may have more rights under local law, such as the right to object to or restrict some uses, or to complain to a data-protection authority. To make a request, email us with “Privacy Request” in the subject line. We’ll confirm we received it within 10 business days and respond within 45 days. If we need more time, we’ll tell you, and we may extend by up to another 45 days. We may need to verify your identity, for example by asking you to email us from the address on your account. We won’t treat you differently for using your privacy rights.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">10. California privacy rights</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">If you live in California, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#0a3d62]/80 leading-relaxed">
              <li><strong>know</strong> what personal information we collect, use and disclose, and to get a copy of it;</li>
              <li><strong>delete</strong> personal information we collected from you, with some legal exceptions;</li>
              <li><strong>correct</strong> inaccurate personal information;</li>
              <li><strong>opt out of the sale or sharing</strong> of personal information. We don’t sell it or share it for cross-context behavioral advertising; and</li>
              <li><strong>not be discriminated against</strong> for using these rights.</li>
            </ul>
            <p className="text-[#0a3d62]/80 leading-relaxed">You can use an authorized agent to make a request. We’ll ask the agent for proof of your permission, and we may ask you to verify your identity directly.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Personal information we’ve collected in the past 12 months:</strong></p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr><th scope="col" className="border border-[#0a3d62]/15 bg-[#0a3d62]/5 px-3 py-2 text-left font-semibold text-[#0a3d62] align-top">Category</th><th scope="col" className="border border-[#0a3d62]/15 bg-[#0a3d62]/5 px-3 py-2 text-left font-semibold text-[#0a3d62] align-top">Examples</th><th scope="col" className="border border-[#0a3d62]/15 bg-[#0a3d62]/5 px-3 py-2 text-left font-semibold text-[#0a3d62] align-top">Source</th><th scope="col" className="border border-[#0a3d62]/15 bg-[#0a3d62]/5 px-3 py-2 text-left font-semibold text-[#0a3d62] align-top">Disclosed to (for a business purpose)</th></tr>
                </thead>
                <tbody>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Identifiers</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Name, email, phone number (optional), account ID, PapeX email address, the random ID the app creates, push token, IP address</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">You; Apple or Google sign-in; your device</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Service providers; stores you choose (email only); other PapeX users (profile, section 4.1)</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Customer records</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Name, email, phone, card type and last digits printed on receipts</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">You; your receipts</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Service providers; anyone with a receipt link you create</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Commercial information</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Your receipts: stores, items, prices, totals, dates</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">You; stores (through emails and receipt devices)</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Service providers; people you share with</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Internet or other electronic activity</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">App usage analytics; website usage</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Your device and browser</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Service providers</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Audio, electronic or visual information</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Receipt and coupon photos; profile photo</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">You</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Service providers; people you share with (profile photo)</td></tr>
                  <tr><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Sensitive personal information</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Account login (email and password)</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">You</td><td className="border border-[#0a3d62]/15 px-3 py-2 align-top text-[#0a3d62]/80">Used only to sign you in, through our authentication provider</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[#0a3d62]/80 leading-relaxed">We don’t use sensitive personal information to infer characteristics about you. We keep each category for the periods in section 7.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Stores’ direct marketing (“Shine the Light”).</strong> When you join a store’s email list, we give your email address to that store for its own marketing. If you live in California, you can ask us which stores we gave your email address to in the past calendar year. Email us with “Shine the Light” in the subject line.</p>
            <p className="text-[#0a3d62]/80 leading-relaxed"><strong>Do Not Track and Global Privacy Control.</strong> The app doesn’t track you across other companies’ apps or websites. Our website doesn’t currently respond to browser “Do Not Track” or Global Privacy Control signals.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">11. Children</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">PapeX is not for children. You must be at least 16 to use PapeX, and users under 18 need permission from a parent or guardian, as our Terms say. We don’t knowingly collect personal information from anyone under 16. If you think a child under 16 has given us information, email us and we’ll delete it. Joining a licensed cannabis dispensary’s email list requires confirming you are 21 or older.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">12. Security</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">We use reasonable safeguards to protect your information. The app talks to our servers over encrypted (HTTPS) connections. Our database and file storage (Google Firebase) and our email and receipt-device storage (Amazon Web Services) encrypt the data they store. Access to production data is limited. No system is perfectly secure. If a security breach affects your personal information, we’ll notify you as the law requires.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">13. Where your information is processed</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">PapeX is run from the United States, and your information is stored and processed in the United States. Data-protection laws there may differ from those where you live.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">14. Changes to this policy</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">We’ll post any changes on this page and update the “Last updated” date. If a change is significant, we’ll tell you in the app or by email before it takes effect.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0a3d62]">15. Contact us</h2>
            <p className="text-[#0a3d62]/80 leading-relaxed">PapeX, Inc.<br />Austin, Texas, United States<br />Email: <a href="mailto:support@papex.app" className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition">support@papex.app</a><br />Website: <a href="https://papex.app" className="text-[#ff9933] underline decoration-transparent hover:decoration-[#ff9933] transition">https://papex.app</a></p>
          </section>
        </article>
      </div>
    </FramerPageShell>
  )
}
