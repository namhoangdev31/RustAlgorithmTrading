import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/server/current-user";
import { createSessionStore } from "@/lib/stores/session-store";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireCurrentUser();
    const sessionState = createSessionStore({
        userId: user.id,
        email: user.email ?? null,
        displayName: user.fullName ?? null,
        provider: user.provider ?? null,
    }).getState();

    return (
        <div className="flex min-h-screen flex-col bg-muted/30">
            <header className="border-b bg-background">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {sessionState.provider ?? "session"} dashboard
                        </p>
                        <h1 className="text-lg font-semibold">
                            {sessionState.displayName ?? sessionState.email ?? "Trading user"}
                        </h1>
                    </div>
                    <form action={logoutAction}>
                        <Button variant="outline" type="submit">Sign out</Button>
                    </form>
                </div>
            </header>
            {children}
        </div>
    );
}
