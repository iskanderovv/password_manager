type ActiveVaultKeyState = {
  key: CryptoKey;
  vaultId: string;
  keyDerivationHash: string;
  keyDerivationIterations: number;
  keyDerivationSalt: string;
  encryptionKeyVersion: number;
};

let activeVaultKeyState: ActiveVaultKeyState | null = null;

export function setActiveVaultKey(state: ActiveVaultKeyState) {
  activeVaultKeyState = state;
}

export function getActiveVaultKey() {
  return activeVaultKeyState;
}

export function clearActiveVaultKey() {
  activeVaultKeyState = null;
}
