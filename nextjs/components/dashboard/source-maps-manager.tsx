import { deleteNativeSourceMapAction, upsertNativeSourceMapAction } from "@/app/actions/native-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SourceMapRecord = {
  id: string;
  projectId: string;
  deploymentId: string | null;
  releaseVersion: string;
  fileName: string;
  storagePath: string;
  uploadedAt: Date | string;
  hasSourcesContent: boolean;
};

export function SourceMapsManager({
  projectId,
  sourceMaps,
  returnTo,
}: {
  projectId: string;
  sourceMaps: SourceMapRecord[];
  returnTo?: string;
}) {
  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
        <CardTitle className="text-base font-bold text-ink">Source Maps Manager</CardTitle>
        <CardDescription className="text-xs text-ink-mute">
          Inspect, overwrite, or delete uploaded source maps used for native crash resolution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="overflow-x-auto rounded-md border border-hairline">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow className="bg-canvas-soft/40">
                <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Release</TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">File</TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Storage</TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Uploaded</TableHead>
                <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Preview</TableHead>
                <TableHead className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceMaps.length ? (
                sourceMaps.map((sourceMap) => (
                  <TableRow key={sourceMap.id} className="border-b border-hairline">
                    <TableCell className="px-4 py-3 text-xs font-mono text-ink-secondary">{sourceMap.releaseVersion}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">{sourceMap.fileName}</TableCell>
                    <TableCell className="max-w-[220px] truncate px-4 py-3 text-xs text-ink-mute">{sourceMap.storagePath}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">
                      {new Date(sourceMap.uploadedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      <Badge variant={sourceMap.hasSourcesContent ? "default" : "secondary"}>
                        {sourceMap.hasSourcesContent ? "source preview ready" : "source unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <form action={deleteNativeSourceMapAction}>
                        <input type="hidden" name="projectId" value={projectId} />
                        <input type="hidden" name="sourceMapId" value={sourceMap.id} />
                        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                        <Button type="submit" variant="outline" size="sm" className="h-8 text-[11px]">
                          Delete
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-6 text-center text-xs text-ink-mute">
                    No source maps uploaded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <form action={upsertNativeSourceMapAction} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="projectId" value={projectId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <div className="space-y-3">
            <Input name="releaseVersion" placeholder="Release version (e.g. 1.4.2)" required />
            <Input name="fileName" placeholder="Compiled file name (e.g. app.js.map)" required />
            <Input name="storagePath" placeholder="Optional storage path override" />
          </div>
          <div className="space-y-3">
            <Textarea
              name="mapJson"
              required
              rows={8}
              className="font-mono text-[11px]"
              placeholder='Paste the full source map JSON here. Reusing the same release + file will overwrite the existing map.'
            />
            <div className="flex justify-end">
              <Button type="submit">Upload or overwrite source map</Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
