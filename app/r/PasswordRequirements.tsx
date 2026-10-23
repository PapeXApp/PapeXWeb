// app/r/PasswordRequirements.tsx
//
// The live requirement list under the sign-up password field in the "Save to
// PapeX" sheet. Rules and wording come from lib/passwordRules.ts, which
// mirrors the PapeX app's sign-up screen, so what this ticks is what
// Firebase will accept. No hooks and no "use client": it is a pure function
// of `password`, so it renders on the server and in app/r/passwordRequirements.test.tsx.

import { getPasswordChecks, symbolHint } from "@/lib/passwordRules";

const OK = "#34C759";
const MUTED = "rgba(255, 255, 255, 0.45)";
const WARN = "#FF9F0A";

export default function PasswordRequirements({ password, id }: { password: string; id?: string }) {
  const checks = getPasswordChecks(password);
  const specialMet = checks[checks.length - 1].met;
  // Only while the special character is still missing: once one counts, a
  // leftover "+ doesn't count" line is noise.
  const hint = specialMet ? "" : symbolHint(password);
  return (
    <div id={id} className="text-xs" style={{ color: MUTED }}>
      <ul aria-label="Password requirements" className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
        {checks.map((check) => (
          <li key={check.label} style={{ color: check.met ? OK : MUTED }}>
            <span aria-hidden="true">{check.met ? "✓" : "○"}</span> {check.label}
            <span className="sr-only">{check.met ? " (met)" : " (not met yet)"}</span>
          </li>
        ))}
      </ul>
      {/* Always rendered, so a screen reader that has seen the (empty)
          live region announces the hint when it appears. */}
      <p aria-live="polite" className={hint ? "mt-1.5" : undefined} style={{ color: WARN }}>
        {hint}
      </p>
    </div>
  );
}
