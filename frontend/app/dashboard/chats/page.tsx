import {
  deleteChatMessageAction,
  markChatReadAction,
  sendChatMessageAction,
} from "@/app/actions/admin";
import {
  ArrowLeft,
  Edit,
  ImagePlus,
  MessagesSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search as SearchIcon,
  Send,
  Video,
} from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getChatsData } from "@/lib/server/admin-data";
import { requireCurrentUser } from "@/lib/server/current-user";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ChatsPageProps = {
  searchParams: Promise<{
    q?: string;
    chat?: string;
    dialog?: string;
  }>;
};

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const data = await getChatsData(user.id, params);
  const contacts = buildContacts(data.messages, data.users, user.id);
  const selectedContact = params.chat
    ? contacts.find((contact) => contact.id === params.chat) ?? null
    : null;
  const groupedMessages = selectedContact
    ? groupMessagesByDate(selectedContact.messages)
    : [];

  return (
    <>
      <section className="flex h-[calc(100svh-8rem)] min-h-[620px] gap-6 overflow-hidden">
        <div className="flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80">
          <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none">
            <div className="flex items-center justify-between py-2">
              <div className="flex gap-2">
                <h1 className="text-2xl font-bold">Inbox</h1>
                <MessagesSquare className="size-5" />
              </div>

              <Button asChild className="rounded-lg" size="icon" variant="ghost">
                <Link href="/dashboard/chats?dialog=new">
                  <Edit className="size-6 stroke-muted-foreground" />
                  <span className="sr-only">New chat</span>
                </Link>
              </Button>
            </div>

            <form action="/dashboard/chats" className="relative flex items-center w-full" method="get">
              <SearchIcon className="absolute left-3 size-4 stroke-slate-500" />
              <Input
                className="pl-9 h-10 w-full"
                defaultValue={params.q ?? ""}
                name="q"
                placeholder="Search chat..."
                type="text"
              />
            </form>
          </div>

          <ScrollArea className="-mx-3 h-full overflow-scroll p-3">
            {contacts.map((contact) => {
              const lastMessage = contact.messages[0];
              const lastText = lastMessage
                ? lastMessage.actorId === user.id
                  ? `You: ${lastMessage.body}`
                  : lastMessage.body
                : "Send a message to start a chat.";
              const href = `/dashboard/chats?chat=${contact.id}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`;

              return (
                <Fragment key={contact.id}>
                  <Link
                    className={cn(
                      "group flex w-full rounded-md px-2 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground",
                      selectedContact?.id === contact.id && "sm:bg-muted"
                    )}
                    href={href}
                  >
                    <div className="flex gap-2">
                      <Avatar>
                        <AvatarFallback>{getInitials(contact.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{contact.fullName}</span>
                        <span className="line-clamp-2 text-muted-foreground group-hover:text-accent-foreground/90">
                          {lastText}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <Separator className="my-1" />
                </Fragment>
              );
            })}
          </ScrollArea>
        </div>

        {selectedContact ? (
          <div className="absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col border bg-background shadow-xs sm:static sm:z-auto sm:flex sm:rounded-md">
            <div className="mb-1 flex flex-none justify-between bg-card p-4 shadow-lg sm:rounded-t-md">
              <div className="flex gap-3">
                <Button asChild className="-ms-2 h-full sm:hidden" size="icon" variant="ghost">
                  <Link href="/dashboard/chats">
                    <ArrowLeft className="rtl:rotate-180" />
                    <span className="sr-only">Back</span>
                  </Link>
                </Button>
                <div className="flex items-center gap-2 lg:gap-4">
                  <Avatar className="size-9 lg:size-11">
                    <AvatarFallback>{getInitials(selectedContact.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="block text-sm font-medium lg:text-base">
                      {selectedContact.fullName}
                    </span>
                    <span className="line-clamp-1 block max-w-32 text-nowrap text-xs text-muted-foreground lg:max-w-none lg:text-sm">
                      {selectedContact.title}
                    </span>
                  </div>
                </div>
              </div>

              <div className="-me-1 flex items-center gap-1 lg:gap-2">
                <Button className="hidden size-8 rounded-full sm:inline-flex lg:size-10" size="icon" variant="ghost">
                  <Video className="size-5 stroke-muted-foreground" />
                  <span className="sr-only">Video</span>
                </Button>
                <Button className="hidden size-8 rounded-full sm:inline-flex lg:size-10" size="icon" variant="ghost">
                  <Phone className="size-5 stroke-muted-foreground" />
                  <span className="sr-only">Phone</span>
                </Button>
                <Button className="h-10 rounded-md sm:size-8 lg:h-10 lg:w-6" size="icon" variant="ghost">
                  <MoreVertical className="stroke-muted-foreground sm:size-5" />
                  <span className="sr-only">More</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 rounded-md px-4 pb-4 pt-0">
              <div className="flex size-full flex-1">
                <div className="relative -me-4 flex flex-1 flex-col overflow-y-hidden">
                  <div className="flex h-40 w-full grow flex-col-reverse justify-start gap-4 overflow-y-auto pb-4 pe-4 pt-2">
                    {groupedMessages.map(([date, messages]) => (
                      <Fragment key={date}>
                        {messages.map((message) => {
                          const outgoing = message.actorId === user.id;

                          return (
                            <div
                              className={cn(
                                "max-w-72 px-3 py-2 shadow-lg wrap-break-word",
                                outgoing
                                  ? "self-end rounded-[16px_16px_0_16px] bg-primary/90 text-primary-foreground/75"
                                  : "self-start rounded-[16px_16px_16px_0] bg-muted"
                              )}
                              key={message.id}
                            >
                              {message.body}
                              <span
                                className={cn(
                                  "mt-1 block text-xs font-light italic text-foreground/75",
                                  outgoing && "text-end text-primary-foreground/85"
                                )}
                              >
                                {formatTime(message.createdAt)}
                              </span>
                              <div className="mt-2 flex justify-end gap-2">
                                {!outgoing && !message.isRead ? (
                                  <form action={markChatReadAction}>
                                    <input name="notificationId" type="hidden" value={message.id} />
                                    <input name="returnTo" type="hidden" value={`/dashboard/chats?chat=${selectedContact.id}`} />
                                    <Button className="h-auto p-0 text-xs underline" type="submit" variant="link">
                                      Mark read
                                    </Button>
                                  </form>
                                ) : null}
                                <form action={deleteChatMessageAction}>
                                  <input name="notificationId" type="hidden" value={message.id} />
                                  <input name="returnTo" type="hidden" value={`/dashboard/chats?chat=${selectedContact.id}`} />
                                  <Button className="h-auto p-0 text-xs underline" type="submit" variant="link">
                                    Delete
                                  </Button>
                                </form>
                              </div>
                            </div>
                          );
                        })}
                        <div className="text-center text-xs">{date}</div>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
              <form action={sendChatMessageAction} className="flex w-full flex-none gap-2">
                <input name="recipientId" type="hidden" value={selectedContact.id} />
                <input name="returnTo" type="hidden" value={`/dashboard/chats?chat=${selectedContact.id}`} />
                <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-card px-2 py-1 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring lg:gap-4">
                  <div className="flex gap-1">
                    <Button className="h-8 rounded-md" size="icon" type="button" variant="ghost">
                      <Plus className="size-5 stroke-muted-foreground" />
                    </Button>
                    <Button className="hidden h-8 rounded-md lg:inline-flex" size="icon" type="button" variant="ghost">
                      <ImagePlus className="size-5 stroke-muted-foreground" />
                    </Button>
                    <Button className="hidden h-8 rounded-md lg:inline-flex" size="icon" type="button" variant="ghost">
                      <Paperclip className="size-5 stroke-muted-foreground" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <Label className="sr-only">Chat Text Box</Label>
                    <Input
                      className="h-8 w-full border-none focus-visible:ring-0 bg-transparent shadow-none"
                      name="body"
                      placeholder="Type your messages..."
                      required
                      type="text"
                    />
                  </div>
                  <Button className="hidden sm:inline-flex" size="icon" type="submit" variant="ghost">
                    <Send className="size-5" />
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
                <Button className="h-full sm:hidden" type="submit">
                  <Send className="size-4" /> Send
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col justify-center rounded-md border bg-card shadow-xs sm:static sm:z-auto sm:flex">
            <div className="flex flex-col items-center gap-6">
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-border">
                <MessagesSquare className="size-8" />
              </div>
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-xl font-semibold">Your messages</h1>
                <p className="text-sm text-muted-foreground">
                  Send a message to start a chat.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/chats?dialog=new">Send message</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      {params.dialog === "new" ? <NewChatCard users={data.users} /> : null}
    </>
  );
}

type Message = Awaited<ReturnType<typeof getChatsData>>["messages"][number];
type ChatUser = Awaited<ReturnType<typeof getChatsData>>["users"][number];

function buildContacts(messages: Message[], users: ChatUser[], currentUserId: string) {
  const contacts = new Map<
    string,
    {
      id: string;
      fullName: string;
      email: string | null;
      title: string;
      messages: Message[];
    }
  >();

  for (const chatUser of users) {
    contacts.set(chatUser.id, {
      id: chatUser.id,
      fullName: chatUser.fullName ?? chatUser.email ?? "Unknown",
      email: chatUser.email,
      title: pickTitle(chatUser.fullName ?? chatUser.email ?? ""),
      messages: [],
    });
  }

  for (const message of messages) {
    const counterpart =
      message.actorId === currentUserId ? message.recipient : message.actor;

    if (!counterpart?.id) {
      continue;
    }

    const existing = contacts.get(counterpart.id) ?? {
      id: counterpart.id,
      fullName: counterpart.fullName ?? counterpart.email ?? "Unknown",
      email: counterpart.email,
      title: pickTitle(counterpart.fullName ?? counterpart.email ?? ""),
      messages: [],
    };

    existing.messages.push(message);
    contacts.set(counterpart.id, existing);
  }

  return Array.from(contacts.values()).sort((a, b) => {
    const aTime = a.messages[0]?.createdAt.getTime() ?? 0;
    const bTime = b.messages[0]?.createdAt.getTime() ?? 0;
    return bTime - aTime || a.fullName.localeCompare(b.fullName);
  });
}

function groupMessagesByDate(messages: Message[]) {
  const sorted = [...messages].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  const groups = new Map<string, Message[]>();

  for (const message of sorted) {
    const key = new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(message.createdAt);
    groups.set(key, [...(groups.get(key) ?? []), message]);
  }

  return Array.from(groups.entries()).reverse();
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "U").concat(words[1]?.[0] ?? "").toUpperCase();
}

function pickTitle(value: string) {
  const titles = [
    "Senior Backend Dev",
    "Tech Lead",
    "QA",
    "Jr Developer",
    "Senior UI/UX Designer",
    "Product Designer",
    "CEO",
  ];
  const seed = value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return titles[seed % titles.length];
}

function NewChatCard({ users }: { users: ChatUser[] }) {
  return (
    <Card className="fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 shadow-2xl">
      <CardHeader>
        <CardTitle>New chat</CardTitle>
        <CardDescription>Select a teammate and send the first message.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={sendChatMessageAction} className="flex flex-col gap-4">
          <input name="returnTo" type="hidden" value="/dashboard/chats" />
          <Label className="grid gap-2 text-sm">
            Recipient
            <Select
              name="recipientId"
              required
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select recipient..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((chatUser) => (
                  <SelectItem key={chatUser.id} value={chatUser.id}>
                    {chatUser.fullName ?? chatUser.email ?? chatUser.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className="grid gap-2 text-sm">
            Message
            <Input name="body" placeholder="Type your message..." required />
          </Label>
          <div className="flex gap-2">
            <Button type="submit">Chat</Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/chats">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
