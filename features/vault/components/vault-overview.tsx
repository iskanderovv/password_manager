"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, Copy, Eye, EyeOff, Fingerprint, List, Pencil, Plus, Rows3, ShieldAlert, ShieldCheck, Sparkles, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useAppPreferences } from "@/features/preferences/hooks/use-app-preferences";
import { createCredentialAction, deleteCredentialAction, toggleFavoriteAction } from "@/features/vault/actions";
import { evaluateCredentialPasswordStrength } from "@/features/security-health/lib/password-strength";
import { PasswordStrengthPill } from "@/features/vault/components/password-strength-pill";
import {
  buildEncryptedCredentialInput,
  decryptCredentialRecord,
  filterAndSortCredentials,
  getDomain,
  type VaultFilterState,
} from "@/features/vault/lib/client-vault";
import { buildReuseMap } from "@/features/security-health/lib/reuse-detection";
import { useCopy } from "@/features/vault/hooks/use-copy";
import type { DecryptedVaultCredential, VaultOverviewPayload } from "@/features/vault/types";
import { getActiveVaultKey } from "@/lib/crypto/key-store";
import { cn } from "@/lib/utils";

type VaultOverviewProps = {
  payload: VaultOverviewPayload;
  initialFilters?: Partial<VaultFilterState>;
};

type CopiedField = "username" | "password";

const demoCredentials = [
  {
    serviceName: "Google Workspace",
    serviceUrl: "https://admin.google.com",
    username: "it.admin@acme-team.io",
    password: "TeamVault!2025",
    notes: "Primary workspace admin account.",
    tags: ["IT", "Demo"],
  },
  {
    serviceName: "Figma",
    serviceUrl: "https://www.figma.com",
    username: "design.lead@acme-team.io",
    password: "design123",
    notes: "Shared product design seat.",
    tags: ["Design", "Demo"],
  },
  {
    serviceName: "AWS Console",
    serviceUrl: "https://console.aws.amazon.com",
    username: "cloud.ops@acme-team.io",
    password: "CloudOps!9",
    notes: "Ops account with billing + infra access.",
    tags: ["DevOps", "Demo"],
  },
  {
    serviceName: "Notion",
    serviceUrl: "",
    username: "ops.docs@acme-team.io",
    password: "KnowledgeBase77",
    notes: "",
    tags: ["Operations", "Demo"],
  },
  {
    serviceName: "Slack",
    serviceUrl: "https://acme-team.slack.com",
    username: "workspace.owner@acme-team.io",
    password: "design123",
    notes: "Reused password intentionally for demo risk signal.",
    tags: ["Comms", "Demo"],
  },
  {
    serviceName: "CRM System",
    serviceUrl: "https://crm.acme-team.io",
    username: "sales.ops@acme-team.io",
    password: "crm2024",
    notes: "",
    tags: ["Sales", "Demo"],
  },
] as const;

export function VaultOverview({ payload, initialFilters }: VaultOverviewProps) {
  const t = useTranslations();
  const router = useRouter();
  const copy = useCopy();
  const { notify } = useToast();
  const { preferences, setPreferences } = useAppPreferences();

  const [isPending, startTransition] = useTransition();
  const [credentials, setCredentials] = useState<DecryptedVaultCredential[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [reusedById, setReusedById] = useState<Map<string, boolean>>(new Map());
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedTarget, setCopiedTarget] = useState<{ credentialId: string; field: CopiedField } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DecryptedVaultCredential | null>(null);
  const [isLoadingDemoData, startLoadingDemoData] = useTransition();

  const revealTimeoutsRef = useRef<Record<string, number>>({});
  const copyTimeoutRef = useRef<number | null>(null);

  const [filters, setFilters] = useState<VaultFilterState>({
    query: "",
    tag: "all",
    strength: "all",
    reusedOnly: false,
    favoritesOnly: false,
    issue: "all",
    sort: "recent",
    ...initialFilters,
  });

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      query: initialFilters?.query ?? "",
      issue: initialFilters?.issue ?? "all",
      strength: initialFilters?.strength ?? "all",
      reusedOnly: initialFilters?.reusedOnly ?? false,
    }));
  }, [initialFilters?.query, initialFilters?.issue, initialFilters?.strength, initialFilters?.reusedOnly]);

  useEffect(() => {
    const keyState = getActiveVaultKey();
    if (!keyState) {
      router.replace("/lock");
      return;
    }

    if (payload.vaultId && payload.vaultId !== keyState.vaultId) {
      router.replace("/lock");
      return;
    }

    let cancelled = false;
    setIsDecrypting(true);
    setDecryptError(null);

    void Promise.all(payload.credentials.map((record) => decryptCredentialRecord(record, keyState.key)))
      .then((records) => {
        if (cancelled) return;
        setCredentials(records);
        setIsDecrypting(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDecryptError("vault.errors.decryptFailed");
        setIsDecrypting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [payload.credentials, payload.vaultId, router]);

  useEffect(() => {
    let cancelled = false;

    void buildReuseMap(credentials)
      .then((result) => {
        if (cancelled) return;
        setReusedById(result.reusedById);
      })
      .catch(() => {
        if (cancelled) return;
        setReusedById(new Map());
      });

    return () => {
      cancelled = true;
    };
  }, [credentials]);

  useEffect(() => {
    return () => {
      Object.values(revealTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const filteredCredentials = useMemo(
    () => filterAndSortCredentials(credentials, filters, reusedById),
    [credentials, filters, reusedById],
  );

  const tagOptions = useMemo(
    () => ["all", ...payload.availableTags],
    [payload.availableTags],
  );
  const tagSelectOptions = useMemo(
    () =>
      tagOptions.map((tag) => ({
        value: tag,
        label: tag === "all" ? t("vault.filters.allTags") : tag,
      })),
    [tagOptions, t],
  );
  const strengthOptions = useMemo(
    () => [
      { value: "all", label: t("vault.filters.allStrength") },
      { value: "weak", label: t("vault.strength.weak") },
      { value: "fair", label: t("vault.strength.fair") },
      { value: "strong", label: t("vault.strength.strong") },
    ],
    [t],
  );
  const sortOptions = useMemo(
    () => [
      { value: "recent", label: t("vault.sort.recent") },
      { value: "alphabetical", label: t("vault.sort.alphabetical") },
      { value: "weakest", label: t("vault.sort.weakest") },
    ],
    [t],
  );
  const issueOptions = useMemo(
    () => [
      { value: "all", label: t("vault.filters.allIssues") },
      { value: "reused", label: t("vault.insights.reused") },
      { value: "weak", label: t("vault.insights.weak") },
      { value: "stale", label: t("vault.insights.stale") },
      { value: "missing-url", label: t("vault.insights.missingUrl") },
      { value: "missing-notes", label: t("settings.security.health.metrics.missingNotes") },
    ],
    [t],
  );

  const toggleReveal = (credentialId: string) => {
    setRevealedIds((prev) => {
      const currentlyRevealed = Boolean(prev[credentialId]);

      if (currentlyRevealed) {
        const timeoutId = revealTimeoutsRef.current[credentialId];
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          delete revealTimeoutsRef.current[credentialId];
        }

        return { ...prev, [credentialId]: false };
      }

      const timeoutId = window.setTimeout(() => {
        setRevealedIds((current) => ({ ...current, [credentialId]: false }));
        delete revealTimeoutsRef.current[credentialId];
      }, 10000);
      revealTimeoutsRef.current[credentialId] = timeoutId;

      return { ...prev, [credentialId]: true };
    });
  };

  const markCopied = (credentialId: string, field: CopiedField) => {
    setCopiedTarget({ credentialId, field });

    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = window.setTimeout(() => {
      setCopiedTarget(null);
    }, 1600);
  };

  const onCopyUsername = async (credential: DecryptedVaultCredential) => {
    const copied = await copy(credential.username, t("vault.toasts.usernameCopied"), t("vault.toasts.copyFailed"));
    if (copied) {
      markCopied(credential.id, "username");
    }
  };

  const onCopyPassword = async (credential: DecryptedVaultCredential) => {
    const copied = await copy(credential.password, t("vault.toasts.passwordCopied"), t("vault.toasts.copyFailed"));
    if (copied) {
      markCopied(credential.id, "password");
    }
  };

  const onToggleFavorite = async (credential: DecryptedVaultCredential) => {
    if (!payload.vaultId) return;

    const newFavoriteState = !credential.isFavorite;

    // Optimistic update
    setCredentials((prev) =>
      prev.map((item) =>
        item.id === credential.id ? { ...item, isFavorite: newFavoriteState } : item,
      ),
    );

    try {
      const ok = await toggleFavoriteAction({
        credentialId: credential.id,
        vaultId: payload.vaultId,
        isFavorite: newFavoriteState,
      });

      if (!ok) throw new Error();

      notify({
        message: newFavoriteState ? t("vault.toasts.addedToFavorites") : t("vault.toasts.removedFromFavorites"),
        variant: "success",
      });
    } catch {
      // Revert on error
      setCredentials((prev) =>
        prev.map((item) =>
          item.id === credential.id ? { ...item, isFavorite: !newFavoriteState } : item,
        ),
      );
      notify({ message: t("vault.form.errors.unexpected"), variant: "error" });
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget || !payload.vaultId) return;
    const activeVaultId = payload.vaultId;

    startTransition(() => {
      void deleteCredentialAction({
        credentialId: deleteTarget.id,
        vaultId: activeVaultId,
      }).then((ok) => {
        if (!ok) {
          notify({ message: t("vault.form.errors.deleteFailed"), variant: "error" });
          return;
        }

        setCredentials((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        notify({ message: t("vault.toasts.deleted"), variant: "success" });
      });
    });
  };

  const onLoadDemoData = () => {
    const keyState = getActiveVaultKey();

    if (!payload.vaultId || !keyState) {
      notify({ message: t("vault.errors.unlockRequired"), variant: "error" });
      return;
    }

    startLoadingDemoData(async () => {
      try {
        for (const item of demoCredentials) {
          const encryptedInput = await buildEncryptedCredentialInput({
            vaultId: payload.vaultId!,
            serviceName: item.serviceName,
            serviceUrl: item.serviceUrl,
            username: item.username,
            password: item.password,
            notes: item.notes,
            tags: [...item.tags],
            passwordStrengthScore: evaluateCredentialPasswordStrength(item.password).score,
            isFavorite: false,
            isPinned: false,
            key: keyState.key,
          });

          const result = await createCredentialAction(encryptedInput);
          if (!result.ok) {
            throw new Error("Failed to create demo credential");
          }
        }

        notify({ message: t("vault.demo.loaded"), variant: "success" });
        router.refresh();
      } catch (error) {
        notify({ message: t("vault.demo.loadFailed"), variant: "error" });
      }
    });
  };

  if (isDecrypting) {
    return (
      <div className="space-y-3">
        <Card className="premium-card">
          <CardContent className="py-8 text-sm text-muted-foreground">{t("vault.list.decrypting")}</CardContent>
        </Card>
        <Card className="premium-card animate-pulse">
          <CardContent className="h-24" />
        </Card>
        <Card className="premium-card animate-pulse">
          <CardContent className="h-24" />
        </Card>
      </div>
    );
  }

  if (decryptError) {
    return (
      <Card className="premium-card border-rose-500/35">
        <CardContent className="py-8 text-sm text-rose-700 dark:text-rose-300">{t(decryptError)}</CardContent>
      </Card>
    );
  }

  const isCompact = preferences.defaultVaultView === "compact";

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{t("vault.title")}</h1>
          <p className="text-sm text-muted-foreground lg:text-base">{t("vault.subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/vault/new">
            <Plus className="size-4" />
            {t("vault.addCredential")}
          </Link>
        </Button>
      </header>

      <section className="grid gap-3 rounded-2xl border border-border/60 bg-card/40 p-3 shadow-sm xl:grid-cols-[2fr,1fr,1fr,1fr]">
        <div className="relative group">
          <Input
            value={filters.query}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            placeholder={t("vault.searchPlaceholder")}
            aria-label={t("topbar.quickSearch")}
            className="pl-10 transition-all focus:bg-background"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>

        <CustomSelect
          value={filters.tag}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, tag: value }))}
          options={tagSelectOptions}
          ariaLabel={t("vault.filters.allTags")}
        />

        <CustomSelect
          value={filters.strength}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              strength: value as VaultFilterState["strength"],
            }))
          }
          options={strengthOptions}
          ariaLabel={t("vault.filters.allStrength")}
        />

        <CustomSelect
          value={filters.sort}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              sort: value as VaultFilterState["sort"],
            }))
          }
          options={sortOptions}
          ariaLabel={t("vault.sort.recent")}
        />

        <CustomSelect
          value={filters.issue}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              issue: value as VaultFilterState["issue"],
            }))
          }
          options={issueOptions}
          ariaLabel={t("vault.filters.allIssues")}
        />

        <label className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/80 bg-background/50 px-3 py-2 transition-all hover:bg-background hover:border-primary/30">
          <input
            type="checkbox"
            checked={filters.reusedOnly}
            onChange={(event) => setFilters((prev) => ({ ...prev, reusedOnly: event.target.checked }))}
            aria-label={t("vault.filters.reusedOnly")}
          />
          <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {t("vault.filters.reusedOnly")}
          </span>
        </label>
        <label className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/80 bg-background/50 px-3 py-2 transition-all hover:bg-background hover:border-primary/30">
          <input
            type="checkbox"
            checked={filters.favoritesOnly}
            onChange={(event) => setFilters((prev) => ({ ...prev, favoritesOnly: event.target.checked }))}
            aria-label={t("vault.filters.favoritesOnly")}
          />
          <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {t("vault.filters.favoritesOnly")}
          </span>
        </label>
        <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-background/50 p-1">
          <button
            type="button"
            onClick={() =>
              setPreferences((current) => ({
                ...current,
                defaultVaultView: "list",
              }))
            }
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all",
              !isCompact ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/50"
            )}
            aria-label={t("settings.preferences.defaultView.list")}
          >
            <List className="size-3.5" />
            {t("settings.preferences.defaultView.list")}
          </button>
          <button
            type="button"
            onClick={() =>
              setPreferences((current) => ({
                ...current,
                defaultVaultView: "compact",
              }))
            }
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all",
              isCompact ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/50"
            )}
            aria-label={t("settings.preferences.defaultView.compact")}
          >
            <Rows3 className="size-3.5" />
            {t("settings.preferences.defaultView.compact")}
          </button>
        </div>
      </section>

      {credentials.length === 0 ? (
        <Card className="premium-card overflow-hidden">
          <CardContent className="relative space-y-6 py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(21,94,239,0.12),transparent_46%)]" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-background/85">
                <Sparkles className="size-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">{t("vault.empty.title")}</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("vault.empty.description")}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Button asChild>
                  <Link href="/vault/new">{t("vault.empty.primaryCta")}</Link>
                </Button>
                <Button type="button" variant="secondary" onClick={onLoadDemoData} disabled={isLoadingDemoData}>
                  {isLoadingDemoData ? t("vault.demo.loading") : t("vault.demo.load")}
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{t("vault.empty.secondaryHint")}</p>
              <div className="mt-3 grid gap-2 text-left text-xs text-muted-foreground sm:grid-cols-2">
                <p className="rounded-lg border border-border/70 bg-background/70 px-2.5 py-2">{t("vault.empty.tipGenerator")}</p>
                <p className="rounded-lg border border-border/70 bg-background/70 px-2.5 py-2">{t("vault.empty.tipTags")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCredentials.map((credential) => {
            const isReused = reusedById.get(credential.id) === true;
            const isRevealed = Boolean(revealedIds[credential.id]);
            const isCopiedCredential = copiedTarget?.credentialId === credential.id;
            const isUsernameCopied = isCopiedCredential && copiedTarget?.field === "username";
            const isPasswordCopied = isCopiedCredential && copiedTarget?.field === "password";
            const domain = getDomain(credential.serviceUrl);

            return (
              <Card 
                key={credential.id} 
                className={cn(
                  "premium-card transition-all duration-200 hover:border-primary/30 group",
                  isCompact ? "min-h-[56px]" : "min-h-[100px]"
                )}
              >
                <CardContent
                  className={cn(
                    "flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between",
                    isCompact ? "py-2" : "py-5"
                  )}
                >
                  <div className="min-w-0 flex-1 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(credential)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                      aria-label={t("vault.actions.favorite")}
                    >
                      <Star className={cn("size-4 transition-all", credential.isFavorite ? "fill-amber-400 text-amber-400 scale-110" : "opacity-30 group-hover:opacity-60")} />
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("truncate font-bold text-foreground/90", isCompact ? "text-sm" : "text-base")} title={credential.serviceName}>
                          {credential.serviceName}
                        </p>
                        {credential.isPinned ? (
                          <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {t("vault.badges.pinned")}
                          </span>
                        ) : null}
                        {isCopiedCredential ? (
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {t("vault.badges.copied")}
                          </span>
                        ) : null}
                      </div>

                      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground", isCompact ? "text-[11px]" : "text-sm")}>
                        <span className="max-w-[220px] truncate" title={credential.username}>
                          {credential.username}
                        </span>
                        {domain && !isCompact ? (
                          <span className="max-w-[180px] truncate" title={domain}>
                            • {domain}
                          </span>
                        ) : null}
                        {!isCompact && <span>• {t("vault.list.updatedAt", { date: new Date(credential.updatedAt).toLocaleDateString() })}</span>}
                      </div>

                      {!isCompact && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {credential.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <PasswordStrengthPill strength={credential.strength} label={t(`vault.strength.${credential.strength}`)} />
                      {isReused && !isCompact ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          <ShieldAlert className="size-3" />
                          {t("vault.warnings.reusedPassword")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button type="button" variant="secondary" size={isCompact ? "icon" : "sm"} className={isCompact ? "size-8" : ""} onClick={() => onCopyUsername(credential)} title={t("vault.actions.copyUsername")}>
                        {isUsernameCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        {!isCompact && t("vault.actions.copyUsername")}
                      </Button>
                      <Button type="button" variant="secondary" size={isCompact ? "icon" : "sm"} className={isCompact ? "size-8" : ""} onClick={() => onCopyPassword(credential)} title={t("vault.actions.copyPassword")}>
                        {isPasswordCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        {!isCompact && t("vault.actions.copyPassword")}
                      </Button>
                      {!isCompact && (
                        <Button type="button" variant="outline" size="sm" onClick={() => toggleReveal(credential.id)}>
                          {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          {isRevealed ? t("vault.actions.hide") : t("vault.actions.reveal")}
                        </Button>
                      )}
                      <Button asChild type="button" variant="outline" size={isCompact ? "icon" : "sm"} className={isCompact ? "size-8" : ""}>
                        <Link href={`/vault/${credential.id}`} title={t("vault.actions.edit")}>
                          <Pencil className="size-3.5" />
                          {!isCompact && t("vault.actions.edit")}
                        </Link>
                      </Button>
                      <Button type="button" variant="outline" size={isCompact ? "icon" : "sm"} className={cn(isCompact ? "size-8" : "", "text-rose-500 hover:bg-rose-500/10 hover:text-rose-600")} onClick={() => setDeleteTarget(credential)} title={t("vault.actions.delete")}>
                        <Trash2 className="size-3.5" />
                        {!isCompact && t("vault.actions.delete")}
                      </Button>
                    </div>
                    {isRevealed && !isCompact ? (
                      <div className="animate-fade-in-up max-w-[140px] truncate rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs font-mono">
                        {credential.password}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredCredentials.length === 0 ? (
            <Card className="premium-card">
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground">
                <p>{t("vault.list.noMatches")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      query: "",
                      tag: "all",
                      strength: "all",
                      reusedOnly: false,
                      favoritesOnly: false,
                      issue: "all",
                      sort: "recent",
                    })
                  }
                >
                  {t("vault.list.clearFilters")}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t("vault.insights.title")}</CardTitle>
          <CardDescription className="text-xs">{t("vault.insights.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-background/40 p-4 text-sm transition-all hover:border-primary/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("vault.insights.reused")}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{payload.credentials.filter(c => reusedById.get(c.id)).length}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/40 p-4 text-sm transition-all hover:border-primary/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("vault.insights.weak")}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{payload.credentials.filter(c => c.passwordStrengthScore && c.passwordStrengthScore < 3).length}</p>
          </div>
        </CardContent>
      </Card>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="premium-card w-full max-w-md shadow-2xl">
            <CardHeader className="animate-scale-in">
              <CardTitle className="text-xl text-rose-600 dark:text-rose-400">{t("vault.deleteConfirm.title")}</CardTitle>
              <CardDescription className="text-sm font-medium">{t("vault.deleteConfirm.description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" variant="critical" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={confirmDelete} disabled={isPending}>
                {isPending ? t("vault.deleteConfirm.deleting") : t("vault.deleteConfirm.confirm")}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
