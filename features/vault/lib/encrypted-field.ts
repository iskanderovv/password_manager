import type { EncryptedPayload } from "@/lib/crypto/vault-crypto";

export function serializeEncryptedField(payload: EncryptedPayload) {
  return JSON.stringify(payload);
}

export function parseEncryptedField(value: string): EncryptedPayload {
  const parsed: unknown = JSON.parse(value);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("iv" in parsed) ||
    !("ciphertext" in parsed) ||
    typeof parsed.iv !== "string" ||
    typeof parsed.ciphertext !== "string"
  ) {
    throw new Error("Invalid encrypted payload format");
  }

  return {
    iv: parsed.iv,
    ciphertext: parsed.ciphertext,
  };
}
