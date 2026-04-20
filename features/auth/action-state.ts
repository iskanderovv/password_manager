export type LockActionState = {
  status: "idle" | "error" | "success";
  errorKey?: string;
  fieldErrors?: {
    password?: string;
    confirmPassword?: string;
  };
  unlock?: {
    vaultId: string;
    keyDerivationSalt: string;
    keyDerivationIterations: number;
    keyDerivationHash: string;
    encryptionKeyVersion: number;
  };
};

export const initialLockActionState: LockActionState = {
  status: "idle",
};
