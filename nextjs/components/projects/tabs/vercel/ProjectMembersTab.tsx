"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getProjectMembersAction,
  addProjectMemberAction,
  removeProjectMemberAction,
} from "@/app/actions/vercel";

interface ProjectMembersTabProps {
  project: any;
  returnTo: string;
}

export function ProjectMembersTab({ project, returnTo }: ProjectMembersTabProps) {
  const [projectMembersList, setProjectMembersList] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      setMembersError("");
      try {
        const res = await getProjectMembersAction(project.id);
        if (res.success && res.members) {
          setProjectMembersList(res.members || []);
        } else {
          setMembersError(res.error || "Failed to load project members");
        }
      } catch (err: any) {
        setMembersError(err?.message || "Failed to load project members");
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [project.id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">Project Collaborators & Members</CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            View users who have explicit developer or admin access to this Vercel project deployment target.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0 space-y-6">

          {/* Members List */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-ink-secondary">Project Members</div>
            {loadingMembers ? (
              <div className="text-xs text-ink-mute py-4 text-center">Loading collaborators...</div>
            ) : membersError ? (
              <div className="text-xs text-destructive py-4 text-center">{membersError}</div>
            ) : projectMembersList.length === 0 ? (
              <div className="text-xs text-ink-mute py-4 text-center bg-canvas-soft/10 border border-dashed border-hairline rounded-md">No collaborators found.</div>
            ) : (
              <div className="border border-hairline rounded-md overflow-hidden bg-[#0c0c0d]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                      <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">User</TableHead>
                      <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Role</TableHead>
                      <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute">Joined</TableHead>
                      <TableHead className="px-4 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectMembersList.map((m) => (
                      <TableRow key={m.uid} className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase overflow-hidden shrink-0">
                              {m.avatar ? (
                                <img src={`https://vercel.com/api/www/avatar/${m.avatar}?s=64`} alt={m.name || m.username} className="size-full object-cover" />
                              ) : (
                                (m.name || m.username || m.email || "U").slice(0, 2)
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-ink">{m.name || m.username}</div>
                              <div className="text-[10px] text-ink-mute font-mono">{m.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs font-medium text-ink-secondary">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            m.role === "ADMIN"
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-hairline bg-canvas-soft text-ink-mute"
                          }`}>
                            {m.role}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[10px] text-ink-mute font-mono">
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <form action={removeProjectMemberAction}>
                            <input type="hidden" name="projectId" value={project.id} />
                            <input type="hidden" name="uid" value={m.uid} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <Button type="submit" size="icon" variant="ghost" className="size-8 text-ink-mute hover:text-destructive transition-colors">
                              <Trash2 className="size-4" />
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Separator className="bg-hairline" />

          {/* Add Member Form */}
          <form action={addProjectMemberAction} className="space-y-4">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <div className="text-xs font-bold text-ink-secondary">Add Project Collaborator</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="memberEmailInput" className="text-xs font-semibold text-ink-secondary">User Email or Username</Label>
                <Input
                  id="memberEmailInput"
                  name="email"
                  placeholder="e.g. collaborator@company.com"
                  required
                  className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="memberRoleSelect" className="text-xs font-semibold text-ink-secondary">Project Role</Label>
                <Select name="role" defaultValue="MEMBER">
                  <SelectTrigger id="memberRoleSelect" className="bg-canvas-soft border-hairline h-9 text-xs rounded-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-canvas border-hairline text-xs">
                    <SelectItem value="MEMBER">Collaborator (MEMBER)</SelectItem>
                    <SelectItem value="ADMIN">Project Admin (ADMIN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
              Invite Member
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
