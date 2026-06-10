import { UserPlus, Trash2, Check, User } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { inviteCollaboratorAction, updateCollaboratorRoleAction, removeCollaboratorAction } from "@/app/actions/admin";
import { Separator } from "@/components/ui/separator";

type MembersTabProps = {
  project: any;
  locale: string;
};

export function MembersTab({ project, locale }: MembersTabProps) {
  const bundle = project.bundle;
  const collaborators = bundle?.collaborators || [];
  const returnTo = `/projects/${project.id}?tab=members`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 animate-in fade-in duration-200">
      {/* Collaborators List */}
      <Card className="xl:col-span-2 bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Project Members</CardTitle>
          <CardDescription>
            Manage who has access to this project and their role permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-0 mt-4">
          {collaborators.length > 0 ? (
            <div className="border border-hairline rounded-lg overflow-hidden bg-canvas">
              <div className="divide-y divide-hairline-cool">
                {collaborators.map((col: any) => {
                  const userDisplayName = col.user.fullName || `${col.user.firstName || ""} ${col.user.lastName || ""}`.trim() || col.user.email;
                  const initials = (col.user.firstName || col.user.fullName || col.user.email || "U").slice(0, 2).toUpperCase();

                  return (
                    <div key={col.id} className="p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-canvas-soft/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-9 border border-hairline shadow-inner">
                          <AvatarFallback className="text-xs font-bold bg-canvas-soft text-ink-secondary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{userDisplayName}</p>
                          <p className="text-[11px] text-ink-mute truncate">{col.user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Role Change Form */}
                        <form action={updateCollaboratorRoleAction} className="flex items-center gap-2">
                          <input type="hidden" name="collaboratorId" value={col.id} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          
                          <Select name="role" defaultValue={col.role}>
                            <SelectTrigger className="h-8 w-28 text-xs rounded-sm border-hairline bg-canvas">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent className="bg-canvas border border-hairline rounded-lg">
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button type="submit" variant="ghost" size="icon" className="size-8 rounded-sm border border-hairline hover:bg-canvas-soft text-ink-mute hover:text-ink cursor-pointer" title="Save Role">
                            <Check className="size-3.5" />
                          </Button>
                        </form>

                        {/* Remove Collaborator Form */}
                        <form action={removeCollaboratorAction}>
                          <input type="hidden" name="collaboratorId" value={col.id} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <Button type="submit" variant="ghost" size="icon" className="size-8 rounded-sm text-destructive hover:bg-destructive/10 cursor-pointer" title="Remove Member">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 rounded-lg border border-dashed border-hairline bg-canvas-soft/40">
              <User className="size-8 text-ink-mute-2 mx-auto mb-2" />
              <p className="text-xs font-semibold text-ink">No members added yet</p>
              <p className="text-[11px] text-ink-mute mt-1">Use the panel on the right to invite developers to this project.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Panel */}
      <Card className="bg-canvas border border-hairline rounded-lg p-5 h-fit sticky top-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="size-4 text-ink-secondary" />
            Invite Member
          </CardTitle>
          <CardDescription className="text-xs">
            Grant workspace users access to this project.
          </CardDescription>
        </CardHeader>
        <Separator className="my-1" />
        <CardContent className="mt-4 px-0 pb-0">
          <form action={inviteCollaboratorAction} className="space-y-4">
            <input type="hidden" name="bundleId" value={bundle?.id || ""} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="developer@company.com"
                className="h-9 rounded-sm border-hairline text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">Assign Role</Label>
              <Select name="role" defaultValue="editor">
                <SelectTrigger id="role" className="h-9 rounded-sm border-hairline text-xs bg-canvas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-canvas border border-hairline rounded-lg">
                  <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                  <SelectItem value="editor">Editor (Deploy, domains)</SelectItem>
                  <SelectItem value="admin">Admin (Full settings)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={!bundle} className="w-full h-9 rounded-sm text-xs bg-primary hover:bg-primary-deep text-primary-foreground font-semibold cursor-pointer transition-colors shadow-light">
              Send Invitation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
