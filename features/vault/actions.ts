"use server";

import {
  createCredential,
  deleteCredentialById,
  setCredentialFavorite,
  updateCredential,
} from "@/features/vault/lib/server-vault";
import type { CredentialActionResult, UpsertCredentialEncryptedInput } from "@/features/vault/types";

function validateEncryptedInput(input: UpsertCredentialEncryptedInput) {
  const fieldErrors: {
    serviceName?: string;
    username?: string;
    password?: string;
    tags?: string;
  } = {};

  if (!input.serviceName.trim()) {
    fieldErrors.serviceName = "vault.form.errors.serviceRequired";
  }

  if (!input.usernameEncrypted.trim()) {
    fieldErrors.username = "vault.form.errors.usernameRequired";
  }

  if (!input.passwordEncrypted.trim()) {
    fieldErrors.password = "vault.form.errors.passwordRequired";
  }

  return fieldErrors;
}

export async function createCredentialAction(input: UpsertCredentialEncryptedInput): Promise<CredentialActionResult> {
  const fieldErrors = validateEncryptedInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      errorKey: "vault.form.errors.invalidInput",
      fieldErrors,
    };
  }

  const credentialId = await createCredential(input);
  if (!credentialId) {
    return {
      ok: false,
      errorKey: "vault.form.errors.vaultMissing",
    };
  }

  return {
    ok: true,
    credentialId,
  };
}

export async function updateCredentialAction(input: UpsertCredentialEncryptedInput): Promise<CredentialActionResult> {
  const fieldErrors = validateEncryptedInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      errorKey: "vault.form.errors.invalidInput",
      fieldErrors,
    };
  }

  const credentialId = await updateCredential(input);
  if (!credentialId) {
    return {
      ok: false,
      errorKey: "vault.form.errors.notFound",
    };
  }

  return {
    ok: true,
    credentialId,
  };
}

export async function deleteCredentialAction(input: { credentialId: string; vaultId: string }) {
  return deleteCredentialById(input);
}

export async function toggleFavoriteCredentialAction(input: {
  credentialId: string;
  vaultId: string;
  isFavorite: boolean;
}) {
  return setCredentialFavorite(input);
}
