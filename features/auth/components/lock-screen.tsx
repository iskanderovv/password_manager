"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, Fingerprint, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { createMasterPasswordAction, unlockVaultAction } from "@/features/auth/actions";
import { initialLockActionState } from "@/features/auth/action-state";
import { useVaultSession } from "@/hooks/use-vault-session";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import { clearVaultUnlocked, isVaultUnlocked } from "@/lib/auth/vault-session";
import { deriveKey } from "@/lib/crypto/vault-crypto";
import { clearActiveVaultKey, getActiveVaultKey, setActiveVaultKey } from "@/lib/crypto/key-store";

import { PasswordStrengthMeter } from "./password-strength";

type LockScreenProps = {
  hasVault: boolean;
};

export function LockScreen({ hasVault }: LockScreenProps) {
  const t = useTranslations();
  const router = useRouter();
  const { unlock } = useVaultSession();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createPassword, setCreatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [isCompletingUnlock, setIsCompletingUnlock] = useState(false);
  const [clientErrorKey, setClientErrorKey] = useState<string | null>(null);

  const [createState, createAction, createPending] = useActionState(
    createMasterPasswordAction,
    initialLockActionState,
  );
  const [unlockState, unlockAction, unlockPending] = useActionState(
    unlockVaultAction,
    initialLockActionState,
  );

  const mode = hasVault ? "unlock" : "create";
  const strength = useMemo(() => evaluatePasswordStrength(createPassword), [createPassword]);
  const createIsValid =
    strength.score >= 3 &&
    createPassword.length > 0 &&
    confirmPassword.length > 0 &&
    createPassword === confirmPassword;
  const unlockIsValid = unlockPassword.length > 0;

  useEffect(() => {
    const unlocked = isVaultUnlocked();
    const keyState = getActiveVaultKey();

    if (unlocked && keyState) {
      router.replace("/vault");
      return;
    }

    if (unlocked && !keyState) {
      clearVaultUnlocked();
    }

    clearActiveVaultKey();
  }, [router]);

  useEffect(() => {
    async function completeUnlock(
      password: string,
      unlockPayload:
        | {
            vaultId: string;
            keyDerivationSalt: string;
            keyDerivationIterations: number;
            keyDerivationHash: string;
            encryptionKeyVersion: number;
          }
        | undefined,
    ) {
      if (!unlockPayload || !password || isCompletingUnlock) {
        return;
      }

      setIsCompletingUnlock(true);
      setClientErrorKey(null);

      try {
        const derived = await deriveKey(password, {
          keyDerivationSalt: unlockPayload.keyDerivationSalt,
          keyDerivationIterations: unlockPayload.keyDerivationIterations,
        });

        setActiveVaultKey({
          key: derived.key,
          vaultId: unlockPayload.vaultId,
          keyDerivationSalt: unlockPayload.keyDerivationSalt,
          keyDerivationIterations: unlockPayload.keyDerivationIterations,
          keyDerivationHash: unlockPayload.keyDerivationHash,
          encryptionKeyVersion: unlockPayload.encryptionKeyVersion,
        });

        unlock();
        setCreatePassword("");
        setConfirmPassword("");
        setUnlockPassword("");
        router.replace("/vault");
      } catch {
        setClientErrorKey("lock.errors.unexpected");
      } finally {
        setIsCompletingUnlock(false);
      }
    }

    if (createState.status === "success") {
      void completeUnlock(createPassword, createState.unlock);
    }
    if (unlockState.status === "success") {
      void completeUnlock(unlockPassword, unlockState.unlock);
    }
  }, [createPassword, createState, isCompletingUnlock, router, unlock, unlockPassword, unlockState]);

  const currentErrorKey = clientErrorKey ?? (mode === "create" ? createState.errorKey : unlockState.errorKey);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background Ornaments */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[160px]" />
      </div>

      <div className="z-10 w-full max-w-[440px] space-y-8">
        {/* Header/Branding */}
        <div className="flex flex-col items-center space-y-3 text-center animate-fade-in-up">
          <div className="relative mb-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 shadow-inner">
            <div className="absolute inset-0 rounded-3xl border border-primary/20" />
            {mode === "unlock" ? (
              <LockKeyhole className="h-10 w-10 text-primary drop-shadow-sm" />
            ) : (
              <ShieldCheck className="h-10 w-10 text-primary drop-shadow-sm" />
            )}
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-background bg-emerald-500 text-white shadow-lg">
              <Fingerprint className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              CREDX<span className="text-primary">VAULT</span>
            </h1>
          </div>
        </div>

        {/* Action Card */}
        <Card className="animate-scale-in overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-xl">
              {mode === "create" ? t("lock.create.title") : t("lock.unlock.title")}
            </CardTitle>
            <CardDescription>
              {mode === "create" ? t("lock.create.description") : t("lock.unlock.description")}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-2">
            {currentErrorKey ? (
              <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400 animate-fade-in-up">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{t(currentErrorKey)}</p>
              </div>
            ) : null}

            {mode === "create" ? (
              <form action={createAction} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80" htmlFor="password">
                    {t("lock.masterPasswordLabel")}
                  </label>
                  <div className="relative group">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={t("lock.masterPasswordPlaceholder")}
                      value={createPassword}
                      onChange={(event) => {
                        setCreatePassword(event.target.value);
                        setClientErrorKey(null);
                      }}
                      className="h-12 rounded-xl bg-background/50 pr-11 transition-all focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted"
                      aria-label={showPassword ? t("lock.hidePassword") : t("lock.showPassword")}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {createState.fieldErrors?.password ? (
                    <p className="text-xs font-medium text-rose-500">{t(createState.fieldErrors.password)}</p>
                  ) : null}
                </div>

                <PasswordStrengthMeter strength={strength} />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80" htmlFor="confirmPassword">
                    {t("lock.confirmPasswordLabel")}
                  </label>
                  <div className="relative group">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={t("lock.confirmPasswordPlaceholder")}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setClientErrorKey(null);
                      }}
                      className="h-12 rounded-xl bg-background/50 pr-11 transition-all focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted"
                      aria-label={showConfirmPassword ? t("lock.hidePassword") : t("lock.showPassword")}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {createState.fieldErrors?.confirmPassword ? (
                    <p className="text-xs font-medium text-rose-500">{t(createState.fieldErrors.confirmPassword)}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[13px] text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <p className="leading-tight">{t("lock.create.warning")}</p>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-primary text-sm font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={!createIsValid || createPending || isCompletingUnlock}
                >
                  {createPending || isCompletingUnlock ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t("lock.create.submitting")}
                    </span>
                  ) : (
                    t("lock.create.submit")
                  )}
                </Button>
              </form>
            ) : (
              <form action={unlockAction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80" htmlFor="unlockPassword">
                    {t("lock.masterPasswordLabel")}
                  </label>
                  <div className="relative group">
                    <Input
                      id="unlockPassword"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t("lock.masterPasswordPlaceholder")}
                      value={unlockPassword}
                      onChange={(event) => {
                        setUnlockPassword(event.target.value);
                        setClientErrorKey(null);
                      }}
                      className="h-12 rounded-xl bg-background/50 pr-11 transition-all focus:ring-primary/20"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted"
                      aria-label={showPassword ? t("lock.hidePassword") : t("lock.showPassword")}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-primary text-sm font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={!unlockIsValid || unlockPending || isCompletingUnlock}
                >
                  {unlockPending || isCompletingUnlock ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t("lock.unlock.submitting")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LockKeyhole className="h-4 w-4" />
                      {t("lock.unlock.submit")}
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-2 animate-fade-in-up delay-150">
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
