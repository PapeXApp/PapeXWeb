// Security-rule tests for the papexweb-aed97 Firestore (firestore.rules).
//
// Run with:
//   npm run test:rules
//
// Needs `firebase` and `@firebase/rules-unit-testing` resolvable from this
// repo (they are not runtime dependencies of the site) and a JDK for the
// emulator, e.g. JAVA_HOME=/opt/homebrew/opt/openjdk@27.
//
// What these pin down, in order of how much it would hurt to regress:
//   1. waitlist, blog_subscribers and support_requests are unreadable from a
//      browser (leads and support messages are PII).
//   2. Only a blog admin can create or update posts; nobody can delete one.
//   3. The two legitimate waitlist payloads (main's form, 2.1's fallback) still
//      go through, and nothing else does.
//   4. An unverified account whose email happens to be on the admin allowlist
//      is NOT an admin (self-signup is open on this project).
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

// A uid pinned in firestore.rules (nico.courbage@gmail.com, unverified).
const PINNED_ADMIN_UID = '7r5IEt2BcgQDCt2J83FgFlnZ5zt1';

let testEnv;

before(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8091').split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'papexweb-rules-test',
    firestore: {
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
      host,
      port: Number(port),
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const anon = () => testEnv.unauthenticatedContext().firestore();
const pinnedAdmin = () => testEnv.authenticatedContext(PINNED_ADMIN_UID, { email: 'nico.courbage@gmail.com', email_verified: false }).firestore();
const verifiedAdmin = () => testEnv.authenticatedContext('uid_new_admin', { email: 'nico@papex.app', email_verified: true }).firestore();
const impostor = () => testEnv.authenticatedContext('uid_impostor', { email: 'nico@papex.app', email_verified: false }).firestore();
const verifiedStranger = () => testEnv.authenticatedContext('uid_stranger', { email: 'someone@example.com', email_verified: true }).firestore();

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(path).set(data);
  });
}

const MAIN_LEAD = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines',
  role: 'Founder',
  message: 'Interested in the pilot.',
};

const DEMO_LEAD = {
  fullName: 'Ada Lovelace',
  businessName: 'Analytical Engines',
  email: 'ada@example.com',
  phone: '+1 555 0100',
  posSystem: 'Blaze',
  type: 'business-demo-request',
};

describe('waitlist', () => {
  it('cannot be read, listed, updated or deleted from a browser', async () => {
    await seed('waitlist/lead1', { ...MAIN_LEAD, createdAt: new Date() });
    await assertFails(anon().doc('waitlist/lead1').get());
    await assertFails(anon().collection('waitlist').get());
    await assertFails(verifiedStranger().collection('waitlist').get());
    await assertFails(pinnedAdmin().collection('waitlist').get());
    await assertFails(anon().doc('waitlist/lead1').update({ email: 'x@example.com' }));
    await assertFails(anon().doc('waitlist/lead1').delete());
    await assertFails(pinnedAdmin().doc('waitlist/lead1').delete());
  });

  it("accepts main's waitlist form payload", async () => {
    await assertSucceeds(anon().collection('waitlist').add({ ...MAIN_LEAD, createdAt: serverTimestamp() }));
  });

  it("accepts 2.1's DemoForm fallback payload", async () => {
    await assertSucceeds(anon().collection('waitlist').add({ ...DEMO_LEAD, createdAt: serverTimestamp() }));
  });

  it('rejects a lead without a server timestamp', async () => {
    await assertFails(anon().collection('waitlist').add({ ...MAIN_LEAD, createdAt: new Date('2020-01-01') }));
    await assertFails(anon().collection('waitlist').add({ ...MAIN_LEAD }));
  });

  it('rejects unknown fields, a wrong type tag and oversized values', async () => {
    await assertFails(anon().collection('waitlist').add({ ...MAIN_LEAD, createdAt: serverTimestamp(), admin: true }));
    await assertFails(anon().collection('waitlist').add({ ...DEMO_LEAD, type: 'consumer', createdAt: serverTimestamp() }));
    await assertFails(anon().collection('waitlist').add({ ...MAIN_LEAD, message: 'x'.repeat(4001), createdAt: serverTimestamp() }));
    await assertFails(anon().collection('waitlist').add({ ...MAIN_LEAD, email: 42, createdAt: serverTimestamp() }));
    // main's keys with a demo-form field mixed in
    await assertFails(anon().collection('waitlist').add({ ...MAIN_LEAD, posSystem: 'Blaze', createdAt: serverTimestamp() }));
  });
});

describe('blogs', () => {
  const POST = { title: 'Hello', slug: 'hello', content: '<p>hi</p>', published: true, createdAt: new Date() };

  it('is publicly readable, including the whole-collection list main relies on', async () => {
    await seed('blogs/p1', POST);
    await seed('blogs/p2', { ...POST, slug: 'draft', published: false });
    await assertSucceeds(anon().doc('blogs/p1').get());
    await assertSucceeds(anon().collection('blogs').orderBy('createdAt', 'desc').get());
    await assertSucceeds(anon().collection('blogs').where('published', '==', true).get());
  });

  it('cannot be written anonymously or by a signed-in non-admin', async () => {
    await seed('blogs/p1', POST);
    await assertFails(anon().collection('blogs').add(POST));
    await assertFails(anon().doc('blogs/p1').update({ title: 'pwned' }));
    await assertFails(verifiedStranger().collection('blogs').add(POST));
    await assertFails(verifiedStranger().doc('blogs/p1').update({ title: 'pwned' }));
  });

  it('is NOT writable by an unverified account that merely carries an admin email', async () => {
    await seed('blogs/p1', POST);
    await assertFails(impostor().collection('blogs').add(POST));
    await assertFails(impostor().doc('blogs/p1').update({ title: 'pwned' }));
  });

  it('is writable by a pinned-uid admin and by a verified allowlisted email', async () => {
    await seed('blogs/p1', POST);
    await assertSucceeds(pinnedAdmin().collection('blogs').add(POST));
    await assertSucceeds(pinnedAdmin().doc('blogs/p1').update({ title: 'Edited', updatedAt: serverTimestamp() }));
    await assertSucceeds(verifiedAdmin().collection('blogs').add(POST));
    await assertSucceeds(verifiedAdmin().doc('blogs/p1').update({ published: false }));
  });

  it('cannot be deleted, even by an admin', async () => {
    await seed('blogs/p1', POST);
    await assertFails(anon().doc('blogs/p1').delete());
    await assertFails(pinnedAdmin().doc('blogs/p1').delete());
    await assertFails(verifiedAdmin().doc('blogs/p1').delete());
  });
});

describe('server-only and legacy collections', () => {
  for (const col of ['blog_subscribers', 'support_requests', 'blog-posts']) {
    it(`${col}: no browser access at all`, async () => {
      await seed(`${col}/d1`, { email: 'ada@example.com', createdAt: new Date() });
      for (const db of [anon(), verifiedStranger(), pinnedAdmin(), verifiedAdmin()]) {
        await assertFails(db.doc(`${col}/d1`).get());
        await assertFails(db.collection(col).get());
        await assertFails(db.collection(col).add({ email: 'x@example.com' }));
        await assertFails(db.doc(`${col}/d1`).update({ email: 'x@example.com' }));
        await assertFails(db.doc(`${col}/d1`).delete());
      }
    });
  }

  it('an unmatched collection is denied', async () => {
    await seed('merchants/m1', { name: 'x' });
    await assertFails(anon().doc('merchants/m1').get());
    await assertFails(pinnedAdmin().collection('merchants').add({ name: 'y' }));
  });
});
