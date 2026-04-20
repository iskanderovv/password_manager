type ActiveVaultKeyState = {
  key: CryptoKey;
  vaultId: string;
  keyDerivationHash: string;
  keyDerivationIterations: number;
  keyDerivationSalt: string;
  encryptionKeyVersion: number;
};

const globalForVaultKeyStore = globalThis as unknown as {
  __cipherteamsActiveVaultKeyState?: ActiveVaultKeyState | null;
};

function getState() {
  return globalForVaultKeyStore.__cipherteamsActiveVaultKeyState ?? null;
}

export function setActiveVaultKey(state: ActiveVaultKeyState) {
  globalForVaultKeyStore.__cipherteamsActiveVaultKeyState = state;
}

export function getActiveVaultKey() {
  return getState();
}

export function clearActiveVaultKey() {
  globalForVaultKeyStore.__cipherteamsActiveVaultKeyState = null;
}
