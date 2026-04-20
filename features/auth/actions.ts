"use server";

import {
  createInitialMasterPassword,
  verifyMasterPassword,
} from "@/lib/auth/master-password";
import type { LockActionState } from "@/features/auth/action-state";

export async function createMasterPasswordAction(
  _prevState: LockActionState,
  formData: FormData,
): Promise<LockActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const result = await createInitialMasterPassword(password, confirmPassword);

  if (!result.ok) {
    return {
      status: "error",
      errorKey: result.errorKey,
      fieldErrors: result.fieldErrors,
    };
  }

  return {
    status: "success",
    unlock: {
      vaultId: result.vaultId,
      keyDerivationSalt: result.keyDerivationSalt,
      keyDerivationIterations: result.keyDerivationIterations,
      keyDerivationHash: result.keyDerivationHash,
      encryptionKeyVersion: result.encryptionKeyVersion,
    },
  };
}

export async function unlockVaultAction(
  _prevState: LockActionState,
  formData: FormData,
): Promise<LockActionState> {
  const password = String(formData.get("password") ?? "");

  const result = await verifyMasterPassword(password);

  if (!result.ok) {
    return {
      status: "error",
      errorKey: result.errorKey,
    };
  }

  return {
    status: "success",
    unlock: {
      vaultId: result.vaultId,
      keyDerivationSalt: result.keyDerivationSalt,
      keyDerivationIterations: result.keyDerivationIterations,
      keyDerivationHash: result.keyDerivationHash,
      encryptionKeyVersion: result.encryptionKeyVersion,
    },
  };
}
