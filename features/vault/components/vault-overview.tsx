"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Copy, Eye, EyeOff, Pencil, Plus, ShieldAlert, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { deleteCredentialAction, toggleFavoriteCredentialAction } from "@/features/vault/actions";
import { PasswordStrengthPill } from "@/features/vault/components/password-strength-pill";
import {
  decryptCredentialRecord,
  filterAndSortCredentials,
  getDomain,
  type VaultFilterState,
} from "@/features/vault/lib/client-vault";
import { buildReuseMap } from "@/features/security-health/lib/reuse-detection";
import { useCopy } from "@/features/vault/hooks/use-copy";
import type { DecryptedVaultCredential, VaultOverviewPayload } from "@/features/vault/types";
import { getActiveVaultKey } from "@/lib/crypto/key-store";

type VaultOverviewProps = {
  payload: VaultOverviewPayload;
};

export function VaultOverview({ payload }: VaultOverviewProps) {
  const t = useTranslations();
  const router = useRouter();
  const copy = useCopy();
  const { notify } = useToast();

  const [isPending, startTransition] = useTransition();
  const [credentials, setCredentials] = useState<DecryptedVaultCredential[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [reusedById, setReusedById] = useState<Map<string, boolean>>(new Map());
  const [reusedCount, setReusedCount] = useState(0);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DecryptedVaultCredential | null>(null);

  const revealTimeoutsRef = useRef<Record<string, number>>({});
  const copyTimeoutRef = useRef<number | null>(null);

  const [filters, setFilters] = useState<VaultFilterState>({
    query: "",
    tag: "all",
    strength: "all",
    reusedOnly: false,
    favoritesOnly: false,
    sort: "recent",
  });

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
        setReusedCount(result.reusedCount);
      })
      .catch(() => {
        if (cancelled) return;
        setReusedById(new Map());
        setReusedCount(0);
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

  const weakCount = useMemo(
    () => credentials.filter((item) => item.strength === "weak").length,
    [credentials],
  );

  const favoritesCount = useMemo(
    () => credentials.filter((item) => item.isFavorite).length,
    [credentials],
  );

  const tagOptions = useMemo(
    () => ["all", ...payload.availableTags],
    [payload.availableTags],
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

  const markCopied = (credentialId: string) => {
    setCopiedId(credentialId);

    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = window.setTimeout(() => {
      setCopiedId(null);
    }, 1600);
  };

  const onCopyUsername = async (credential: DecryptedVaultCredential) => {
    const copied = await copy(credential.username, t("vault.toasts.usernameCopied"), t("vault.toasts.copyFailed"));
    if (copied) {
      markCopied(credential.id);
    }
  };

  const onCopyPassword = async (credential: DecryptedVaultCredential) => {
    const copied = await copy(credential.password, t("vault.toasts.passwordCopied"), t("vault.toasts.copyFailed"));
    if (copied) {
      markCopied(credential.id);
    }
  };

  const onToggleFavorite = (credential: DecryptedVaultCredential) => {
    if (!payload.vaultId) return;

    startTransition(() => {
      void toggleFavoriteCredentialAction({
        credentialId: credential.id,
        vaultId: payload.vaultId,
        isFavorite: !credential.isFavorite,
      }).then((ok) => {
        if (!ok) {
          notify({ message: t("vault.form.errors.unexpected"), variant: "error" });
          return;
        }

        setCredentials((prev) =>
          prev.map((item) =>
            item.id === credential.id
              ? {
                  ...item,
                  isFavorite: !item.isFavorite,
                }
              : item,
          ),
        );
      });
    });
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

  if (isDecrypting) {
    return (
      <Card className="premium-card">
        <CardContent className="py-8 text-sm text-muted-foreground">{t("vault.list.decrypting")}</CardContent>
      </Card>
    );
  }

  if (decryptError) {
    return (
      <Card className="premium-card border-rose-500/35">
        <CardContent className="py-8 text-sm text-rose-700 dark:text-rose-300">{t(decryptError)}</CardContent>
      </Card>
    );
  }

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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="premium-card">
          <CardContent className="space-y-1 py-4">
            <p className="text-xs text-muted-foreground">{t("vault.metrics.totalCredentials")}</p>
            <p className="text-2xl font-semibold">{credentials.length}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="space-y-1 py-4">
            <p className="text-xs text-muted-foreground">{t("vault.metrics.reusedCount")}</p>
            <p className="text-2xl font-semibold">{reusedCount}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="space-y-1 py-4">
            <p className="text-xs text-muted-foreground">{t("vault.metrics.weakCount")}</p>
            <p className="text-2xl font-semibold">{weakCount}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="space-y-1 py-4">
            <p className="text-xs text-muted-foreground">{t("vault.metrics.favoriteCount")}</p>
            <p className="text-2xl font-semibold">{favoritesCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 rounded-2xl border border-border/70 bg-card/70 p-3 xl:grid-cols-[2fr,1fr,1fr,1fr]">
        <Input
          value={filters.query}
          onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
          placeholder={t("vault.searchPlaceholder")}
        />

        <select
          className="h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-none"
          value={filters.tag}
          onChange={(event) => setFilters((prev) => ({ ...prev, tag: event.target.value }))}
        >
          {tagOptions.map((tag) => (
            <option key={tag} value={tag}>
              {tag === "all" ? t("vault.filters.allTags") : tag}
            </option>
          ))}
        </select>

        <select
          className="h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-none"
          value={filters.strength}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              strength: event.target.value as VaultFilterState["strength"],
            }))
          }
        >
          <option value="all">{t("vault.filters.allStrength")}</option>
          <option value="weak">{t("vault.strength.weak")}</option>
          <option value="fair">{t("vault.strength.fair")}</option>
          <option value="strong">{t("vault.strength.strong")}</option>
        </select>

        <select
          className="h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-none"
          value={filters.sort}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              sort: event.target.value as VaultFilterState["sort"],
            }))
          }
        >
          <option value="recent">{t("vault.sort.recent")}</option>
          <option value="alphabetical">{t("vault.sort.alphabetical")}</option>
          <option value="weakest">{t("vault.sort.weakest")}</option>
        </select>

        <label className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.reusedOnly}
            onChange={(event) => setFilters((prev) => ({ ...prev, reusedOnly: event.target.checked }))}
          />
          {t("vault.filters.reusedOnly")}
        </label>
        <label className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.favoritesOnly}
            onChange={(event) => setFilters((prev) => ({ ...prev, favoritesOnly: event.target.checked }))}
          />
          {t("vault.filters.favoritesOnly")}
        </label>
      </section>

      {credentials.length === 0 ? (
        <EmptyState
          title={t("vault.empty.title")}
          description={t("vault.empty.description")}
          action={t("vault.addCredential")}
          actionHref="/vault/new"
        />
      ) : (
        <div className="space-y-3">
          {filteredCredentials.map((credential) => {
            const isReused = reusedById.get(credential.id) === true;
            const isRevealed = Boolean(revealedIds[credential.id]);
            const domain = getDomain(credential.serviceUrl);

            return (
              <Card key={credential.id} className="premium-card">
                <CardContent className="flex flex-col gap-3 py-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(credential)}
                        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                        aria-label={t("vault.actions.favorite")}
                        disabled={isPending}
                      >
                        <Star className={`size-4 ${credential.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                      <p className="truncate font-medium">{credential.serviceName}</p>
                      {credential.isPinned ? (
                        <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                          {t("vault.badges.pinned")}
                        </span>
                      ) : null}
                      {copiedId === credential.id ? (
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                          {t("vault.badges.copied")}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{credential.username}</span>
                      {domain ? <span>• {domain}</span> : null}
                      <span>• {t("vault.list.updatedAt", { date: new Date(credential.updatedAt).toLocaleDateString() })}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {credential.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <PasswordStrengthPill strength={credential.strength} label={t(`vault.strength.${credential.strength}`)} />
                      {isReused ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                          <ShieldAlert className="size-3.5" />
                          {t("vault.warnings.reusedPassword")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => onCopyUsername(credential)}>
                        <Copy className="size-4" />
                        {t("vault.actions.copyUsername")}
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => onCopyPassword(credential)}>
                        <Copy className="size-4" />
                        {t("vault.actions.copyPassword")}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleReveal(credential.id)}>
                        {isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {isRevealed ? t("vault.actions.hide") : t("vault.actions.reveal")}
                      </Button>
                      <Button asChild type="button" variant="outline" size="sm">
                        <Link href={`/vault/${credential.id}`}>
                          <Pencil className="size-4" />
                          {t("vault.actions.edit")}
                        </Link>
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(credential)}>
                        <Trash2 className="size-4" />
                        {t("vault.actions.delete")}
                      </Button>
                    </div>
                    {isRevealed ? (
                      <div className="max-w-xs truncate rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs font-medium">
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
              <CardContent className="py-8 text-sm text-muted-foreground">{t("vault.list.noMatches")}</CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <Card className="premium-card">
        <CardHeader>
          <CardTitle>{t("vault.insights.title")}</CardTitle>
          <CardDescription>{t("vault.insights.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-background/70 p-3 text-sm">
            <p className="text-muted-foreground">{t("vault.insights.reused")}</p>
            <p className="mt-1 text-lg font-semibold">{reusedCount}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 p-3 text-sm">
            <p className="text-muted-foreground">{t("vault.insights.weak")}</p>
            <p className="mt-1 text-lg font-semibold">{weakCount}</p>
          </div>
        </CardContent>
      </Card>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="premium-card w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("vault.deleteConfirm.title")}</CardTitle>
              <CardDescription>{t("vault.deleteConfirm.description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={confirmDelete} disabled={isPending}>
                {isPending ? t("vault.deleteConfirm.deleting") : t("vault.deleteConfirm.confirm")}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
