export const MIN_MASTER_PASSWORD_LENGTH = 12;

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
  score: PasswordStrengthLevel;
  labelKey: string;
  checks: {
    length: boolean;
    mixedCase: boolean;
    number: boolean;
    symbol: boolean;
  };
};

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= MIN_MASTER_PASSWORD_LENGTH,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^a-zA-Z0-9]/.test(password),
  };

  const score = (
    Object.values(checks).filter(Boolean).length as PasswordStrengthLevel
  );

  const labelKey =
    score <= 1
      ? "lock.strength.weak"
      : score === 2
        ? "lock.strength.fair"
        : score === 3
          ? "lock.strength.good"
          : "lock.strength.strong";

  return { score, labelKey, checks };
}

export function validateMasterPasswordInput(password: string, confirmPassword?: string) {
  const errors: {
    password?: string;
    confirmPassword?: string;
  } = {};

  if (!password) {
    errors.password = "lock.errors.passwordRequired";
    return errors;
  }

  if (password.length < MIN_MASTER_PASSWORD_LENGTH) {
    errors.password = "lock.errors.passwordTooShort";
  }

  const strength = evaluatePasswordStrength(password);
  if (strength.score < 3) {
    errors.password = "lock.errors.passwordTooWeak";
  }

  if (confirmPassword !== undefined) {
    if (!confirmPassword) {
      errors.confirmPassword = "lock.errors.confirmRequired";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "lock.errors.confirmMismatch";
    }
  }

  return errors;
}
