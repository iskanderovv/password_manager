import type { PasswordGeneratorOptions } from "@/features/password-generator/lib/generator";

export type AutoLockMode = "5m" | "15m" | "30m" | "on-close" | "manual";
export type VaultViewMode = "list" | "compact";

export type AppPreferences = {
  locale: "uz" | "ru" | "en";
  theme: "light" | "dark" | "system";
  autoLockMode: AutoLockMode;
  defaultVaultView: VaultViewMode;
  generator: PasswordGeneratorOptions;
};

export const APP_PREFERENCES_STORAGE_KEY = "cipherteams.preferences";

export const defaultAppPreferences: AppPreferences = {
  locale: "uz",
  theme: "system",
  autoLockMode: "15m",
  defaultVaultView: "list",
  generator: {
    length: 18,
    uppercase: true,
    numbers: true,
    symbols: true,
    avoidAmbiguous: true,
  },
};

export function getAutoLockDelayMs(mode: AutoLockMode) {
  if (mode === "5m") return 5 * 60 * 1000;
  if (mode === "15m") return 15 * 60 * 1000;
  if (mode === "30m") return 30 * 60 * 1000;
  return null;
}

function hasWindow() {
  return typeof window !== "undefined";
}

function coercePreferences(value: Partial<AppPreferences> | null | undefined): AppPreferences {
  return {
    locale:
      value?.locale === "uz" || value?.locale === "ru" || value?.locale === "en"
        ? value.locale
        : defaultAppPreferences.locale,
    theme:
      value?.theme === "light" || value?.theme === "dark" || value?.theme === "system"
        ? value.theme
        : defaultAppPreferences.theme,
    autoLockMode:
      value?.autoLockMode === "5m" ||
      value?.autoLockMode === "15m" ||
      value?.autoLockMode === "30m" ||
      value?.autoLockMode === "on-close" ||
      value?.autoLockMode === "manual"
        ? value.autoLockMode
        : defaultAppPreferences.autoLockMode,
    defaultVaultView:
      value?.defaultVaultView === "list" || value?.defaultVaultView === "compact"
        ? value.defaultVaultView
        : defaultAppPreferences.defaultVaultView,
    generator: {
      length:
        typeof value?.generator?.length === "number"
          ? Math.max(8, Math.min(64, value.generator.length))
          : defaultAppPreferences.generator.length,
      uppercase:
        typeof value?.generator?.uppercase === "boolean"
          ? value.generator.uppercase
          : defaultAppPreferences.generator.uppercase,
      numbers:
        typeof value?.generator?.numbers === "boolean"
          ? value.generator.numbers
          : defaultAppPreferences.generator.numbers,
      symbols:
        typeof value?.generator?.symbols === "boolean"
          ? value.generator.symbols
          : defaultAppPreferences.generator.symbols,
      avoidAmbiguous:
        typeof value?.generator?.avoidAmbiguous === "boolean"
          ? value.generator.avoidAmbiguous
          : defaultAppPreferences.generator.avoidAmbiguous,
    },
  };
}

export function readAppPreferences(): AppPreferences {
  if (!hasWindow()) return defaultAppPreferences;

  const raw = window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY);
  if (!raw) return defaultAppPreferences;

  try {
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return coercePreferences(parsed);
  } catch {
    return defaultAppPreferences;
  }
}

export function writeAppPreferences(nextPreferences: AppPreferences) {
  if (!hasWindow()) return;
  window.localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(nextPreferences));
}
