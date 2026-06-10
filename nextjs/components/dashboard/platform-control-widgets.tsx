import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold">{value}</span>
        </div>
        <Icon className="text-primary" />
      </CardContent>
    </Card>
  );
}

export function ActivityTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-b px-3 py-2 text-sm font-medium">{title}</div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row, index) => (
              <TableRow key={`${title}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={`${title}-${index}-${cellIndex}`}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                No records yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
