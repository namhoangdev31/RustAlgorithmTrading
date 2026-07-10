import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Column<T> = {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
};

type ResourceTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
};

export function ResourceTable({
  data,
  columns,
  onRowClick,
  className,
}: ResourceTableProps<any>) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground border border-hairline rounded-md bg-card">
        No records found.
      </div>
    );
  }

  return (
    <div className={cn("border border-hairline rounded-md bg-card overflow-hidden shadow-light", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-hairline">
              {columns.map((col, idx) => (
                <TableHead key={idx} className={cn("text-[10px] font-mono font-semibold uppercase tracking-wider py-3 h-auto text-muted-foreground", col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, rowIdx) => (
              <TableRow
                key={rowIdx}
                className={cn(
                  "hover:bg-secondary/30 transition-colors border-b border-hairline last:border-0",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((col, colIdx) => (
                  <TableCell key={colIdx} className={cn("text-xs text-foreground py-3.5", col.className)}>
                    {col.accessor(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
