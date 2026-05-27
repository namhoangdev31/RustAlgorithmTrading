"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type OverviewPoint = {
  name: string;
  total: number;
};

type AnalyticsPoint = {
  name: string;
  clicks: number;
  uniques: number;
};

export function OverviewChart({ data }: { data: OverviewPoint[] }) {
  return (
    <ResponsiveContainer height={350} width="100%">
      <BarChart data={data}>
        <XAxis
          axisLine={false}
          dataKey="name"
          fontSize={12}
          stroke="#888888"
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          fontSize={12}
          stroke="#888888"
          tickFormatter={(value) => `$${value}`}
          tickLine={false}
        />
        <Bar
          className="fill-primary"
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsChart({ data }: { data: AnalyticsPoint[] }) {
  return (
    <ResponsiveContainer height={300} width="100%">
      <AreaChart data={data}>
        <XAxis
          axisLine={false}
          dataKey="name"
          fontSize={12}
          stroke="#888888"
          tickLine={false}
        />
        <YAxis axisLine={false} fontSize={12} stroke="#888888" tickLine={false} />
        <Area
          className="text-primary"
          dataKey="clicks"
          fill="currentColor"
          fillOpacity={0.15}
          stroke="currentColor"
          type="monotone"
        />
        <Area
          className="text-muted-foreground"
          dataKey="uniques"
          fill="currentColor"
          fillOpacity={0.1}
          stroke="currentColor"
          type="monotone"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
