const VAULT_UNLOCKED_STORAGE_KEY = "cipherteams.vault.unlocked";
const VAULT_LAST_UNLOCKED_STORAGE_KEY = "cipherteams.vault.last-unlocked-at";

function hasWindow() {
  return typeof window !== "undefined";
}

export function markVaultUnlocked() {
  if (!hasWindow()) return;
  window.sessionStorage.setItem(VAULT_UNLOCKED_STORAGE_KEY, "1");
  window.sessionStorage.setItem(VAULT_LAST_UNLOCKED_STORAGE_KEY, new Date().toISOString());
}

export function isVaultUnlocked() {
  if (!hasWindow()) return false;
  return window.sessionStorage.getItem(VAULT_UNLOCKED_STORAGE_KEY) === "1";
}

export function clearVaultUnlocked() {
  if (!hasWindow()) return;
  window.sessionStorage.removeItem(VAULT_UNLOCKED_STORAGE_KEY);
}

export function getLastUnlockedAt() {
  if (!hasWindow()) return null;
  return window.sessionStorage.getItem(VAULT_LAST_UNLOCKED_STORAGE_KEY);
}

export function clearVaultOnRefreshOrClose() {
  if (!hasWindow()) return () => {};

  const lockHandler = () => {
    clearVaultUnlocked();
  };

  window.addEventListener("beforeunload", lockHandler);

  return () => {
    window.removeEventListener("beforeunload", lockHandler);
  };
}
