import type { CredentialStrength } from "@/features/vault/types";

export type CredentialPasswordStrength = {
  score: number;
  label: CredentialStrength;
};

export function evaluateCredentialPasswordStrength(password: string): CredentialPasswordStrength {
  const length = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  let score = 0;

  if (length >= 8) score += 20;
  if (length >= 12) score += 20;
  if (length >= 16) score += 20;

  score += variety * 10;

  if (length >= 14 && variety >= 3) {
    score += 10;
  }

  const boundedScore = Math.min(100, score);

  if (boundedScore < 45) {
    return { score: boundedScore, label: "weak" };
  }

  if (boundedScore < 75) {
    return { score: boundedScore, label: "fair" };
  }

  return { score: boundedScore, label: "strong" };
}
