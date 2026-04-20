import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SettingsSectionCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function SettingsSectionCard({ title, description, children }: SettingsSectionCardProps) {
  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
