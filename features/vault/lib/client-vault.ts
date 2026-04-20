import { decrypt, encrypt } from "@/lib/crypto/vault-crypto";
import { parseEncryptedField, serializeEncryptedField } from "@/features/vault/lib/encrypted-field";
import { evaluateCredentialPasswordStrength } from "@/features/security-health/lib/password-strength";
import type { DecryptedVaultCredential, UpsertCredentialEncryptedInput, VaultCredentialRecord } from "@/features/vault/types";

export type VaultSort = "recent" | "alphabetical" | "weakest";

export type VaultFilterState = {
  query: string;
  tag: string;
  strength: "all" | "weak" | "fair" | "strong";
  reusedOnly: boolean;
  favoritesOnly: boolean;
  sort: VaultSort;
};

export async function decryptCredentialRecord(
  record: VaultCredentialRecord,
  key: CryptoKey,
): Promise<DecryptedVaultCredential> {
  const [username, password, notes] = await Promise.all([
    decrypt(parseEncryptedField(record.usernameEncrypted), key),
    decrypt(parseEncryptedField(record.passwordEncrypted), key),
    record.notesEncrypted ? decrypt(parseEncryptedField(record.notesEncrypted), key) : Promise.resolve(""),
  ]);

  return {
    ...record,
    username,
    password,
    notes,
    strength: evaluateCredentialPasswordStrength(password).label,
  };
}

export async function buildEncryptedCredentialInput(input: {
  vaultId: string;
  credentialId?: string;
  serviceName: string;
  serviceUrl: string;
  username: string;
  password: string;
  notes: string;
  tags: string[];
  passwordStrengthScore: number;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt?: string;
  key: CryptoKey;
}): Promise<UpsertCredentialEncryptedInput> {
  const [usernameEncrypted, passwordEncrypted, notesEncrypted] = await Promise.all([
    encrypt(input.username, input.key).then(serializeEncryptedField),
    encrypt(input.password, input.key).then(serializeEncryptedField),
    input.notes ? encrypt(input.notes, input.key).then(serializeEncryptedField) : Promise.resolve(undefined),
  ]);

  return {
    credentialId: input.credentialId,
    vaultId: input.vaultId,
    serviceName: input.serviceName,
    serviceUrl: input.serviceUrl,
    usernameEncrypted,
    passwordEncrypted,
    notesEncrypted,
    tags: input.tags,
    passwordStrengthScore: input.passwordStrengthScore,
    isFavorite: input.isFavorite,
    isPinned: input.isPinned,
    lastUsedAt: input.lastUsedAt,
  };
}

export function filterAndSortCredentials(
  credentials: DecryptedVaultCredential[],
  filters: VaultFilterState,
  reusedById: Map<string, boolean>,
) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  const filtered = credentials.filter((item) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [item.serviceName, item.username, item.serviceUrl ?? "", item.notes, item.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    const matchesTag = filters.tag === "all" || item.tags.includes(filters.tag);
    const matchesStrength = filters.strength === "all" || item.strength === filters.strength;
    const matchesReused = !filters.reusedOnly || reusedById.get(item.id) === true;
    const matchesFavorite = !filters.favoritesOnly || item.isFavorite;

    return matchesQuery && matchesTag && matchesStrength && matchesReused && matchesFavorite;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "alphabetical") {
      return a.serviceName.localeCompare(b.serviceName);
    }

    if (filters.sort === "weakest") {
      const rank = { weak: 0, fair: 1, strong: 2 };
      return rank[a.strength] - rank[b.strength];
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function getDomain(url: string | null) {
  if (!url) return "";

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
