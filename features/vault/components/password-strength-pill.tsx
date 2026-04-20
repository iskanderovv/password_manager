import { Badge } from "@/components/ui/badge";
import type { CredentialStrength } from "@/features/vault/types";

type PasswordStrengthPillProps = {
  strength: CredentialStrength;
  label: string;
};

export function PasswordStrengthPill({ strength, label }: PasswordStrengthPillProps) {
  if (strength === "strong") {
    return <Badge variant="success">{label}</Badge>;
  }

  if (strength === "fair") {
    return <Badge variant="warning">{label}</Badge>;
  }

  return <Badge variant="critical">{label}</Badge>;
}
