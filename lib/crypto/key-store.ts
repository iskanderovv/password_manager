type ActiveVaultKeyState = {
  key: CryptoKey;
  vaultId: string;
  keyDerivationHash: string;
  keyDerivationIterations: number;
  keyDerivationSalt: string;
  encryptionKeyVersion: number;
};

type PersistedActiveVaultKeyState = Omit<ActiveVaultKeyState, "key"> & {
  keyRawBase64: string;
};

const globalForVaultKeyStore = globalThis as unknown as {
  __cipherteamsActiveVaultKeyState?: ActiveVaultKeyState | null;
};

const ACTIVE_VAULT_KEY_STORAGE_KEY = "cipherteams.vault.active-key";

function getState() {
  return globalForVaultKeyStore.__cipherteamsActiveVaultKeyState ?? null;
}

function hasWindow() {
  return typeof window !== "undefined";
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

function base64ToUint8Array(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function persistActiveVaultKey(state: ActiveVaultKeyState) {
  if (!hasWindow()) return;

  try {
    const rawKey = await crypto.subtle.exportKey("raw", state.key);
    const payload: PersistedActiveVaultKeyState = {
      vaultId: state.vaultId,
      keyDerivationHash: state.keyDerivationHash,
      keyDerivationIterations: state.keyDerivationIterations,
      keyDerivationSalt: state.keyDerivationSalt,
      encryptionKeyVersion: state.encryptionKeyVersion,
      keyRawBase64: arrayBufferToBase64(rawKey),
    };
    window.sessionStorage.setItem(ACTIVE_VAULT_KEY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    window.sessionStorage.removeItem(ACTIVE_VAULT_KEY_STORAGE_KEY);
  }
}

export function setActiveVaultKey(state: ActiveVaultKeyState) {
  globalForVaultKeyStore.__cipherteamsActiveVaultKeyState = state;
  void persistActiveVaultKey(state);
}

export function getActiveVaultKey() {
  return getState();
}

export function clearActiveVaultKey() {
  globalForVaultKeyStore.__cipherteamsActiveVaultKeyState = null;
  if (hasWindow()) {
    window.sessionStorage.removeItem(ACTIVE_VAULT_KEY_STORAGE_KEY);
  }
}

export async function restoreActiveVaultKey() {
  if (!hasWindow()) return null;

  const current = getState();
  if (current) return current;

  const raw = window.sessionStorage.getItem(ACTIVE_VAULT_KEY_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedActiveVaultKeyState;
    const keyBytes = base64ToUint8Array(parsed.keyRawBase64);
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, [
      "encrypt",
      "decrypt",
    ]);

    const restored: ActiveVaultKeyState = {
      key,
      vaultId: parsed.vaultId,
      keyDerivationHash: parsed.keyDerivationHash,
      keyDerivationIterations: parsed.keyDerivationIterations,
      keyDerivationSalt: parsed.keyDerivationSalt,
      encryptionKeyVersion: parsed.encryptionKeyVersion,
    };

    globalForVaultKeyStore.__cipherteamsActiveVaultKeyState = restored;
    return restored;
  } catch {
    window.sessionStorage.removeItem(ACTIVE_VAULT_KEY_STORAGE_KEY);
    return null;
  }
}
