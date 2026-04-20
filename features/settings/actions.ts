"use server";

import { rotateMasterPassword } from "@/lib/auth/master-password";

type RotateMasterPasswordActionInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  newKeyDerivationSalt: string;
  newKeyDerivationIterations: number;
  rotatedCredentials: Array<{
    id: string;
    usernameEncrypted: string;
    passwordEncrypted: string;
    notesEncrypted?: string | null;
  }>;
};

export async function rotateMasterPasswordAction(input: RotateMasterPasswordActionInput) {
  return rotateMasterPassword(input);
}
