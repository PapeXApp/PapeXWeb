// Security-rule tests for the papexweb-aed97 Cloud Storage bucket (storage.rules).
//
// Run with:
//   npm run test:storage-rules
//
// Needs `firebase` and `@firebase/rules-unit-testing@4` resolvable from this
// repo (the latter is not a dependency of the site:
// `npm install --no-save @firebase/rules-unit-testing@4.0.1`) and a JDK for
// the emulator, e.g. JAVA_HOME=/opt/homebrew/opt/openjdk@27.
//
// What these pin down:
//   1. Signed out, or signed in as anyone who is not a blog admin, you can
//      neither read nor write anything.
//   2. An allowlisted email only counts once it is verified.
//   3. Blog admins can manage images under blog-images/, within the same
//      type and size limits as /api/upload-image, and nowhere else.
import { readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import 'firebase/compat/storage';

const PROJECT_ID = 'papexweb-rules-test';

// A uid pinned in storage.rules; its email is deliberately unverified.
const PINNED_ADMIN_UID = '7r5IEt2BcgQDCt2J83FgFlnZ5zt1';

const MAX_BYTES = 4 * 1024 * 1024;
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const png = { contentType: 'image/png' };

let testEnv;

before(async () => {
  const [host, port] = (process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199').split(':');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: readFileSync(new URL('../storage.rules', import.meta.url), 'utf8'),
      host,
      port: Number(port),
    },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

const anon = () => testEnv.unauthenticatedContext().storage();
const pinnedAdmin = () => testEnv.authenticatedContext(PINNED_ADMIN_UID, { email: 'nico.courbage@gmail.com', email_verified: false }).storage();
const verifiedAdmin = () => testEnv.authenticatedContext('uid_new_admin', { email: 'nico@papex.app', email_verified: true }).storage();
const impostor = () => testEnv.authenticatedContext('uid_impostor', { email: 'nico@papex.app', email_verified: false }).storage();
const verifiedStranger = () => testEnv.authenticatedContext('uid_stranger', { email: 'someone@example.com', email_verified: true }).storage();
// On the client-side UI allowlist only (LEGACY_PLACEHOLDER_ADMIN_EMAILS), never trusted by a server or rules.
const placeholderAdmin = () => testEnv.authenticatedContext('uid_placeholder', { email: 'admin@gmail.com', email_verified: true }).storage();

const NON_ADMINS = { anon, impostor, verifiedStranger, placeholderAdmin };

async function seed(path) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.storage().ref(path).put(PNG, png);
  });
}

describe('blog-images/ for non-admins', () => {
  for (const [name, storage] of Object.entries(NON_ADMINS)) {
    it(`${name}: cannot upload`, async () => {
      await assertFails(storage().ref(`blog-images/${name}.png`).put(PNG, png));
    });

    it(`${name}: cannot read, overwrite or delete an existing image`, async () => {
      await seed('blog-images/existing.png');
      await assertFails(storage().ref('blog-images/existing.png').getMetadata());
      await assertFails(storage().ref('blog-images/existing.png').getDownloadURL());
      await assertFails(storage().ref('blog-images/existing.png').put(PNG, png));
      await assertFails(storage().ref('blog-images/existing.png').delete());
    });
  }
});

describe('blog-images/ for blog admins', () => {
  for (const [name, storage] of Object.entries({ pinnedAdmin, verifiedAdmin })) {
    it(`${name}: can upload, read, replace and delete an image`, async () => {
      const ref = storage().ref(`blog-images/posts/${name}.png`);
      await assertSucceeds(ref.put(PNG, png));
      await assertSucceeds(ref.getMetadata());
      await assertSucceeds(ref.getDownloadURL());
      await assertSucceeds(ref.put(PNG, { contentType: 'image/webp' }));
      await assertSucceeds(ref.delete());
    });
  }

  it('accepts every type /api/upload-image accepts', async () => {
    for (const type of ['jpeg', 'png', 'gif', 'webp', 'avif']) {
      await assertSucceeds(pinnedAdmin().ref(`blog-images/type.${type}`).put(PNG, { contentType: `image/${type}` }));
    }
  });

  it('rejects anything that is not one of those image types', async () => {
    for (const contentType of ['text/html', 'image/svg+xml', 'application/javascript', 'application/octet-stream']) {
      await assertFails(pinnedAdmin().ref('blog-images/not-an-image').put(PNG, { contentType }));
    }
  });

  it('accepts exactly 4 MB and rejects one byte more', async () => {
    await assertSucceeds(pinnedAdmin().ref('blog-images/max.png').put(new Uint8Array(MAX_BYTES), png));
    await assertFails(pinnedAdmin().ref('blog-images/too-big.png').put(new Uint8Array(MAX_BYTES + 1), png));
  });
});

describe('everything outside blog-images/', () => {
  for (const path of ['root.png', 'uploads/a.png', 'blog-images-other/a.png']) {
    it(`${path}: closed to admins and everyone else`, async () => {
      await seed(path);
      for (const storage of [anon, verifiedStranger, pinnedAdmin, verifiedAdmin]) {
        await assertFails(storage().ref(path).getMetadata());
        await assertFails(storage().ref(path).put(PNG, png));
        await assertFails(storage().ref(path).delete());
      }
    });
  }
});
