import { Cpu, Gauge, Smartphone, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/shared/time";

type ConnectedDevice = {
  id: string;
  deviceId: string;
  platform: string;
  deviceModel: string | null;
  osVersion: string | null;
  ramMb: number | null;
  pingMs: number | null;
  status: string;
  lastSeenAt: Date | string;
};

function getStatusVariant(status: string) {
  switch (status) {
    case "online":
      return "default";
    case "stale":
      return "secondary";
    default:
      return "outline";
  }
}

export function ConnectedDevicesPanel({
  devices,
  locale,
}: {
  devices: ConnectedDevice[];
  locale: string;
}) {
  return (
    <Card className="border border-hairline bg-canvas py-0">
      <CardHeader className="border-b border-hairline-cool bg-canvas-soft/60 p-5">
        <CardTitle className="text-base font-bold text-ink">Connected Devices</CardTitle>
        <CardDescription className="text-xs text-ink-mute">
          Live bridge heartbeat status for simulators and physical devices connected to LepoS.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        {devices.length ? (
          <div className="overflow-x-auto rounded-md border border-hairline">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="bg-canvas-soft/40">
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Device</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Platform</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Resources</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Latency</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Status</TableHead>
                  <TableHead className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id} className="border-b border-hairline">
                    <TableCell className="px-4 py-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-ink-secondary">{device.deviceModel || device.deviceId}</span>
                        <span className="font-mono text-[11px] text-ink-mute">{device.deviceId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">
                      <div className="flex items-center gap-2">
                        <Smartphone className="size-3.5 text-indigo-400" />
                        <span className="capitalize">
                          {device.platform}
                          {device.osVersion ? ` ${device.osVersion}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Cpu className="size-3.5 text-sky-400" />
                          {device.ramMb ? `${device.ramMb} MB` : "RAM n/a"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="size-3.5 text-emerald-400" />
                        {device.pingMs ? `${device.pingMs} ms` : "Ping n/a"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      <Badge variant={getStatusVariant(device.status)} className="capitalize">
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-ink-secondary">
                      <span className="inline-flex items-center gap-1">
                        <TimerReset className="size-3.5 text-amber-400" />
                        {formatRelativeTime(new Date(device.lastSeenAt), locale)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-hairline bg-canvas-soft/40 px-4 py-6 text-center text-xs font-medium text-ink-mute">
            No devices have reported heartbeats yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
