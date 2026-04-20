export type CredentialStrength = "weak" | "fair" | "strong";

export type EncryptedSecretField = string;

export type VaultCredentialRecord = {
  id: string;
  vaultId: string;
  serviceName: string;
  serviceUrl: string | null;
  usernameEncrypted: EncryptedSecretField;
  passwordEncrypted: EncryptedSecretField;
  notesEncrypted: EncryptedSecretField | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  passwordStrengthScore: number | null;
};

export type DecryptedVaultCredential = Omit<
  VaultCredentialRecord,
  "usernameEncrypted" | "passwordEncrypted" | "notesEncrypted"
> & {
  username: string;
  password: string;
  notes: string;
  strength: CredentialStrength;
};

export type VaultOverviewPayload = {
  vaultId: string | null;
  credentials: VaultCredentialRecord[];
  availableTags: string[];
};

export type UpsertCredentialEncryptedInput = {
  vaultId: string;
  credentialId?: string;
  serviceName: string;
  serviceUrl?: string;
  usernameEncrypted: EncryptedSecretField;
  passwordEncrypted: EncryptedSecretField;
  notesEncrypted?: EncryptedSecretField;
  tags: string[];
  passwordStrengthScore: number;
  isFavorite?: boolean;
  isPinned?: boolean;
  lastUsedAt?: string;
};

export type CredentialActionResult =
  | {
      ok: true;
      credentialId: string;
    }
  | {
      ok: false;
      errorKey: string;
      fieldErrors?: {
        serviceName?: string;
        username?: string;
        password?: string;
        tags?: string;
      };
    };
