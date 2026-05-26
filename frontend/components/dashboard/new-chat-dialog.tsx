"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ChatUser {
  id: string
  fullName: string | null
  email: string | null
}

interface NewChatDialogProps {
  users: ChatUser[]
}

export function NewChatDialog({ users }: NewChatDialogProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null)

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const name = (u.fullName ?? "").toLowerCase()
      const email = (u.email ?? "").toLowerCase()
      const term = search.toLowerCase()
      return name.includes(term) || email.includes(term)
    })
  }, [users, search])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push("/dashboard/chats")
    }
  }

  const handleChat = () => {
    if (selectedUserId) {
      router.push(`/dashboard/chats?chat=${selectedUserId}`)
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden gap-0 rounded-lg">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            New message
          </DialogTitle>
          <div className="text-sm font-semibold text-slate-600 mt-2">To:</div>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-4 stroke-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="pl-9 h-11 w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-700"
            />
          </div>
        </div>

        <ScrollArea className="h-[280px] border-t border-b border-slate-100 dark:border-slate-850 px-6 py-2">
          <div className="flex flex-col gap-1 py-1">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isSelected = selectedUserId === user.id
                const displayName = user.fullName ?? user.email ?? "Unknown"
                const handle = user.email ? user.email.split("@")[0] : "unknown"
                const initials = displayName
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      "flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors",
                      isSelected
                        ? "bg-slate-100 dark:bg-slate-800 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <Avatar className="size-9 border border-slate-200 dark:border-slate-800">
                      <AvatarFallback className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-350 text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {displayName}
                      </span>
                      <span className="text-xs text-slate-500 truncate">
                        {handle}
                      </span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">
                No users found.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6">
          <Button
            type="button"
            onClick={handleChat}
            disabled={!selectedUserId}
            className={cn(
              "w-full h-11 text-sm font-semibold transition-all rounded-md text-white shadow-xs",
              selectedUserId
                ? "bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500"
                : "bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
