import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SettingsCardProps = {
  title: string;
  items: string[];
  badgeLabel: string;
};

export function SettingsCard({ title, items, badgeLabel }: SettingsCardProps) {
  return (
    <Card className="premium-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Badge variant="secondary">{badgeLabel}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-3 py-2">
            <span className="text-sm">{item}</span>
            <span className="text-xs text-muted-foreground">-</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
