export type CredentialValidationInput = {
  serviceName: string;
  username: string;
  password: string;
  tags: string[];
};

export function normalizeCredentialTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().replace(/\s+/g, " "))
        .filter(Boolean)
        .slice(0, 12),
    ),
  );
}

export function validateCredentialInput(input: CredentialValidationInput) {
  const fieldErrors: {
    serviceName?: string;
    username?: string;
    password?: string;
    tags?: string;
  } = {};

  if (!input.serviceName.trim()) {
    fieldErrors.serviceName = "vault.form.errors.serviceRequired";
  }

  if (!input.username.trim()) {
    fieldErrors.username = "vault.form.errors.usernameRequired";
  }

  if (!input.password) {
    fieldErrors.password = "vault.form.errors.passwordRequired";
  }

  if (input.tags.length > 12) {
    fieldErrors.tags = "vault.form.errors.tooManyTags";
  }

  return fieldErrors;
}
