import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  title: string;
  value: string;
  delta: string;
};

export function MetricCard({ title, value, delta }: MetricCardProps) {
  return (
    <Card className="premium-card">
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-end justify-between gap-2">
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          <Badge variant="secondary">{delta}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
