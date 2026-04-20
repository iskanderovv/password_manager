import { buildReuseMap } from "@/features/security-health/lib/reuse-detection";
import type { DecryptedVaultCredential } from "@/features/vault/types";

const STALE_DAYS = 180;

export type SecurityHealthIssueType =
  | "reused"
  | "weak"
  | "stale"
  | "missing-url"
  | "missing-notes";

export type SecurityHealthInsight = {
  totalCredentials: number;
  reusedCount: number;
  weakCount: number;
  staleCount: number;
  missingUrlCount: number;
  missingNotesCount: number;
  issues: Array<{
    type: SecurityHealthIssueType;
    credentialIds: string[];
  }>;
};

export async function analyzeSecurityHealth(credentials: DecryptedVaultCredential[]): Promise<SecurityHealthInsight> {
  const now = Date.now();
  const staleThreshold = STALE_DAYS * 24 * 60 * 60 * 1000;

  const { reusedById, reusedCount } = await buildReuseMap(credentials);

  const weakIds: string[] = [];
  const staleIds: string[] = [];
  const missingUrlIds: string[] = [];
  const missingNotesIds: string[] = [];
  const reusedIds: string[] = [];

  for (const item of credentials) {
    if (item.strength === "weak") weakIds.push(item.id);
    if (!item.serviceUrl) missingUrlIds.push(item.id);
    if (!item.notes.trim()) missingNotesIds.push(item.id);
    if (reusedById.get(item.id)) reusedIds.push(item.id);

    const updatedAt = new Date(item.updatedAt).getTime();
    if (now - updatedAt > staleThreshold) {
      staleIds.push(item.id);
    }
  }

  return {
    totalCredentials: credentials.length,
    reusedCount,
    weakCount: weakIds.length,
    staleCount: staleIds.length,
    missingUrlCount: missingUrlIds.length,
    missingNotesCount: missingNotesIds.length,
    issues: [
      { type: "reused", credentialIds: reusedIds },
      { type: "weak", credentialIds: weakIds },
      { type: "stale", credentialIds: staleIds },
      { type: "missing-url", credentialIds: missingUrlIds },
      { type: "missing-notes", credentialIds: missingNotesIds },
    ],
  };
}
