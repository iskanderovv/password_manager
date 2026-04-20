import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  action: string;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="premium-card">
      <CardContent className="py-10 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/60">
          <ShieldCheck className="size-6 text-primary" />
        </div>
        <Badge className="mb-3">{action}</Badge>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">
          <Button variant="secondary">{action}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
