import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
};

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardDescription>{title}</CardDescription>
        <Icon className="text-muted-foreground" data-icon="inline-start" />
      </CardHeader>
      <CardContent>
        <CardTitle className="text-2xl">{value}</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

