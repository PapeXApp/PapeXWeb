// app/r/signInSheetError.ts
//
// Firebase Auth error code -> the sentence the "Save to PapeX" sheet shows
// (app/r/SaveToPapex.tsx). Pure, so app/r/signInSheetError.test.ts can pin
// the copy. The password-policy branch must state the REAL rules
// (lib/passwordRules.ts); it used to say "at least 6 characters", which is
// Firebase's default and not papexv2's policy, and the current
// `auth/password-does-not-meet-requirements` code fell through to the
// generic message.

import { PASSWORD_POLICY_ERROR_MESSAGE, isPasswordPolicyErrorCode } from "@/lib/passwordRules";

export function signInSheetError(code: string): string {
  if (code.includes("wrong-password") || code.includes("invalid-credential")) {
    return "Incorrect email or password.";
  }
  if (code.includes("user-not-found")) {
    return "No PapeX account with that email yet — try Sign up instead.";
  }
  if (code.includes("email-already-in-use")) {
    return "An account already exists with that email — try Sign in instead.";
  }
  if (isPasswordPolicyErrorCode(code)) {
    return PASSWORD_POLICY_ERROR_MESSAGE;
  }
  return "Couldn't sign in. Check your details and try again.";
}
