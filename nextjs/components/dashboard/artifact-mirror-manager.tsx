import { deleteNativeArtifactMirrorAction, publishNativeArtifactMirrorAction } from "@/app/actions/native-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ArtifactMirrorManager({
  projectId,
  deployments,
  mirrors,
  returnTo,
}: {
  projectId: string;
  deployments: any[];
  mirrors: any[];
  returnTo?: string;
}) {
  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
        <CardTitle className="text-base font-bold text-ink">Artifact Mirrors</CardTitle>
        <CardDescription className="text-xs text-ink-mute">
          Publish deployment artifacts to IPFS or Arweave using adapter-first mirror manifests with graceful fallback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <form action={publishNativeArtifactMirrorAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="deploymentId" placeholder={deployments[0]?.id || "deployment id"} />
          <Input name="provider" placeholder="ipfs" />
          <Input name="policy" placeholder="hybrid" />
          <div className="flex items-center">
            <Button type="submit" size="sm">Publish Mirror</Button>
          </div>
        </form>

        {mirrors.length ? (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table>
              <TableHeader>
                <TableRow className="bg-canvas-soft/40">
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Locator</TableHead>
                  <TableHead>Deployment</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mirrors.map((mirror) => (
                  <TableRow key={mirror.id}>
                    <TableCell className="uppercase">{mirror.provider}</TableCell>
                    <TableCell><Badge variant="secondary">{mirror.status}</Badge></TableCell>
                    <TableCell className="max-w-[260px] truncate text-xs text-ink-mute">{mirror.locator}</TableCell>
                    <TableCell className="text-xs text-ink-mute">{mirror.deployment?.version || mirror.deploymentId}</TableCell>
                    <TableCell>
                      <form action={deleteNativeArtifactMirrorAction}>
                        <input type="hidden" name="projectId" value={projectId} />
                        <input type="hidden" name="mirrorId" value={mirror.id} />
                        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                        <Button type="submit" size="sm" variant="outline">Delete</Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-hairline bg-canvas-soft/30 px-4 py-6 text-xs text-ink-mute">
            No decentralized mirrors have been published yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
