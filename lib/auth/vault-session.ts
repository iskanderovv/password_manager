const VAULT_UNLOCKED_STORAGE_KEY = "cipherteams.vault.unlocked";

function hasWindow() {
  return typeof window !== "undefined";
}

export function markVaultUnlocked() {
  if (!hasWindow()) return;
  window.sessionStorage.setItem(VAULT_UNLOCKED_STORAGE_KEY, "1");
}

export function isVaultUnlocked() {
  if (!hasWindow()) return false;
  return window.sessionStorage.getItem(VAULT_UNLOCKED_STORAGE_KEY) === "1";
}

export function clearVaultUnlocked() {
  if (!hasWindow()) return;
  window.sessionStorage.removeItem(VAULT_UNLOCKED_STORAGE_KEY);
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

export function lockIfPageReloaded() {
  if (!hasWindow()) return;

  const navEntries = window.performance.getEntriesByType("navigation");
  const navEntry = navEntries[0] as PerformanceNavigationTiming | undefined;

  if (navEntry?.type === "reload") {
    clearVaultUnlocked();
  }
}
