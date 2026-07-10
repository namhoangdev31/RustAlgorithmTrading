import { markNotificationReadAction } from "@/app/actions/admin";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSettingsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { NotificationsForm } from "@/components/dashboard/notifications-form";

export default async function NotificationSettingsPage() {
  const currentUser = await requireCurrentUser();
  const data = await getSettingsData(currentUser.id);
  const t = await getTranslations("Settings");
  const returnTo = "/settings/notifications";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t("notifications.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("notifications.description")}
        </p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-6">
        <NotificationsForm />

        <Separator className="my-6" />

        <div className="flex max-w-xl flex-col gap-3">
          <div>
            <h3 className="text-base font-bold">{t("notifications.recent_notifications_title") || "Recent Notifications"}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("notifications.recent_notifications_desc")}
            </p>
          </div>
          {data.notifications.length ? (
            data.notifications.map((notification) => (
              <div className="rounded-md border border-hairline p-4 text-xs bg-card" key={notification.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{notification.title}</p>
                      <Badge variant={notification.isRead ? "outline" : "default"} className="text-[10px]">
                        {notification.isRead ? t("notifications.status_read") : t("notifications.status_unread")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
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
                        value={returnTo}
                      />
                      <Button size="sm" type="submit" variant="outline" className="h-8 text-xs">
                        {t("notifications.mark_read_btn") || "Mark as read"}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">{t("notifications.no_notifications")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
