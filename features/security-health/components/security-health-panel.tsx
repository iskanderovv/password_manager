"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { analyzeSecurityHealth } from "@/features/security-health/lib/insights";
import { decryptCredentialRecord } from "@/features/vault/lib/client-vault";
import type { VaultOverviewPayload } from "@/features/vault/types";
import { getActiveVaultKey } from "@/lib/crypto/key-store";

type SecurityHealthPanelProps = {
  payload: VaultOverviewPayload;
};

export function SecurityHealthPanel({ payload }: SecurityHealthPanelProps) {
  const t = useTranslations();
  const router = useRouter();
  const [decryptedCredentials, setDecryptedCredentials] = useState<Awaited<ReturnType<typeof decryptCredentialRecord>>[]>([]);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof analyzeSecurityHealth>> | null>(null);

  useEffect(() => {
    const keyState = getActiveVaultKey();

    if (!keyState) {
      setDecryptError("vault.errors.unlockRequired");
      setDecryptedCredentials([]);
      setHealth(null);
      return;
    }

    if (payload.vaultId && payload.vaultId !== keyState.vaultId) {
      router.replace("/lock");
      return;
    }

    let cancelled = false;
    setDecryptError(null);

    void Promise.all(payload.credentials.map((record) => decryptCredentialRecord(record, keyState.key)))
      .then((records) => {
        if (cancelled) return;
        setDecryptedCredentials(records);
      })
      .catch(() => {
        if (cancelled) return;
        setDecryptError("vault.errors.decryptFailed");
      });

    return () => {
      cancelled = true;
    };
  }, [payload.credentials, payload.vaultId, router]);

  useEffect(() => {
    let cancelled = false;

    void analyzeSecurityHealth(decryptedCredentials)
      .then((result) => {
        if (cancelled) return;
        setHealth(result);
      })
      .catch(() => {
        if (cancelled) return;
        setHealth(null);
      });

    return () => {
      cancelled = true;
    };
  }, [decryptedCredentials]);

  const issueLinks = useMemo(
    () => [
      {
        type: "reused",
        label: t("settings.security.health.issues.reused"),
        description: t("settings.security.health.issuesDescriptions.reused"),
        count: health?.reusedCount ?? 0,
        tone: "danger" as const,
      },
      {
        type: "weak",
        label: t("settings.security.health.issues.weak"),
        description: t("settings.security.health.issuesDescriptions.weak"),
        count: health?.weakCount ?? 0,
        tone: "danger" as const,
      },
      {
        type: "stale",
        label: t("settings.security.health.issues.stale"),
        description: t("settings.security.health.issuesDescriptions.stale"),
        count: health?.staleCount ?? 0,
        tone: "warning" as const,
      },
      {
        type: "missing-url",
        label: t("settings.security.health.issues.missingUrl"),
        description: t("settings.security.health.issuesDescriptions.missingUrl"),
        count: health?.missingUrlCount ?? 0,
        tone: "info" as const,
      },
      {
        type: "missing-notes",
        label: t("settings.security.health.issues.missingNotes"),
        description: t("settings.security.health.issuesDescriptions.missingNotes"),
        count: health?.missingNotesCount ?? 0,
        tone: "info" as const,
      },
    ],
    [health, t],
  );

  return (
    <section className="premium-card space-y-3 rounded-2xl border border-border/70 bg-card/90 p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t("settings.security.health.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("settings.security.health.description")}</p>
      </div>

      {decryptError ? <p className="text-xs text-amber-700 dark:text-amber-300">{t(decryptError)}</p> : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("settings.security.health.metrics.total")}</p>
          <p className="text-xl font-semibold">{health?.totalCredentials ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("settings.security.health.metrics.reused")}</p>
          <p className="text-xl font-semibold">{health?.reusedCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("settings.security.health.metrics.weak")}</p>
          <p className="text-xl font-semibold">{health?.weakCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("settings.security.health.metrics.stale")}</p>
          <p className="text-xl font-semibold">{health?.staleCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("settings.security.health.metrics.missingUrl")}</p>
          <p className="text-xl font-semibold">{health?.missingUrlCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("settings.security.health.metrics.missingNotes")}</p>
          <p className="text-xl font-semibold">{health?.missingNotesCount ?? 0}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {issueLinks.map((issue) => (
          <div
            key={issue.type}
            className={`rounded-lg border px-2.5 py-2 ${
              issue.tone === "danger"
                ? "border-rose-500/30 bg-rose-500/5"
                : issue.tone === "warning"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-sky-500/25 bg-sky-500/5"
            }`}
          >
            <p className="text-sm font-medium">{issue.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{issue.description}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{issue.count}</span>
              {issue.count > 0 ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/vault?issue=${issue.type}`}>{t("settings.security.health.viewAffected")}</Link>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">{t("settings.security.health.issuesClear")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
