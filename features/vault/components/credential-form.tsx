"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { Eye, EyeOff, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { PasswordGeneratorPanel } from "@/features/password-generator/components/password-generator-panel";
import { generatePassword } from "@/features/password-generator/lib/generator";
import { useAppPreferences } from "@/features/preferences/hooks/use-app-preferences";
import { evaluateCredentialPasswordStrength } from "@/features/security-health/lib/password-strength";
import { createCredentialAction, deleteCredentialAction, updateCredentialAction } from "@/features/vault/actions";
import { PasswordStrengthPill } from "@/features/vault/components/password-strength-pill";
import { buildEncryptedCredentialInput, decryptCredentialRecord } from "@/features/vault/lib/client-vault";
import { normalizeCredentialTags, validateCredentialInput } from "@/features/vault/lib/validation";
import type { CredentialActionResult, VaultCredentialRecord } from "@/features/vault/types";
import { getActiveVaultKey } from "@/lib/crypto/key-store";

type CredentialFormProps = {
  mode: "create" | "edit";
  vaultId: string | null;
  availableTags: string[];
  credential?: VaultCredentialRecord | null;
};

type FormValues = {
  serviceName: string;
  serviceUrl: string;
  username: string;
  password: string;
  notes: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
};

function initialFormValues(): FormValues {
  return {
    serviceName: "",
    serviceUrl: "",
    username: "",
    password: "",
    notes: "",
    tags: [],
    isFavorite: false,
    isPinned: false,
  };
}

export function CredentialForm({ mode, vaultId, availableTags, credential }: CredentialFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { notify } = useToast();
  const { preferences, setPreferences } = useAppPreferences();

  const [isSubmitting, startSubmitting] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const [fieldErrors, setFieldErrors] = useState<CredentialActionResult["fieldErrors"]>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>(() => initialFormValues());
  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isDecrypting, setIsDecrypting] = useState(mode === "edit" && Boolean(credential));

  useEffect(() => {
    if (mode !== "edit" || !credential) {
      return;
    }

    let cancelled = false;
    const keyState = getActiveVaultKey();

    if (!keyState) {
      setFormError("vault.errors.unlockRequired");
      setIsDecrypting(false);
      return;
    }

    setIsDecrypting(true);
    void decryptCredentialRecord(credential, keyState.key)
      .then((decrypted) => {
        if (cancelled) return;

        setValues({
          serviceName: decrypted.serviceName,
          serviceUrl: decrypted.serviceUrl ?? "",
          username: decrypted.username,
          password: decrypted.password,
          notes: decrypted.notes,
          tags: decrypted.tags,
          isFavorite: decrypted.isFavorite,
          isPinned: decrypted.isPinned,
        });
        setIsDecrypting(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFormError("vault.errors.decryptFailed");
        setIsDecrypting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [credential, mode]);

  const strength = useMemo(
    () => evaluateCredentialPasswordStrength(values.password),
    [values.password],
  );

  const suggestedTags = useMemo(
    () => availableTags.filter((tag) => !values.tags.includes(tag)).slice(0, 8),
    [availableTags, values.tags],
  );

  const createdAtLabel = credential ? new Date(credential.createdAt).toLocaleString() : null;
  const updatedAtLabel = credential ? new Date(credential.updatedAt).toLocaleString() : null;

  const addTag = (rawTag: string) => {
    const candidate = rawTag.trim();
    if (!candidate) return;

    setValues((prev) => ({
      ...prev,
      tags: normalizeCredentialTags([...prev.tags, candidate]),
    }));
    setTagInput("");
  };

  const submit = () => {
    setFormError(null);
    setFieldErrors({});

    const localErrors = validateCredentialInput({
      serviceName: values.serviceName,
      username: values.username,
      password: values.password,
      tags: values.tags,
    });

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    const keyState = getActiveVaultKey();
    const activeVaultId = vaultId ?? keyState?.vaultId ?? null;

    if (!keyState || !activeVaultId) {
      setFormError("vault.errors.unlockRequired");
      return;
    }

    startSubmitting(() => {
      void buildEncryptedCredentialInput({
        key: keyState.key,
        vaultId: activeVaultId,
        credentialId: mode === "edit" ? credential?.id : undefined,
        serviceName: values.serviceName,
        serviceUrl: values.serviceUrl,
        username: values.username,
        password: values.password,
        notes: values.notes,
        tags: normalizeCredentialTags(values.tags),
        passwordStrengthScore: strength.score,
        isFavorite: values.isFavorite,
        isPinned: values.isPinned,
      })
        .then((encryptedInput) =>
          mode === "create" ? createCredentialAction(encryptedInput) : updateCredentialAction(encryptedInput),
        )
        .then((result) => {
          if (!result.ok) {
            setFieldErrors(result.fieldErrors ?? {});
            setFormError(result.errorKey);
            notify({ message: t(result.errorKey), variant: "error" });
            return;
          }

          notify({
            message: t(mode === "create" ? "vault.toasts.created" : "vault.toasts.updated"),
            variant: "success",
          });
          router.replace(mode === "create" ? "/vault" : `/vault/${result.credentialId}`);
        })
        .catch(() => {
          const errorKey = "vault.form.errors.unexpected";
          setFormError(errorKey);
          notify({ message: t(errorKey), variant: "error" });
        });
    });
  };

  const removeTag = (tag: string) => {
    setValues((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== tag),
    }));
  };

  const deleteCredential = () => {
    if (!credential || !vaultId) return;

    startDeleting(() => {
      void deleteCredentialAction({ credentialId: credential.id, vaultId })
        .then((ok) => {
          if (!ok) {
            notify({ message: t("vault.form.errors.deleteFailed"), variant: "error" });
            return;
          }

          notify({ message: t("vault.toasts.deleted"), variant: "success" });
          router.replace("/vault");
        })
        .catch(() => {
          notify({ message: t("vault.form.errors.deleteFailed"), variant: "error" });
        });
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  if (isDecrypting) {
    return (
      <Card className="premium-card">
        <CardContent className="py-8 text-sm text-muted-foreground">{t("vault.form.decrypting")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
      <Card className="premium-card">
        <CardHeader>
          <CardTitle>{t(mode === "create" ? "vault.form.createTitle" : "vault.form.editTitle")}</CardTitle>
          <CardDescription>{t("vault.form.helper")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
          {formError ? (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {t(formError)}
            </div>
          ) : null}

          <label className="space-y-2 text-sm">
            <span>{t("vault.form.fields.serviceName")}</span>
            <Input
              value={values.serviceName}
              onChange={(event) => setValues((prev) => ({ ...prev, serviceName: event.target.value }))}
              placeholder={t("vault.form.placeholders.serviceName")}
              autoFocus={mode === "create"}
            />
            {fieldErrors?.serviceName ? <p className="text-xs text-rose-600">{t(fieldErrors.serviceName)}</p> : null}
          </label>

          <label className="space-y-2 text-sm">
            <span>{t("vault.form.fields.url")}</span>
            <Input
              value={values.serviceUrl}
              onChange={(event) => setValues((prev) => ({ ...prev, serviceUrl: event.target.value }))}
              placeholder={t("vault.form.placeholders.url")}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>{t("vault.form.fields.username")}</span>
              <Input
                value={values.username}
                onChange={(event) => setValues((prev) => ({ ...prev, username: event.target.value }))}
                placeholder={t("vault.form.placeholders.username")}
                autoComplete="off"
              />
              {fieldErrors?.username ? <p className="text-xs text-rose-600">{t(fieldErrors.username)}</p> : null}
            </label>

            <label className="space-y-2 text-sm">
              <span>{t("vault.form.fields.password")}</span>
              <div className="relative">
                <Input
                  value={values.password}
                  onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder={t("vault.form.placeholders.password")}
                  autoComplete="off"
                  type={showPassword ? "text" : "password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted/60"
                  aria-label={showPassword ? t("lock.hidePassword") : t("lock.showPassword")}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValues((prev) => ({ ...prev, password: generatePassword(preferences.generator) }))}
                >
                  {t("vault.actions.regenerate")}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <PasswordStrengthPill strength={strength.label} label={t(`vault.strength.${strength.label}`)} />
                <span className="text-xs text-muted-foreground">{t("vault.form.passwordHelper")}</span>
              </div>
              {fieldErrors?.password ? <p className="text-xs text-rose-600">{t(fieldErrors.password)}</p> : null}
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-sm">{t("vault.form.fields.tags")}</span>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder={t("vault.form.placeholders.tags")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addTag(tagInput);
                  }
                }}
                list="vault-tag-suggestions"
              />
              <Button type="button" variant="secondary" onClick={() => addTag(tagInput)}>
                {t("vault.actions.addTag")}
              </Button>
            </div>
            <datalist id="vault-tag-suggestions">
              {availableTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-2">
              {values.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  #{tag} ×
                </button>
              ))}
            </div>
            {suggestedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            ) : null}
            {fieldErrors?.tags ? <p className="text-xs text-rose-600">{t(fieldErrors.tags)}</p> : null}
          </div>

          <label className="space-y-2 text-sm">
            <span>{t("vault.form.fields.notes")}</span>
            <Textarea
              value={values.notes}
              onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder={t("vault.form.placeholders.notes")}
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={values.isFavorite}
                onChange={(event) => setValues((prev) => ({ ...prev, isFavorite: event.target.checked }))}
              />
              <span>{t("vault.form.fields.favorite")}</span>
            </label>
            <label className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={values.isPinned}
                onChange={(event) => setValues((prev) => ({ ...prev, isPinned: event.target.checked }))}
              />
              <span>{t("vault.form.fields.pinned")}</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("vault.form.submitting") : t("vault.form.save")}
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link href="/vault">{t("common.cancel")}</Link>
            </Button>
            {mode === "edit" ? (
              <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="size-4" />
                {t("vault.actions.delete")}
              </Button>
            ) : null}
          </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <PasswordGeneratorPanel
          initialOptions={preferences.generator}
          onOptionsChange={(nextOptions) =>
            setPreferences((current) => ({
              ...current,
              generator: nextOptions,
            }))
          }
          onApply={(password) => {
            setValues((prev) => ({ ...prev, password }));
            notify({ message: t("vault.toasts.generatedApplied"), variant: "success" });
          }}
        />

        {mode === "edit" && credential ? (
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>{t("vault.form.metadataTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {t("vault.form.createdAt")}: <span className="text-foreground">{createdAtLabel}</span>
              </p>
              <p className="text-muted-foreground">
                {t("vault.form.updatedAt")}: <span className="text-foreground">{updatedAtLabel}</span>
              </p>
              {!values.serviceUrl ? (
                <div className="mt-2 rounded-xl border border-amber-500/35 bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300">
                  <p className="flex items-center gap-1 text-xs">
                    <ShieldAlert className="size-3.5" />
                    {t("vault.warnings.missingUrl")}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {showDeleteConfirm && mode === "edit" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="premium-card w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("vault.deleteConfirm.title")}</CardTitle>
              <CardDescription>{t("vault.deleteConfirm.description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={deleteCredential} disabled={isDeleting}>
                {isDeleting ? t("vault.deleteConfirm.deleting") : t("vault.deleteConfirm.confirm")}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
