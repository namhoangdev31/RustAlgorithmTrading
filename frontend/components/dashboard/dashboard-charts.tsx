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

const overviewData = [
  { name: "Jan", total: 2200 },
  { name: "Feb", total: 3100 },
  { name: "Mar", total: 2800 },
  { name: "Apr", total: 4200 },
  { name: "May", total: 3600 },
  { name: "Jun", total: 5100 },
  { name: "Jul", total: 4600 },
  { name: "Aug", total: 3900 },
  { name: "Sep", total: 4800 },
  { name: "Oct", total: 5300 },
  { name: "Nov", total: 4900 },
  { name: "Dec", total: 6100 },
];

const analyticsData = [
  { name: "Mon", clicks: 640, uniques: 420 },
  { name: "Tue", clicks: 760, uniques: 510 },
  { name: "Wed", clicks: 590, uniques: 430 },
  { name: "Thu", clicks: 880, uniques: 690 },
  { name: "Fri", clicks: 720, uniques: 540 },
  { name: "Sat", clicks: 940, uniques: 710 },
  { name: "Sun", clicks: 810, uniques: 620 },
];

export function OverviewChart() {
  return (
    <ResponsiveContainer height={350} width="100%">
      <BarChart data={overviewData}>
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

export function AnalyticsChart() {
  return (
    <ResponsiveContainer height={300} width="100%">
      <AreaChart data={analyticsData}>
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
