import { Plus, RotateCcw, SlidersHorizontal, UploadCloud } from "lucide-react";

import {
  createLepoShipUpdatePhaseAction,
  rollbackLepoShipTrackAction,
  saveLepoShipRuntimeConfigAction,
  updateLepoShipRolloutAction,
} from "@/app/actions/lepoship";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReleaseTrack = {
  id: string;
  version: string;
  buildNumber: number;
  status: string;
  rollouts: Array<{
    rolloutPercent: number;
    targetCountry: string | null;
  }>;
};

type RuntimeConfig = {
  minOsVersion: string | null;
  runtimeType: string;
  targetPlatforms: string | null;
  sdkVersion: string | null;
  offlineSupported: boolean;
} | null;

type UpdatePhase = {
  id: string;
  phaseOrder: number;
  percentage: number;
  targetCountry: string | null;
  status: string;
  createdAt: Date;
  version: {
    version: string;
    buildNumber: number;
  };
};

type LepoShipOtaControlsProps = {
  projectId: string;
  runtimeConfig: RuntimeConfig;
  releaseTracks: ReleaseTrack[];
  updatePhases: UpdatePhase[];
};

function TrackSelect({ tracks }: { tracks: ReleaseTrack[] }) {
  return (
    <NativeSelect name="trackId" required>
      {tracks.map((track) => (
        <NativeSelectOption key={track.id} value={track.id}>
          {track.version} build #{track.buildNumber}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

export function LepoShipOtaControls({
  projectId,
  runtimeConfig,
  releaseTracks,
  updatePhases,
}: LepoShipOtaControlsProps) {
  const latestTrack = releaseTracks[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <form action={saveLepoShipRuntimeConfigAction} className="rounded-md border p-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="returnTo" value={`/lepoship/${projectId}`} />
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="runtimeType">Runtime type</FieldLabel>
            <NativeSelect
              id="runtimeType"
              name="runtimeType"
              defaultValue={runtimeConfig?.runtimeType ?? "standard"}
            >
              <NativeSelectOption value="standard">Standard</NativeSelectOption>
              <NativeSelectOption value="force_update">Force update</NativeSelectOption>
              <NativeSelectOption value="background_update">Background update</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="targetPlatforms">Target platforms</FieldLabel>
            <Input
              id="targetPlatforms"
              name="targetPlatforms"
              defaultValue={runtimeConfig?.targetPlatforms ?? "ios,android"}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sdkVersion">SDK version</FieldLabel>
            <Input
              id="sdkVersion"
              name="sdkVersion"
              defaultValue={runtimeConfig?.sdkVersion ?? ""}
              placeholder="1.0.0"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="minOsVersion">Minimum OS version</FieldLabel>
            <Input
              id="minOsVersion"
              name="minOsVersion"
              defaultValue={runtimeConfig?.minOsVersion ?? ""}
              placeholder="iOS 15 / Android 10"
            />
          </Field>
          <Field className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="offlineSupported"
                defaultChecked={runtimeConfig?.offlineSupported ?? false}
              />
              Offline bundle cache
            </label>
            <FieldDescription>
              Runtime metadata is stored in Prisma and served through SSR/OTA routes.
            </FieldDescription>
          </Field>
          <Field className="md:col-span-2">
            <Button type="submit">
              <SlidersHorizontal data-icon="inline-start" />
              Save runtime
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {latestTrack ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form action={updateLepoShipRolloutAction} className="rounded-md border p-4">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="returnTo" value={`/lepoship/${projectId}`} />
            <FieldGroup>
              <Field>
                <FieldLabel>Release track</FieldLabel>
                <TrackSelect tracks={releaseTracks} />
              </Field>
              <Field>
                <FieldLabel htmlFor="rolloutPercent">Rollout percent</FieldLabel>
                <Input
                  id="rolloutPercent"
                  name="rolloutPercent"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={latestTrack.rollouts[0]?.rolloutPercent ?? 100}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="targetCountry">Target country</FieldLabel>
                <Input
                  id="targetCountry"
                  name="targetCountry"
                  maxLength={5}
                  placeholder="VN"
                  defaultValue={latestTrack.rollouts[0]?.targetCountry ?? ""}
                />
              </Field>
              <Button type="submit">
                <UploadCloud data-icon="inline-start" />
                Update rollout
              </Button>
            </FieldGroup>
          </form>

          <form action={createLepoShipUpdatePhaseAction} className="rounded-md border p-4">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="returnTo" value={`/lepoship/${projectId}`} />
            <FieldGroup>
              <Field>
                <FieldLabel>Release track</FieldLabel>
                <TrackSelect tracks={releaseTracks} />
              </Field>
              <Field>
                <FieldLabel htmlFor="phaseOrder">Phase order</FieldLabel>
                <Input id="phaseOrder" name="phaseOrder" type="number" min={1} defaultValue={1} />
              </Field>
              <Field>
                <FieldLabel htmlFor="phaseRolloutPercent">Phase percent</FieldLabel>
                <Input
                  id="phaseRolloutPercent"
                  name="rolloutPercent"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={25}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phaseTargetCountry">Target country</FieldLabel>
                <Input id="phaseTargetCountry" name="targetCountry" maxLength={5} />
              </Field>
              <Button type="submit" variant="outline">
                <Plus data-icon="inline-start" />
                Create phase
              </Button>
            </FieldGroup>
          </form>
        </div>
      ) : null}

      {releaseTracks.length > 1 ? (
        <form action={rollbackLepoShipTrackAction} className="flex flex-wrap items-end gap-3 rounded-md border p-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="returnTo" value={`/lepoship/${projectId}`} />
          <Field>
            <FieldLabel>Rollback track</FieldLabel>
            <TrackSelect tracks={releaseTracks} />
          </Field>
          <Button type="submit" variant="outline">
            <RotateCcw data-icon="inline-start" />
            Roll back
          </Button>
        </form>
      ) : null}

      {updatePhases.length ? (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Percent</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updatePhases.map((phase) => (
                <TableRow key={phase.id}>
                  <TableCell>
                    {phase.version.version} #{phase.version.buildNumber}
                  </TableCell>
                  <TableCell>{phase.phaseOrder}</TableCell>
                  <TableCell>{phase.percentage}%</TableCell>
                  <TableCell>{phase.targetCountry || "Global"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{phase.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
