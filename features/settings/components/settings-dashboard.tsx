"use client";

import { type CSSProperties, useEffect, useMemo, useState, useTransition } from "react";
import { Download, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { evaluateCredentialPasswordStrength } from "@/features/security-health/lib/password-strength";
import { decryptCredentialRecord } from "@/features/vault/lib/client-vault";
import { getActiveVaultKey, setActiveVaultKey } from "@/lib/crypto/key-store";
import { deriveKey, encrypt } from "@/lib/crypto/vault-crypto";
import { serializeEncryptedField } from "@/features/vault/lib/encrypted-field";
import { rotateMasterPasswordAction } from "@/features/settings/actions";
import { SettingsSectionCard } from "@/features/settings/components/settings-section-card";
import { useAppPreferences } from "@/features/preferences/hooks/use-app-preferences";
import type { AutoLockMode } from "@/features/preferences/lib/preferences-store";
import type { VaultOverviewPayload } from "@/features/vault/types";
import { downloadExportFile, buildCsvExport, buildJsonExport } from "@/features/export/lib/export-builder";
import { getLastUnlockedAt } from "@/lib/auth/vault-session";

type SettingsDashboardProps = {
  payload: VaultOverviewPayload;
  vaultMeta: {
    id: string;
    name: string;
    defaultAutoLockMinutes: number;
    requireUnlockForExport: boolean;
    hideSecretsByDefault: boolean;
    allowClipboardCopy: boolean;
    encryptionKeyVersion: number;
    keyDerivationIterations: number;
    updatedAt: Date | string;
  } | null;
};

type ExportKind = "json" | "csv";
type RangeStyle = CSSProperties & { "--range-progress": string };

const autoLockModes: AutoLockMode[] = ["5m", "15m", "30m", "on-close", "manual"];

function randomBase64(bytesLength: number) {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function SettingsDashboard({ payload, vaultMeta }: SettingsDashboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const { notify } = useToast();
  const { theme, setTheme } = useTheme();
  const { preferences, setPreferences } = useAppPreferences();

  const [isPending, startTransition] = useTransition();
  const [isExporting, startExporting] = useTransition();

  const [decryptedCredentials, setDecryptedCredentials] = useState<Awaited<ReturnType<typeof decryptCredentialRecord>>[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [masterPasswordError, setMasterPasswordError] = useState<string | null>(null);
  const [masterPasswordFieldErrors, setMasterPasswordFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportKind, setExportKind] = useState<ExportKind>("json");

  const lastUnlockedAt = getLastUnlockedAt();
  const nextPasswordStrength = evaluateCredentialPasswordStrength(newPassword);

  useEffect(() => {
    const keyState = getActiveVaultKey();

    if (!keyState) {
      return;
    }

    if (payload.vaultId && payload.vaultId !== keyState.vaultId) {
      router.replace("/lock");
      return;
    }

    let cancelled = false;

    void Promise.all(payload.credentials.map((record) => decryptCredentialRecord(record, keyState.key)))
      .then((records) => {
        if (cancelled) return;
        setDecryptedCredentials(records);
      })
      .catch(() => {
        if (cancelled) return;
        setDecryptedCredentials([]);
      });

    return () => {
      cancelled = true;
    };
  }, [payload.credentials, payload.vaultId, router]);

  const autoLockOptions = useMemo(
    () =>
      autoLockModes.map((mode) => ({
        value: mode,
        label: t(`settings.security.autoLock.options.${mode}`),
      })),
    [t],
  );
  const localeOptions = useMemo(
    () => [
      { value: "uz", label: t("locales.uz") },
      { value: "ru", label: t("locales.ru") },
      { value: "en", label: t("locales.en") },
    ],
    [t],
  );
  const themeOptions = useMemo(
    () => [
      { value: "light", label: t("common.light") },
      { value: "dark", label: t("common.dark") },
      { value: "system", label: t("common.system") },
    ],
    [t],
  );
  const defaultViewOptions = useMemo(
    () => [
      { value: "list", label: t("settings.preferences.defaultView.list") },
      { value: "compact", label: t("settings.preferences.defaultView.compact") },
    ],
    [t],
  );

  const onRotateMasterPassword = () => {
    setMasterPasswordError(null);
    setMasterPasswordFieldErrors({});

    const keyState = getActiveVaultKey();
    if (!keyState || !payload.vaultId) {
      setMasterPasswordError("vault.errors.unlockRequired");
      return;
    }

    if (!currentPassword) {
      setMasterPasswordError("settings.security.masterPassword.errors.currentRequired");
      return;
    }

    if (newPassword.length < 12) {
      setMasterPasswordError("lock.errors.passwordTooShort");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMasterPasswordError("lock.errors.confirmMismatch");
      return;
    }

    startTransition(() => {
      const newKeyDerivationSalt = randomBase64(16);
      const newKeyDerivationIterations = keyState.keyDerivationIterations;

      void deriveKey(newPassword, {
        keyDerivationSalt: newKeyDerivationSalt,
        keyDerivationIterations: newKeyDerivationIterations,
      })
        .then(async (derivedNewKey) => {
          const rotatedCredentials = await Promise.all(
            decryptedCredentials.map(async (record) => {
              const usernameEncrypted = serializeEncryptedField(await encrypt(record.username, derivedNewKey.key));
              const passwordEncrypted = serializeEncryptedField(await encrypt(record.password, derivedNewKey.key));
              const notesEncrypted = record.notes
                ? serializeEncryptedField(await encrypt(record.notes, derivedNewKey.key))
                : null;

              return {
                id: record.id,
                usernameEncrypted,
                passwordEncrypted,
                notesEncrypted,
              };
            }),
          );

          return {
            derivedNewKey,
            rotatedCredentials,
            newKeyDerivationSalt,
            newKeyDerivationIterations,
          };
        })
        .then(async ({ derivedNewKey, rotatedCredentials, newKeyDerivationSalt, newKeyDerivationIterations }) => {
          const result = await rotateMasterPasswordAction({
            currentPassword,
            newPassword,
            confirmPassword,
            newKeyDerivationSalt,
            newKeyDerivationIterations,
            rotatedCredentials,
          });

          if (!result.ok) {
            setMasterPasswordError(result.errorKey);
            setMasterPasswordFieldErrors(result.fieldErrors ?? {});
            notify({ message: t(result.errorKey), variant: "error" });
            return;
          }

          setActiveVaultKey({
            key: derivedNewKey.key,
            vaultId: result.vaultId,
            keyDerivationSalt: result.keyDerivationSalt,
            keyDerivationIterations: result.keyDerivationIterations,
            keyDerivationHash: result.keyDerivationHash,
            encryptionKeyVersion: result.encryptionKeyVersion,
          });

          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          notify({ message: t("settings.security.masterPassword.success"), variant: "success" });
        })
        .catch(() => {
          const errorKey = "settings.security.masterPassword.errors.unexpected";
          setMasterPasswordError(errorKey);
          notify({ message: t(errorKey), variant: "error" });
        });
    });
  };

  const onExport = (kind: ExportKind) => {
    if (!getActiveVaultKey()) {
      notify({ message: t("vault.errors.unlockRequired"), variant: "error" });
      return;
    }

    if (decryptedCredentials.length === 0) {
      notify({ message: t("settings.data.export.empty"), variant: "info" });
      return;
    }

    startExporting(() => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      if (kind === "json") {
        const content = buildJsonExport(decryptedCredentials);
        downloadExportFile(content, `cipherteams-vault-${timestamp}.json`, "application/json");
      } else {
        const content = buildCsvExport(decryptedCredentials);
        downloadExportFile(content, `cipherteams-vault-${timestamp}.csv`, "text/csv;charset=utf-8");
      }

      notify({
        message: t("settings.data.export.success"),
        variant: "success",
      });
      setExportDialogOpen(false);
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SettingsSectionCard
        title={t("settings.security.title")}
        description={t("settings.security.description")}
      >
        <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
          <h3 className="text-sm font-medium">{t("settings.security.masterPassword.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("settings.security.masterPassword.description")}</p>

          {masterPasswordError ? (
            <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-700 dark:text-rose-300">
              {t(masterPasswordError)}
            </p>
          ) : null}

          <label className="space-y-1.5 text-sm">
            <span>{t("settings.security.masterPassword.current")}</span>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <span>{t("settings.security.masterPassword.next")}</span>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
            {masterPasswordFieldErrors.password ? (
              <p className="text-xs text-rose-600">{t(masterPasswordFieldErrors.password)}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {t("settings.security.masterPassword.strength")}: {t(`vault.strength.${nextPasswordStrength.label}`)}
            </p>
          </label>

          <label className="space-y-1.5 text-sm">
            <span>{t("settings.security.masterPassword.confirm")}</span>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
            {masterPasswordFieldErrors.confirmPassword ? (
              <p className="text-xs text-rose-600">{t(masterPasswordFieldErrors.confirmPassword)}</p>
            ) : null}
          </label>

          <Button type="button" onClick={onRotateMasterPassword} disabled={isPending}>
            {isPending ? t("settings.security.masterPassword.submitting") : t("settings.security.masterPassword.submit")}
          </Button>
        </div>

        <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-4">
          <h3 className="text-sm font-medium">{t("settings.security.autoLock.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("settings.security.autoLock.description")}</p>
          <CustomSelect
            value={preferences.autoLockMode}
            onValueChange={(value) =>
              setPreferences((current) => ({
                ...current,
                autoLockMode: value as AutoLockMode,
              }))
            }
            ariaLabel={t("settings.security.autoLock.title")}
            options={autoLockOptions}
          />
        </div>

      </SettingsSectionCard>

      <SettingsSectionCard
        title={t("settings.preferences.title")}
        description={t("settings.preferences.description")}
      >
        <label className="space-y-1.5 text-sm">
          <span>{t("settings.preferences.language")}</span>
          <CustomSelect
            value={preferences.locale}
            onValueChange={(value) => {
              const nextLocale = value as "uz" | "ru" | "en";
              document.cookie = `pm-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
              setPreferences((current) => ({ ...current, locale: nextLocale }));
              router.refresh();
            }}
            ariaLabel={t("settings.preferences.language")}
            options={localeOptions}
          />
        </label>

        <label className="space-y-1.5 text-sm">
          <span>{t("settings.preferences.theme")}</span>
          <CustomSelect
            value={(theme ?? "system") as "light" | "dark" | "system"}
            onValueChange={(value) => {
              const nextTheme = value as "light" | "dark" | "system";
              setTheme(nextTheme);
              setPreferences((current) => ({ ...current, theme: nextTheme }));
            }}
            ariaLabel={t("settings.preferences.theme")}
            options={themeOptions}
          />
        </label>

        <label className="space-y-1.5 text-sm">
          <span>{t("settings.preferences.defaultView.title")}</span>
          <CustomSelect
            value={preferences.defaultVaultView}
            onValueChange={(value) =>
              setPreferences((current) => ({
                ...current,
                defaultVaultView: value as "list" | "compact",
              }))
            }
            ariaLabel={t("settings.preferences.defaultView.title")}
            options={defaultViewOptions}
          />
        </label>

        <div className="space-y-4 rounded-xl border border-border/70 bg-background/70 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">{t("settings.preferences.generator.title")}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">{t("settings.preferences.generator.length")}</span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary">{preferences.generator.length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              style={{ "--range-progress": `${((preferences.generator.length - 8) / (64 - 8)) * 100}%` } as RangeStyle}
              value={preferences.generator.length}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  generator: {
                    ...current.generator,
                    length: Number(event.target.value),
                  },
                }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-all hover:border-primary/30 hover:bg-background/80">
              <input
                type="checkbox"
                checked={preferences.generator.uppercase}
                aria-label={t("vault.generator.options.uppercase")}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    generator: {
                      ...current.generator,
                      uppercase: event.target.checked,
                    },
                  }))
                }
              />
              <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                {t("vault.generator.options.uppercase")}
              </span>
            </label>
            <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-all hover:border-primary/30 hover:bg-background/80">
              <input
                type="checkbox"
                checked={preferences.generator.numbers}
                aria-label={t("vault.generator.options.numbers")}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    generator: {
                      ...current.generator,
                      numbers: event.target.checked,
                    },
                  }))
                }
              />
              <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                {t("vault.generator.options.numbers")}
              </span>
            </label>
            <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-all hover:border-primary/30 hover:bg-background/80">
              <input
                type="checkbox"
                checked={preferences.generator.symbols}
                aria-label={t("vault.generator.options.symbols")}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    generator: {
                      ...current.generator,
                      symbols: event.target.checked,
                    },
                  }))
                }
              />
              <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                {t("vault.generator.options.symbols")}
              </span>
            </label>
            <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-all hover:border-primary/30 hover:bg-background/80">
              <input
                type="checkbox"
                checked={preferences.generator.avoidAmbiguous}
                aria-label={t("vault.generator.options.avoidAmbiguous")}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    generator: {
                      ...current.generator,
                      avoidAmbiguous: event.target.checked,
                    },
                  }))
                }
              />
              <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                {t("vault.generator.options.avoidAmbiguous")}
              </span>
            </label>
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title={t("settings.data.title")} description={t("settings.data.description")}>
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <p className="font-medium">{t("settings.data.export.warningTitle")}</p>
          <p className="mt-1 text-xs">{t("settings.data.export.warningDescription")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setExportKind("json");
              setExportDialogOpen(true);
            }}
          >
            <Download className="size-4" />
            {t("settings.data.export.json")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setExportKind("csv");
              setExportDialogOpen(true);
            }}
          >
            <Download className="size-4" />
            {t("settings.data.export.csv")}
          </Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title={t("settings.about.title")} description={t("settings.about.description")}>
        <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-4 text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span>{t("settings.about.cues.encrypted")}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-500" />
            <span>{t("settings.about.cues.autoLock", { mode: t(`settings.security.autoLock.options.${preferences.autoLockMode}`) })}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {lastUnlockedAt
              ? t("settings.about.cues.lastUnlocked", { value: new Date(lastUnlockedAt).toLocaleString() })
              : t("settings.about.cues.neverUnlocked")}
          </p>
          {vaultMeta ? (
            <p className="text-xs text-muted-foreground">
              {t("settings.about.vaultInfo", {
                name: vaultMeta.name,
                version: String(vaultMeta.encryptionKeyVersion),
              })}
            </p>
          ) : null}
        </div>
      </SettingsSectionCard>

      {exportDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="premium-card animate-scale-in w-full max-w-md rounded-2xl border border-border/80 bg-card p-6">
            <h3 className="text-lg font-semibold">{t("settings.data.export.confirmTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("settings.data.export.confirmDescription")}</p>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setExportDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={() => onExport(exportKind)} disabled={isExporting}>
                {isExporting ? t("settings.data.export.exporting") : t("settings.data.export.confirm")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
