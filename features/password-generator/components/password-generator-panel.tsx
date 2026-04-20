"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCopy } from "@/features/vault/hooks/use-copy";
import {
  defaultPasswordGeneratorOptions,
  generatePassword,
  type PasswordGeneratorOptions,
} from "@/features/password-generator/lib/generator";
import { evaluateCredentialPasswordStrength } from "@/features/security-health/lib/password-strength";
import { PasswordStrengthPill } from "@/features/vault/components/password-strength-pill";

type PasswordGeneratorPanelProps = {
  onApply: (password: string) => void;
};

export function PasswordGeneratorPanel({ onApply }: PasswordGeneratorPanelProps) {
  const t = useTranslations();
  const copy = useCopy();

  const [options, setOptions] = useState<PasswordGeneratorOptions>(defaultPasswordGeneratorOptions);
  const [password, setPassword] = useState(() => generatePassword(defaultPasswordGeneratorOptions));

  const strength = useMemo(
    () => evaluateCredentialPasswordStrength(password),
    [password],
  );

  const regenerate = () => {
    setPassword(generatePassword(options));
  };

  useEffect(() => {
    setPassword(generatePassword(options));
  }, [options]);

  return (
    <Card className="premium-card">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          {t("vault.generator.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">{t("vault.generator.previewLabel")}</label>
          <div className="flex gap-2">
            <Input value={password} readOnly />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => copy(password, t("vault.toasts.passwordCopied"), t("vault.toasts.copyFailed"))}
              aria-label={t("vault.actions.copyGenerated")}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <PasswordStrengthPill strength={strength.label} label={t(`vault.strength.${strength.label}`)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("vault.generator.length")}</span>
            <span>{options.length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={options.length}
            onChange={(event) => setOptions((prev) => ({ ...prev, length: Number(event.target.value) }))}
            className="w-full accent-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <label className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-2.5 py-2">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={(event) => setOptions((prev) => ({ ...prev, uppercase: event.target.checked }))}
            />
            <span>{t("vault.generator.options.uppercase")}</span>
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-2.5 py-2">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={(event) => setOptions((prev) => ({ ...prev, numbers: event.target.checked }))}
            />
            <span>{t("vault.generator.options.numbers")}</span>
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-2.5 py-2">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={(event) => setOptions((prev) => ({ ...prev, symbols: event.target.checked }))}
            />
            <span>{t("vault.generator.options.symbols")}</span>
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-2.5 py-2">
            <input
              type="checkbox"
              checked={options.avoidAmbiguous}
              onChange={(event) => setOptions((prev) => ({ ...prev, avoidAmbiguous: event.target.checked }))}
            />
            <span>{t("vault.generator.options.avoidAmbiguous")}</span>
          </label>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={regenerate}>
            <RefreshCw className="size-4" />
            {t("vault.actions.regenerate")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(password);
            }}
          >
            {t("vault.actions.usePassword")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
