// lib/passwordRules.ts
//
// The ONE place this site decides what a new PapeX password has to look like.
// It is used by the "Save to PapeX" sign-up sheet on /r and /w
// (app/r/SaveToPapex.tsx). Sign-in never checks these rules: existing
// accounts keep passwords that predate them.
//
// The server's rules are the papexv2 Auth password policy, which is ENFORCED
// (GET identitytoolkit v2/passwordPolicy): at least 8 characters, an
// uppercase letter, a lowercase letter, a number, and a symbol FROM A FIXED
// LIST. Firebase only counts a character as the symbol when it is on
// `allowedNonAlphanumericCharacters`, so `+`, `=`, spaces and accented
// letters do NOT count. Checking "any non-alphanumeric character" lets
// "Receipts+2026" through, and Firebase then refuses the sign-up with
// auth/password-does-not-meet-requirements.
//
// On top of the server's rules the PapeX app asks for 10 characters and
// refuses a short list of common passwords. This module mirrors the app's
// services/passwordRules.ts in PapeXV2 (same constants, same labels, same
// error copy), so a password never passes here and fails in the app, or the
// other way round. lib/passwordRules.test.ts holds the two together:
//   - lib/passwordRules.fixture.json is the app's own output for a fixed set
//     of passwords, and this module must reproduce it exactly;
//   - the real Firebase SDK check, run against the pinned policy below,
//     must accept every password this module accepts;
//   - with PAPEXV2_PASSWORD_RULES=<path to PapeXV2/services/passwordRules.ts>
//     the test also runs the app's current file over the same passwords plus
//     4,000 more, so drift in the app fails here too.
// If the console policy changes, change PASSWORD_SYMBOLS / the minimums here
// and in the app together, then regenerate the fixture
// (scripts/gen-password-rules-fixture.ts).
//
// Pure (no React, no Firebase) so it can be unit-tested with node.

/** papexv2's `allowedNonAlphanumericCharacters`, as of 2026-10-23. If the
 * console policy changes, update this; sign-up still fails safe, because
 * `PASSWORD_POLICY_ERROR_MESSAGE` is shown when the server refuses. */
export const PASSWORD_SYMBOLS = "^$*.[]{}()?\"!@#%&/\\,><':;|_~`-";

/** This site's (and the app's) minimum. The server's own minimum is 8. */
export const MIN_PASSWORD_LENGTH = 10;

/** The server's minimum, pinned so the test can check ours is never lower. */
export const SERVER_MIN_PASSWORD_LENGTH = 8;

export const COMMON_PASSWORDS: readonly string[] = [
  "password", "123456", "123456789", "qwerty", "abc123", "111111", "123123", "letmein", "welcome", "admin", "iloveyou", "monkey", "login", "football", "starwars", "dragon", "passw0rd", "master", "hello", "freedom", "whatever", "qazwsx", "trustno1", "654321", "jordan23", "superman", "michael", "shadow", "baseball", "batman", "zaq1zaq1", "password1", "123qwe",
];

export interface PasswordCheck {
  label: string;
  met: boolean;
}

const hasUpper = (chars: string[]) => chars.some((c) => c >= "A" && c <= "Z");
const hasLower = (chars: string[]) => chars.some((c) => c >= "a" && c <= "z");
const hasNumber = (chars: string[]) => chars.some((c) => c >= "0" && c <= "9");
const hasSymbol = (chars: string[]) => chars.some((c) => PASSWORD_SYMBOLS.includes(c));

/** The requirement list, in order. Length counts characters (code points).
 * Firebase's own check counts UTF-16 units, which is never fewer, so a
 * password long enough here is long enough there (an emoji counts 1 here,
 * 2 there). */
export function getPasswordChecks(password: string): PasswordCheck[] {
  const chars = Array.from(password);
  return [
    { label: `${MIN_PASSWORD_LENGTH} characters`, met: chars.length >= MIN_PASSWORD_LENGTH },
    { label: "Uppercase letter", met: hasUpper(chars) },
    { label: "Lowercase letter", met: hasLower(chars) },
    { label: "Number", met: hasNumber(chars) },
    { label: "Special character", met: hasSymbol(chars) },
  ];
}

/** The first rule the password breaks, as a sentence, or null. */
export function validateStrongPassword(password: string): string | null {
  const chars = Array.from(password);
  if (chars.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!hasUpper(chars)) return "Password must include at least one uppercase letter.";
  if (!hasLower(chars)) return "Password must include at least one lowercase letter.";
  if (!hasNumber(chars)) return "Password must include at least one number.";
  if (!hasSymbol(chars)) {
    const hint = symbolHint(password);
    return hint
      ? `Password must include at least one special character. ${hint}`
      : "Password must include at least one special character, such as ! @ # $ or %.";
  }
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) return "Password is too common or weak. Please choose a stronger password.";
  return null;
}

/** Characters in the password that look like symbols but don't count as
 * one (not a letter, digit or listed symbol), each once, in order. */
export function symbolsThatDontCount(password: string): string[] {
  const seen = Array.from(password).filter((c) => !/[A-Za-z0-9]/.test(c) && !PASSWORD_SYMBOLS.includes(c));
  return [...new Set(seen)];
}

/** "+ doesn't count as a special character here. …", or '' when every
 * symbol in the password counts. Same wording as the app. */
export function symbolHint(password: string): string {
  const names = symbolsThatDontCount(password).map((c) => (c === " " ? "Spaces" : c));
  if (names.length === 0) return "";
  const subject = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const verb = names.length === 1 && names[0] !== "Spaces" ? "doesn’t" : "don’t";
  return `${subject} ${verb} count as a special character here. Use one like ! @ # $ or %.`;
}

/** What to show when the SERVER refuses a new password: the real rules, not
 * "at least 6 characters". Same wording as the app's auth error copy. */
export const PASSWORD_POLICY_ERROR_MESSAGE =
  `That password doesn't meet the requirements. Use at least ${MIN_PASSWORD_LENGTH} characters with an uppercase letter, a lowercase letter, a number and a special character such as ! @ # $ or %.`;

/** True for the Firebase Auth error codes that mean "the password breaks the
 * policy": the current `auth/password-does-not-meet-requirements` and the
 * legacy `auth/weak-password`. Accepts the code with or without the
 * `auth/` prefix. */
export function isPasswordPolicyErrorCode(code: string): boolean {
  return code.includes("password-does-not-meet-requirements") || code.includes("weak-password");
}
