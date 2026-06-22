"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/shared/time";
import {
  updateAccessGroupAction,
  listAccessGroupMembersAction,
  listAccessGroupProjectsAction,
  createAccessGroupProjectAction,
  deleteAccessGroupProjectAction,
  createAccessGroupAction,
  deleteAccessGroupAction
} from "@/app/actions/vercel";

interface AccessGroupsTabProps {
  project: any;
  vercelAccessGroups: any[];
  locale: string;
  returnTo: string;
}

export function AccessGroupsTab({
  project,
  vercelAccessGroups,
  locale,
  returnTo,
}: AccessGroupsTabProps) {
  const t = useTranslations("VercelTab");

  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupProjects, setGroupProjects] = useState<any[]>([]);
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);

  // Fetch group details when selectedGroup changes
  useEffect(() => {
    if (!selectedGroup) return;
    const fetchGroupData = async () => {
      setLoadingGroupDetails(true);
      try {
        const [membersRes, projectsRes] = await Promise.all([
          listAccessGroupMembersAction(project.id, selectedGroup.id),
          listAccessGroupProjectsAction(project.id, selectedGroup.id)
        ]);
        if (membersRes.success) setGroupMembers(membersRes.members || []);
        if (projectsRes.success) setGroupProjects(projectsRes.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGroupDetails(false);
      }
    };
    fetchGroupData();
  }, [selectedGroup, project.id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {selectedGroup ? (
        // Detailed group management view
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedGroup(null);
              }} 
              className="h-8 text-xs font-semibold"
            >
              <ArrowLeft className="size-3.5 mr-1" />
              Back to list
            </Button>
            <h3 className="text-sm font-bold text-ink">Manage Access Group: {selectedGroup.name}</h3>
          </div>

          {/* Edit Group Name */}
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-sm font-bold text-ink">Update Access Group Name</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <form action={updateAccessGroupAction} className="space-y-4">
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="idOrName" value={selectedGroup.id} />
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="editGroupName" className="text-xs font-bold text-ink-secondary">New Name</Label>
                    <Input
                      id="editGroupName"
                      name="name"
                      defaultValue={selectedGroup.name}
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    Update Name
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Members Section */}
          <Card className="bg-canvas border border-hairline rounded-lg p-0">
            <CardHeader className="p-5 border-b border-hairline">
              <CardTitle className="text-sm font-bold text-ink">Group Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingGroupDetails ? (
                <div className="p-6 text-center text-xs text-ink-mute">Loading members...</div>
              ) : groupMembers.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-mute">No members in this group.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                      <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">UID</TableHead>
                      <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Email / Username</TableHead>
                      <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupMembers.map((member) => (
                      <TableRow key={member.uid} className="border-b border-hairline">
                        <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{member.uid}</TableCell>
                        <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{member.email || member.username}</TableCell>
                        <TableCell className="px-5 py-3 text-xs text-ink-mute">{member.role}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Projects Mapping Section */}
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-sm font-bold text-ink">Group Projects</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              {/* Map Project Form */}
              <form action={createAccessGroupProjectAction} className="space-y-4">
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="accessGroupId" value={selectedGroup.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="mapProjectId" className="text-xs font-bold text-ink-secondary">Map Vercel Project ID or Name</Label>
                    <Input
                      id="mapProjectId"
                      name="projectIdToMap"
                      placeholder="e.g. prj_xyz123"
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    <Plus className="size-3.5 mr-1.5" />
                    Link Project
                  </Button>
                </div>
              </form>

              <Separator className="bg-hairline my-4" />

              {/* Group Projects Table */}
              <div className="border border-hairline rounded-md overflow-hidden">
                {loadingGroupDetails ? (
                  <div className="p-6 text-center text-xs text-ink-mute">Loading projects...</div>
                ) : groupProjects.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-mute">No projects linked to this group.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Project ID</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Name</TableHead>
                        <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupProjects.map((groupProj) => (
                        <TableRow key={groupProj.projectId} className="border-b border-hairline hover:bg-canvas-soft/10">
                          <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{groupProj.projectId}</TableCell>
                          <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{groupProj.name || groupProj.projectId}</TableCell>
                          <TableCell className="px-5 py-3 text-right">
                            <form action={deleteAccessGroupProjectAction}>
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <input type="hidden" name="accessGroupId" value={selectedGroup.id} />
                              <input type="hidden" name="projectId" value={project.id} />
                              <input type="hidden" name="projectToRemoveId" value={groupProj.projectId} />
                              <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                Unlink
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // List access groups (Default View)
        <>
          <Card className="bg-canvas border border-hairline rounded-lg p-5">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base font-bold text-ink">{t("access_groups.title")}</CardTitle>
              <CardDescription className="text-xs text-ink-mute">{t("access_groups.desc")}</CardDescription>
            </CardHeader>
            <Separator className="bg-hairline my-4" />
            <CardContent className="px-0">
              <form action={createAccessGroupAction} className="space-y-4">
                <input type="hidden" name="returnTo" value={returnTo} />
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="groupName" className="text-xs font-bold text-ink-secondary">{t("access_groups.name_label")}</Label>
                    <Input
                      id="groupName"
                      name="name"
                      placeholder={t("access_groups.name_placeholder")}
                      required
                      className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                    />
                  </div>
                  <Button type="submit" className="sm:self-end bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                    <Plus className="size-3.5 mr-1.5" />
                    {t("access_groups.create_btn")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-canvas border border-hairline rounded-lg p-0">
            <CardHeader className="p-5 border-b border-hairline">
              <CardTitle className="text-sm font-bold text-ink">Active Access Groups</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {vercelAccessGroups.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-mute">
                  {t("access_groups.empty")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                      <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("access_groups.col_id")}</TableHead>
                      <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("access_groups.col_name")}</TableHead>
                      <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">{t("access_groups.col_created")}</TableHead>
                      <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vercelAccessGroups.map((group) => (
                      <TableRow key={group.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                        <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">
                          <button 
                            onClick={() => setSelectedGroup(group)}
                            className="hover:underline text-primary text-left"
                          >
                            {group.id}
                          </button>
                        </TableCell>
                        <TableCell className="px-5 py-3 text-xs font-semibold text-ink">{group.name}</TableCell>
                        <TableCell className="px-5 py-3 text-xs text-ink-mute">
                          {group.createdAt ? formatRelativeTime(new Date(group.createdAt), locale) : "N/A"}
                        </TableCell>
                        <TableCell className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedGroup(group)}
                              className="h-7 text-xs px-2.5 rounded-sm"
                            >
                              Manage
                            </Button>
                            <form action={deleteAccessGroupAction}>
                              <input type="hidden" name="idOrName" value={group.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                                <Trash2 className="size-3.5" />
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
