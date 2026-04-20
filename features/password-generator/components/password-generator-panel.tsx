"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, RefreshCw, Sparkles } from "lucide-react";
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
  initialOptions?: PasswordGeneratorOptions;
  onOptionsChange?: (nextOptions: PasswordGeneratorOptions) => void;
};

export function PasswordGeneratorPanel({ onApply, initialOptions, onOptionsChange }: PasswordGeneratorPanelProps) {
  const t = useTranslations();
  const copy = useCopy();

  const [options, setOptions] = useState<PasswordGeneratorOptions>(initialOptions ?? defaultPasswordGeneratorOptions);
  const [password, setPassword] = useState(() => generatePassword(initialOptions ?? defaultPasswordGeneratorOptions));
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (!initialOptions) return;
    setOptions(initialOptions);
  }, [initialOptions]);

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
              onClick={async () => {
                const ok = await copy(password, t("vault.toasts.passwordCopied"), t("vault.toasts.copyFailed"));
                if (!ok) return;
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1400);
              }}
              aria-label={t("vault.actions.copyGenerated")}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <PasswordStrengthPill strength={strength.label} label={t(`vault.strength.${strength.label}`)} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            <span>{t("vault.generator.length")}</span>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary">{options.length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={options.length}
            style={{ "--range-progress": `${((options.length - 8) / (64 - 8)) * 100}%` } as any}
            onChange={(event) =>
              setOptions((prev) => {
                const next = { ...prev, length: Number(event.target.value) };
                onOptionsChange?.(next);
                return next;
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3 transition-all hover:border-primary/30 hover:bg-background/60">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={(event) =>
                setOptions((prev) => {
                  const next = { ...prev, uppercase: event.target.checked };
                  onOptionsChange?.(next);
                  return next;
                })
              }
            />
            <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
              {t("vault.generator.options.uppercase")}
            </span>
          </label>
          <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3 transition-all hover:border-primary/30 hover:bg-background/60">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={(event) =>
                setOptions((prev) => {
                  const next = { ...prev, numbers: event.target.checked };
                  onOptionsChange?.(next);
                  return next;
                })
              }
            />
            <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
              {t("vault.generator.options.numbers")}
            </span>
          </label>
          <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3 transition-all hover:border-primary/30 hover:bg-background/60">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={(event) =>
                setOptions((prev) => {
                  const next = { ...prev, symbols: event.target.checked };
                  onOptionsChange?.(next);
                  return next;
                })
              }
            />
            <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
              {t("vault.generator.options.symbols")}
            </span>
          </label>
          <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3 transition-all hover:border-primary/30 hover:bg-background/60">
            <input
              type="checkbox"
              checked={options.avoidAmbiguous}
              onChange={(event) =>
                setOptions((prev) => {
                  const next = { ...prev, avoidAmbiguous: event.target.checked };
                  onOptionsChange?.(next);
                  return next;
                })
              }
            />
            <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
              {t("vault.generator.options.avoidAmbiguous")}
            </span>
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
