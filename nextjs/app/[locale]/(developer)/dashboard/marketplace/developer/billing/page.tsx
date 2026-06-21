import {
  CreditCard,
  DollarSign,
  TrendingUp,
  History,
  CheckCircle,
  AlertCircle,
  Building,
  Package2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";
import { onboardPartnerAction, getPartnerBillingDashboardData } from "@/app/actions/marketplace-billing";

export default async function BillingPage() {
  const user = await requireCurrentUser();

  // Find first active organization/workspace for the user
  let organization = await prisma.organization.findFirst({
    where: { userId: user.id },
    select: { id: true, name: true },
  });

  // If no organization exists, fetch from bundle Collaborators
  if (!organization) {
    const collaborator = await prisma.bundleCollaborators.findFirst({
      where: { userId: user.id },
      include: {
        bundle: {
          include: {
            project: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });
    if (collaborator?.bundle?.project?.organization) {
      organization = collaborator.bundle.project.organization;
    }
  }

  if (!organization) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Partner Payouts & Billing" description="Manage your Stripe Connect integration and revenue share payouts." />
        <Card className="border-destructive/35 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Active Organization Required
            </CardTitle>
            <CardDescription>
              You must be a member of an active workspace organization to configure billing.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Load Stripe Connect and billing statistics
  const data = await getPartnerBillingDashboardData(organization.id);
  const installMetrics = data.installMetrics || { installs: 0, uninstalls: 0, errors: 0 };

  // Calculate stats
  const totalGross = data.transactions.reduce((acc, t) => acc + (t.status === "completed" ? t.amount : 0), 0);
  const totalNet = data.transactions.reduce((acc, t) => acc + (t.status === "completed" ? t.partnerPayout : 0), 0);
  const platformFee = data.transactions.reduce((acc, t) => acc + (t.status === "completed" ? t.platformFee : 0), 0);

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Partner Payouts & Billing"
        description={`Manage revenue share payouts, balances, and connected Stripe accounts for ${organization.name}.`}
      />

      {!data.connected ? (
        /* Setup Stripe Connect Express */
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CreditCard className="h-5 w-5" /> Start Collecting Plugin Revenue
            </CardTitle>
            <CardDescription className="text-emerald-700/80 dark:text-emerald-400/80">
              Integrate with Stripe Connect Express to charge for paid plugins. LepoS splits revenue automatically: 70% to you, 30% platform fee. Payouts are made directly to your bank account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={onboardPartnerAction} className="flex items-center gap-4">
              <input type="hidden" name="organizationId" value={organization.id} />
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2">
                <Building className="h-4 w-4" /> Link Stripe Connected Account
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Dashboard Connected view */
        <>
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h4 className="font-semibold text-emerald-950 dark:text-emerald-100">Stripe Connect Account Active</h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 font-mono">
                  ID: {data.partnerAccount?.stripeAccountId}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-emerald-200 text-emerald-800 border-emerald-300">
              Onboarding Complete
            </Badge>
          </div>

          {/* Revenue Overview Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatVnd(data.balance.available[0]?.amount || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ready for automatic payout</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatVnd(data.balance.pending[0]?.amount || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-sans">Clearing through bank pipeline</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Net Payouts (70%)</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatVnd(totalNet)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total revenue paid out to partner</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Platform Fees (30%)</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{formatVnd(platformFee)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total platform commission share</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Installs</CardTitle>
                <Package2 className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{installMetrics.installs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {installMetrics.uninstalls} uninstall events, {installMetrics.errors} error events
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Transaction Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" /> Sales Transactions
                </CardTitle>
                <CardDescription>Recently recorded marketplace plugin purchases.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.transactions.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No transactions recorded yet.
                  </div>
                ) : (
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Buyer ID</th>
                          <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Amount</th>
                          <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Payout (70%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map((tr) => (
                          <tr key={tr.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle font-mono text-xs truncate max-w-[120px]">{tr.buyerUserId}</td>
                            <td className="p-4 align-middle text-center text-xs font-semibold">{formatVnd(tr.amount)}</td>
                            <td className="p-4 align-middle text-right text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatVnd(tr.partnerPayout)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payout Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" /> Payout History
                </CardTitle>
                <CardDescription>Clearing events from Stripe to your bank account.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.payouts.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No payouts initiated yet.
                  </div>
                ) : (
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Bank Target</th>
                          <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Amount</th>
                          <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.payouts.map((po) => (
                          <tr key={po.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle text-xs max-w-[150px] truncate" title={po.bankName}>
                              {po.bankName}
                            </td>
                            <td className="p-4 align-middle text-center text-xs font-semibold">{formatVnd(po.amount)}</td>
                            <td className="p-4 align-middle text-right text-xs text-muted-foreground">
                              {new Date(po.arrivalDate).toLocaleDateString("vi-VN")}
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
        </>
      )}
    </div>
  );
}
