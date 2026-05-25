import { markNotificationReadAction } from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSettingsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";

export default async function NotificationSettingsPage() {
  const currentUser = await requireCurrentUser();
  const data = await getSettingsData(currentUser.id);

  return (
    <>
      <PageHeader
        description="Notification preferences and read state use the Notifications model."
        title="Notifications"
      />
      <div className="grid gap-4 xl:grid-cols-[0.3fr_1fr]">
        <SettingsNav />
        <Card>
          <CardHeader>
            <CardTitle>Recent notifications</CardTitle>
            <CardDescription>Mark messages and system events as read.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.notifications.length ? (
              data.notifications.map((notification) => (
                <div className="rounded-md border p-4" key={notification.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{notification.title}</p>
                        <Badge variant={notification.isRead ? "outline" : "default"}>
                          {notification.isRead ? "Read" : "Unread"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {notification.body || notification.type}
                      </p>
                    </div>
                    {!notification.isRead ? (
                      <form action={markNotificationReadAction}>
                        <input
                          type="hidden"
                          name="notificationId"
                          value={notification.id}
                        />
                        <input
                          type="hidden"
                          name="returnTo"
                          value="/dashboard/settings/notifications"
                        />
                        <Button size="sm" type="submit" variant="outline">
                          Mark read
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No notifications found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

