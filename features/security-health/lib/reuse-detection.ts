import type { DecryptedVaultCredential } from "@/features/vault/types";

const textEncoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fingerprintPassword(password: string) {
  const hash = await crypto.subtle.digest("SHA-256", textEncoder.encode(password));
  return toHex(hash);
}

export async function buildReuseMap(credentials: DecryptedVaultCredential[]) {
  // Reuse detection is computed from ephemeral in-memory fingerprints only while unlocked.
  const fingerprints = await Promise.all(
    credentials.map(async (item) => ({
      id: item.id,
      fingerprint: await fingerprintPassword(item.password),
    })),
  );

  const counts = new Map<string, number>();
  for (const item of fingerprints) {
    counts.set(item.fingerprint, (counts.get(item.fingerprint) ?? 0) + 1);
  }

  const reusedById = new Map<string, boolean>();
  let reusedCount = 0;

  for (const item of fingerprints) {
    const isReused = (counts.get(item.fingerprint) ?? 0) > 1;
    reusedById.set(item.id, isReused);
    if (isReused) {
      reusedCount += 1;
    }
  }

  return {
    reusedById,
    reusedCount,
  };
}
