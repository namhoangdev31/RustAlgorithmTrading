import {
  deleteChatMessageAction,
  markChatReadAction,
  sendChatMessageAction,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getChatsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";

type ChatsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const data = await getChatsData(user.id, params);

  return (
    <>
      <PageHeader
        description="SSR inbox mapped to Notifications records with chat metadata."
        title="Chats"
      />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>New message</CardTitle>
            <CardDescription>Messages are stored as chat notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={sendChatMessageAction} className="flex flex-col gap-4">
              <input type="hidden" name="returnTo" value="/dashboard/chats" />
              <label className="grid gap-2 text-sm">
                Recipient
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  name="recipientId"
                  required
                >
                  {data.users.map((chatUser) => (
                    <option key={chatUser.id} value={chatUser.id}>
                      {chatUser.fullName ?? chatUser.email ?? chatUser.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                Message
                <Input name="body" placeholder="Type your message..." required />
              </label>
              <Button type="submit">Send message</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>Search and mark chat notifications as read.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/dashboard/chats" className="mb-4 flex gap-2" method="get">
              <Input name="q" placeholder="Search messages" />
              <Button type="submit" variant="outline">Search</Button>
            </form>

            <div className="flex flex-col gap-3">
              {data.messages.length ? (
                data.messages.map((message) => {
                  const isOutgoing = message.actorId === user.id;
                  const counterpart = isOutgoing ? message.recipient : message.actor;

                  return (
                    <div className="rounded-md border bg-background p-4" key={message.id}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {isOutgoing ? "To" : "From"}{" "}
                              {counterpart?.fullName ?? counterpart?.email ?? "Unknown"}
                            </p>
                            <Badge variant={message.isRead ? "outline" : "default"}>
                              {message.isRead ? "Read" : "Unread"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {message.body}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {message.createdAt.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!isOutgoing && !message.isRead ? (
                            <form action={markChatReadAction}>
                              <input
                                type="hidden"
                                name="notificationId"
                                value={message.id}
                              />
                              <input
                                type="hidden"
                                name="returnTo"
                                value="/dashboard/chats"
                              />
                              <Button size="sm" type="submit" variant="outline">
                                Mark read
                              </Button>
                            </form>
                          ) : null}
                          <form action={deleteChatMessageAction}>
                            <input
                              type="hidden"
                              name="notificationId"
                              value={message.id}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value="/dashboard/chats"
                            />
                            <Button size="sm" type="submit" variant="ghost">Delete</Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No messages found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

