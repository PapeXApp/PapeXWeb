// scripts/seed-merchants.ts
//
// One-time seed of the shared merchant records into papexv2 Firestore:
//   merchants/{id}                 from SEED_MERCHANTS (version 1)
//   merchants/{id}/history/{hid}   one "initial seed" entry per written record
//   merchantAccounts/{id}          from SEED_ACCOUNTS
//
//   npx tsx scripts/seed-merchants.ts                  DRY RUN (default): prints the plan
//   npx tsx scripts/seed-merchants.ts --apply          writes docs that don't exist yet
//   npx tsx scripts/seed-merchants.ts --apply --force  also overwrites existing docs
//
// Needs PAPEXV2_SERVICE_ACCOUNT (service-account JSON, raw or base64) to
// check or write anything. After seeding, Firestore is the source of truth:
// edit merchants in the admin area, not in lib/merchantProfiles/seed.

import { PLACEHOLDER_EMAILS, SEED_ACCOUNTS, SEED_MERCHANTS } from "../lib/merchantProfiles/seed";
import { buildHistoryEntry } from "../lib/server/merchantData/shared";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const FORCE = args.has("--force");

function describeRecord(id: string): string {
  const r = SEED_MERCHANTS.find((m) => m.id === id)!;
  const menuItems = (r.menu ?? []).reduce((n, c) => n + c.items.length, 0);
  return `"${r.name}": ${r.deals?.length ?? 0} deals, ${menuItems} menu items, ${r.coupons?.length ?? 0} coupons, ${r.whatsNew?.length ?? 0} updates, version ${r.version}`;
}

async function main(): Promise<void> {
  console.log(`seed-merchants: ${APPLY ? "APPLY" : "DRY RUN"}${FORCE ? " (--force)" : ""}\n`);
  console.log("Plan:");
  for (const r of SEED_MERCHANTS) console.log(`  merchants/${r.id}  ${describeRecord(r.id)}`);
  for (const a of SEED_ACCOUNTS) console.log(`  merchantAccounts/${a.merchantId}  dashboardEmails=${JSON.stringify(a.dashboardEmails)}`);
  console.log("");

  if (!process.env.PAPEXV2_SERVICE_ACCOUNT?.trim()) {
    console.log("Needs PAPEXV2_SERVICE_ACCOUNT (papexv2 service-account JSON, raw or base64) to check existing docs or write.");
    console.log("Nothing was read or written.");
    process.exit(APPLY ? 1 : 0);
  }

  const { getPapexV2Db } = await import("../lib/server/firebaseAdminV2");
  const db = getPapexV2Db();

  type Op = { path: string; exists: boolean; write: boolean; data: object; history?: object };
  const ops: Op[] = [];
  const now = new Date().toISOString();
  for (const r of SEED_MERCHANTS) {
    const ref = db.collection("merchants").doc(r.id);
    const exists = (await ref.get()).exists;
    const histRef = ref.collection("history").doc();
    const record = { ...r, updatedAt: now, updatedBy: "seed-merchants" };
    ops.push({
      path: ref.path,
      exists,
      write: !exists || FORCE,
      data: record,
      history: buildHistoryEntry({ id: histRef.id, merchantId: r.id, at: now, by: "seed-merchants", before: {}, after: record }),
    });
  }
  for (const a of SEED_ACCOUNTS) {
    const ref = db.collection("merchantAccounts").doc(a.merchantId);
    const exists = (await ref.get()).exists;
    const data = { ...a, dashboardEmails: a.dashboardEmails.filter((e) => !PLACEHOLDER_EMAILS.includes(e)) };
    ops.push({ path: ref.path, exists, write: !exists || FORCE, data });
  }

  for (const op of ops) {
    const state = op.exists ? (op.write ? "EXISTS, will overwrite (--force)" : "exists, skip (use --force to overwrite)") : "new, will create";
    console.log(`  ${op.path}: ${state}`);
  }

  if (!APPLY) {
    console.log("\nDry run: nothing written. Re-run with --apply to write.");
    return;
  }

  const batch = db.batch();
  let count = 0;
  for (const op of ops) {
    if (!op.write) continue;
    batch.set(db.doc(op.path), op.data);
    if (op.history) {
      const h = op.history as { id: string };
      batch.set(db.doc(`${op.path}/history/${h.id}`), op.history);
    }
    count += 1;
  }
  if (count === 0) {
    console.log("\nNothing to write.");
    return;
  }
  await batch.commit();
  console.log(`\nWrote ${count} document(s).`);
}

main().catch((err) => {
  console.error("seed-merchants failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
