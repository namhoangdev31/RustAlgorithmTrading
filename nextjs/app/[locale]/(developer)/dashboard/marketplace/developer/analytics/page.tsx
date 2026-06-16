import {
  Activity,
  ArrowUpRight,
  AlertTriangle,
  Download,
  Trash2,
  TrendingUp,
  Award,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { getInstallAnalytics, getTopPluginsByInstalls } from "@/lib/server/marketplace-analytics";

export default async function AnalyticsPage() {
  const user = await requireCurrentUser();

  // Find partner's bundle
  const collaborator = await prisma.bundleCollaborators.findFirst({
    where: { userId: user.id },
    select: {
      bundleId: true,
      bundle: { select: { id: true, name: true } },
    },
  });

  if (!collaborator || !collaborator.bundle) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Plugin Analytics" description="Usage and error statistics for your published plugins." />
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No Plugin Found</CardTitle>
            <CardDescription>
              You must register a plugin integration and belong to a project bundle before viewing analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const bundle = collaborator.bundle;
  const analytics = await getInstallAnalytics(bundle.id, 30);
  const topPlugins = await getTopPluginsByInstalls(5);

  // Parse SVG line chart path for installs
  const chartHeight = 150;
  const chartWidth = 600;
  const padding = 20;
  const usableWidth = chartWidth - padding * 2;
  const usableHeight = chartHeight - padding * 2;

  const points = analytics.dailyStats;
  const maxInstalls = Math.max(...points.map((p) => p.installs), 1);
  const pointsCount = points.length;

  // Build the path d-attribute
  let pathD = "";
  points.forEach((p, idx) => {
    const x = padding + (idx / (pointsCount - 1)) * usableWidth;
    const y = padding + usableHeight - (p.installs / maxInstalls) * usableHeight;
    if (idx === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={`${bundle.name} Analytics`}
        description="Monitor installation growth, active user retention, uninstalls, and debug plugin errors in real-time."
      />

      {/* Analytics Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Installs</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {analytics.activeInstalls.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently active integrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Installs</CardTitle>
            <Download className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalInstalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total downloads over 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Uninstall Rate (Churn)</CardTitle>
            <Trash2 className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{analytics.churnRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Ratio of uninstalls to installs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Exceptions & Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {analytics.errorCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Reported issues in production</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Install Growth (Last 30 Days)
            </CardTitle>
            <CardDescription>Daily installations for your plugin</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[200px]">
            {analytics.totalInstalls === 0 ? (
              <div className="text-sm text-muted-foreground">No installations recorded yet.</div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full max-h-[160px] overflow-visible">
                  {/* Grid lines */}
                  <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="currentColor" strokeOpacity="0.1" />
                  <line x1={padding} y1={padding + usableHeight / 2} x2={chartWidth - padding} y2={padding + usableHeight / 2} stroke="currentColor" strokeOpacity="0.1" />
                  <line x1={padding} y1={padding + usableHeight} x2={chartWidth - padding} y2={padding + usableHeight} stroke="currentColor" strokeOpacity="0.2" />

                  {/* SVG Path */}
                  <path d={pathD} fill="none" stroke="rgb(16 185 129)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Gradient Area below path */}
                  {pointsCount > 0 && (
                    <path
                      d={`${pathD} L ${padding + usableWidth} ${padding + usableHeight} L ${padding} ${padding + usableHeight} Z`}
                      fill="url(#chartGrad)"
                      opacity="0.15"
                    />
                  )}

                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(16 185 129)" />
                      <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Draw markers */}
                  {points.map((p, idx) => {
                    const x = padding + (idx / (pointsCount - 1)) * usableWidth;
                    const y = padding + usableHeight - (p.installs / maxInstalls) * usableHeight;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="rgb(16 185 129)"
                        stroke="white"
                        strokeWidth="1.5"
                        className="hover:r-6 cursor-pointer"
                      />
                    );
                  })}
                </svg>
                {/* Labels */}
                <div className="flex justify-between w-full px-5 text-xs text-muted-foreground mt-2">
                  <span>{points[0]?.date}</span>
                  <span>{points[Math.floor(pointsCount / 2)]?.date}</span>
                  <span>{points[pointsCount - 1]?.date}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Plugins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" /> Marketplace Ranking
            </CardTitle>
            <CardDescription>Top performing plugins this week</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {topPlugins.length === 0 ? (
              <div className="text-sm text-muted-foreground">No rankings available.</div>
            ) : (
              topPlugins.map((plugin, index) => (
                <div key={plugin.bundleId} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-muted-foreground text-sm w-4">#{index + 1}</span>
                    <span className="font-medium text-sm truncate max-w-[150px]">{plugin.name}</span>
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {plugin.installs} installs
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" /> Error Log Breakdown
          </CardTitle>
          <CardDescription>Most frequent exceptions and errors returned by your plugin runtime.</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.errorBreakdown.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No errors reported for this plugin in the current period. Great job!
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Error Message</th>
                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground w-[120px]">Occurrences</th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground w-[200px]">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.errorBreakdown.map((err, idx) => (
                    <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-mono text-xs text-red-600 dark:text-red-400 max-w-[400px] truncate">
                        {err.message}
                      </td>
                      <td className="p-4 align-middle text-center font-semibold">{err.count}</td>
                      <td className="p-4 align-middle text-right text-xs text-muted-foreground">
                        {new Date(err.lastSeen).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
