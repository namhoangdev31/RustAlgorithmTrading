import {
    createRiskEventAction,
    deleteRiskEventAction,
    updateRiskEventSeverityAction,
} from "@/app/actions/dashboard";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDashboardData } from "@/lib/server/dashboard-data";
import { requireCurrentUser } from "@/lib/server/current-user";

export default async function DashboardPage() {
    const user = await requireCurrentUser();
    const data = await getDashboardData(user.id);
    const userName = data.currentUser?.fullName ?? data.currentUser?.email ?? "Trader";

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
            <section>
                <p className="text-sm text-muted-foreground">Signed in with Firebase Auth and a NextAuth cookie session.</p>
                <h2 className="mt-1 text-2xl font-bold">Welcome back, {userName}</h2>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardDescription>Orders</CardDescription>
                        <CardTitle className="text-3xl">{data.orderCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Risk events</CardDescription>
                        <CardTitle className="text-3xl">{data.riskEventCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Published bundles</CardDescription>
                        <CardTitle className="text-3xl">{data.publishedBundleCount}</CardTitle>
                    </CardHeader>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Create risk event</CardTitle>
                        <CardDescription>Server Action writes directly with Prisma.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createRiskEventAction} className="grid gap-4">
                            <div className="grid gap-2">
                                <label htmlFor="eventType" className="text-sm font-medium">Event type</label>
                                <Input id="eventType" name="eventType" placeholder="limit_check" required />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="severity" className="text-sm font-medium">Severity</label>
                                <select
                                    id="severity"
                                    name="severity"
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    defaultValue="low"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="message" className="text-sm font-medium">Message</label>
                                <Input id="message" name="message" placeholder="Risk policy note" required />
                            </div>
                            <Button type="submit">Create</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent risk events</CardTitle>
                        <CardDescription>Update or delete without a custom API route.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {data.recentRiskEvents.length ? data.recentRiskEvents.map((event) => (
                                <div key={event.id} className="rounded-md border bg-background p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="font-medium">{event.eventType}</p>
                                            <p className="text-sm text-muted-foreground">{event.message}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {event.occurredAt.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <form action={updateRiskEventSeverityAction} className="flex gap-2">
                                                <input type="hidden" name="id" value={event.id} />
                                                <select
                                                    name="severity"
                                                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                                    defaultValue={event.severity}
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                    <option value="critical">Critical</option>
                                                </select>
                                                <Button size="sm" variant="outline" type="submit">Update</Button>
                                            </form>
                                            <form action={deleteRiskEventAction}>
                                                <input type="hidden" name="id" value={event.id} />
                                                <Button size="sm" variant="destructive" type="submit">Delete</Button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground">No risk events yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle>Recent orders</CardTitle>
                    <CardDescription>Read directly from PostgreSQL through Prisma during SSR.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-muted-foreground">
                                <tr>
                                    <th className="py-2 pr-4">Order</th>
                                    <th className="py-2 pr-4">Symbol</th>
                                    <th className="py-2 pr-4">Side</th>
                                    <th className="py-2 pr-4">Qty</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2">Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentOrders.length ? data.recentOrders.map((order) => (
                                    <tr key={order.id} className="border-b last:border-0">
                                        <td className="py-3 pr-4 font-mono text-xs">{order.orderId}</td>
                                        <td className="py-3 pr-4">{order.symbol}</td>
                                        <td className="py-3 pr-4">{order.side}</td>
                                        <td className="py-3 pr-4">{order.quantity}</td>
                                        <td className="py-3 pr-4">{order.status}</td>
                                        <td className="py-3">{order.submittedAt.toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td className="py-3 text-muted-foreground" colSpan={6}>No orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
