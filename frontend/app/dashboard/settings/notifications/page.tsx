import { markNotificationReadAction } from "@/app/actions/admin";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSettingsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { NotificationsForm } from "@/components/dashboard/notifications-form";

export default async function NotificationSettingsPage() {
  const currentUser = await requireCurrentUser();
  const data = await getSettingsData(currentUser.id);

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-4 lg:my-6" />

      <div className="flex flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:gap-12">
        {/* <aside className="top-0 lg:sticky lg:w-1/5">
          <SettingsNav />
        </aside> */}
        <div className="flex w-full overflow-y-hidden p-1">
          <div className="flex flex-1 flex-col">
            <div className="flex-none">
              <h3 className="text-lg font-medium">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Configure how you receive notifications.
              </p>
            </div>
            <Separator className="my-4 flex-none" />
            <div className="faded-bottom h-full w-full overflow-y-auto scroll-smooth pb-12 pe-4">
              <NotificationsForm />

              <Separator className="my-8" />

              <div className="flex max-w-xl flex-col gap-3">
                <div>
                  <h3 className="text-lg font-medium">Recent notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Mark messages and system events as read.
                  </p>
                </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
