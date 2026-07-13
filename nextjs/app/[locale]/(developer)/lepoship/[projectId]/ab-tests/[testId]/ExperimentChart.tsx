"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { time: string; variantA: number; variantB: number };

export function ExperimentChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">No exposure snapshots yet.</div>;
  }
  return (
    <div className="h-72 w-full" aria-label="Cumulative unique experiment exposures">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={28} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="variantA" name="Variant A" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="variantB" name="Variant B" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
