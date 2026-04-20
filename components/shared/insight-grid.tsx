import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsightBlueprint } from "@/types/domain";

type InsightGridProps = {
  title: string;
  subtitle: string;
  items: Array<InsightBlueprint & { label: string }>;
};

export function InsightGrid({ title, subtitle, items }: InsightGridProps) {
  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-xl border border-border/70 bg-background/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <Badge
                variant={
                  item.severity === "critical" ? "critical" : item.severity === "warning" ? "warning" : "success"
                }
              >
                {item.value}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
