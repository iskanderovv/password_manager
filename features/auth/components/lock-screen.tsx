"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 lg:px-8">
      <div className="grid w-full gap-5 lg:grid-cols-[1.15fr,0.85fr]">
        <Card className="premium-card relative overflow-hidden border-border/80">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(21,94,239,0.16),transparent_55%),radial-gradient(circle_at_85%_10%,rgba(31,143,78,0.12),transparent_45%)]" />
          <CardContent className="relative flex h-full flex-col justify-between gap-6 p-7 lg:p-9">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{t("common.appName")}</Badge>
                <Badge variant="secondary">{t("common.appTagline")}</Badge>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                  {mode === "create" ? t("lock.create.title") : t("lock.unlock.title")}
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                  {mode === "create" ? t("lock.create.subtitle") : t("lock.unlock.subtitle")}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="glass-muted flex items-start gap-2 rounded-xl border border-border/70 p-3">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <p className="text-xs text-muted-foreground">{t("lock.trustItems.zeroKnowledge")}</p>
              </div>
              <div className="glass-muted flex items-start gap-2 rounded-xl border border-border/70 p-3">
                <Sparkles className="mt-0.5 size-4 text-primary" />
                <p className="text-xs text-muted-foreground">{t("lock.trustItems.audit")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card border-border/80 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl">
              {mode === "create" ? t("lock.create.cardTitle") : t("lock.unlock.cardTitle")}
            </CardTitle>
            <CardDescription>
              {mode === "create" ? t("lock.create.helper") : t("lock.unlock.helper")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentErrorKey ? (
              <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                {t(currentErrorKey)}
              </div>
            ) : null}

            {mode === "create" ? (
              <form action={createAction} className="space-y-4">
                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">{t("lock.masterPasswordLabel")}</span>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={t("lock.masterPasswordPlaceholder")}
                      value={createPassword}
                      onChange={(event) => {
                        setCreatePassword(event.target.value);
                        setClientErrorKey(null);
                      }}
                      className="pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted/60"
                      aria-label={showPassword ? t("lock.hidePassword") : t("lock.showPassword")}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {createState.fieldErrors?.password ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">{t(createState.fieldErrors.password)}</p>
                  ) : null}
                </label>

                <PasswordStrengthMeter strength={strength} />

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">{t("lock.confirmPasswordLabel")}</span>
                  <div className="relative">
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={t("lock.confirmPasswordPlaceholder")}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setClientErrorKey(null);
                      }}
                      className="pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted/60"
                      aria-label={showConfirmPassword ? t("lock.hidePassword") : t("lock.showPassword")}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {createState.fieldErrors?.confirmPassword ? (
                    <p className="text-xs text-rose-600 dark:text-rose-300">
                      {t(createState.fieldErrors.confirmPassword)}
                    </p>
                  ) : null}
                </label>

                <p className="text-xs text-muted-foreground">{t("lock.create.warning")}</p>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!createIsValid || createPending || isCompletingUnlock}
                >
                  {createPending || isCompletingUnlock ? t("lock.create.submitting") : t("lock.create.submit")}
                </Button>
              </form>
            ) : null}

            {mode !== "create" ? (
              <form action={unlockAction} className="space-y-4">
                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">{t("lock.masterPasswordLabel")}</span>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t("lock.masterPasswordPlaceholder")}
                      value={unlockPassword}
                      onChange={(event) => {
                        setUnlockPassword(event.target.value);
                        setClientErrorKey(null);
                      }}
                      className="pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted/60"
                      aria-label={showPassword ? t("lock.hidePassword") : t("lock.showPassword")}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!unlockIsValid || unlockPending || isCompletingUnlock}
                >
                  {unlockPending || isCompletingUnlock ? t("lock.unlock.submitting") : t("lock.unlock.submit")}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
