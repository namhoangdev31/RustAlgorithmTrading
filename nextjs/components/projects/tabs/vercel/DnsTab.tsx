"use client";

import { useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getDnsRecordsAction,
  createDnsRecordAction,
  deleteDnsRecordAction,
} from "@/app/actions/vercel";

interface DnsTabProps {
  project: any;
  returnTo: string;
}

export function DnsTab({ project, returnTo }: DnsTabProps) {
  const [dnsDomain, setDnsDomain] = useState("");
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [loadingDns, setLoadingDns] = useState(false);
  const [dnsError, setDnsError] = useState("");

  const handleFetchDnsRecords = async () => {
    if (!dnsDomain) return;
    setLoadingDns(true);
    setDnsError("");
    try {
      const res = await getDnsRecordsAction(project.id, dnsDomain);
      if (res.success && res.records) {
        setDnsRecords(res.records || []);
      } else {
        setDnsError(res.error || "Failed to load DNS records");
      }
    } catch (err: any) {
      setDnsError(err?.message || "Failed to load DNS records");
    } finally {
      setLoadingDns(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">DNS Records</CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            Query and manage DNS records for domains registered or hosted with Vercel.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0 space-y-4">
          <div className="flex gap-2 items-end">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="dnsDomainInput" className="text-xs font-bold text-ink-secondary">Domain Name</Label>
              <Input
                id="dnsDomainInput"
                placeholder="e.g. example.com"
                value={dnsDomain}
                onChange={(e) => setDnsDomain(e.target.value)}
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>
            <Button 
              type="button" 
              onClick={handleFetchDnsRecords} 
              disabled={loadingDns || !dnsDomain}
              className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4"
            >
              {loadingDns ? "Fetching..." : "Fetch Records"}
            </Button>
          </div>

          {dnsError && (
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription className="text-xs font-semibold">{dnsError}</AlertDescription>
            </Alert>
          )}

          {dnsRecords.length > 0 ? (
            <div className="rounded-md border border-hairline overflow-hidden mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-canvas-soft/20 border-b border-hairline">
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Type</TableHead>
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Name</TableHead>
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">Value</TableHead>
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute">TTL</TableHead>
                    <TableHead className="px-5 py-2 text-[10px] uppercase font-bold text-ink-mute text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dnsRecords.map((record) => (
                    <TableRow key={record.id} className="border-b border-hairline hover:bg-canvas-soft/10">
                      <TableCell className="px-5 py-3 text-xs font-bold text-ink">{record.type}</TableCell>
                      <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary">{record.name || "@"}</TableCell>
                      <TableCell className="px-5 py-3 text-xs font-mono text-ink-secondary truncate max-w-[200px]" title={record.value}>{record.value}</TableCell>
                      <TableCell className="px-5 py-3 text-xs text-ink-mute">{record.ttl}</TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <form action={deleteDnsRecordAction}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="domain" value={dnsDomain} />
                          <input type="hidden" name="recordId" value={record.id} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <Button type="submit" variant="ghost" className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 rounded-sm text-xs">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            !loadingDns && dnsDomain && (
              <div className="p-6 text-center text-xs text-ink-mute border border-dashed border-hairline rounded-md">
                No DNS records found for this domain.
              </div>
            )
          )}
        </CardContent>
      </Card>

      {dnsDomain && (
        <Card className="bg-canvas border border-hairline rounded-lg p-5">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm font-bold text-ink">Add New DNS Record for {dnsDomain}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <form action={createDnsRecordAction} className="space-y-4">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="domain" value={dnsDomain} />
              <input type="hidden" name="returnTo" value={returnTo} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dnsType" className="text-xs font-bold text-ink-secondary">Record Type</Label>
                  <Select name="type" defaultValue="A">
                    <SelectTrigger id="dnsType" className="bg-canvas-soft border-hairline h-9 text-xs rounded-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-canvas border-hairline text-xs">
                      {["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "LOC", "CAA", "NS"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dnsName" className="text-xs font-bold text-ink-secondary">Name / Host</Label>
                  <Input
                    id="dnsName"
                    name="name"
                    placeholder="e.g. www, sub, @"
                    className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="dnsValue" className="text-xs font-bold text-ink-secondary">Value / Points To</Label>
                  <Input
                    id="dnsValue"
                    name="value"
                    placeholder="e.g. 76.76.21.21"
                    required
                    className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dnsTtl" className="text-xs font-bold text-ink-secondary">TTL (Seconds, optional)</Label>
                  <Input
                    id="dnsTtl"
                    name="ttl"
                    type="number"
                    placeholder="e.g. 60, 3600"
                    className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dnsComment" className="text-xs font-bold text-ink-secondary">Comment (Optional)</Label>
                  <Input
                    id="dnsComment"
                    name="comment"
                    placeholder="Identify this record"
                    className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
                  />
                </div>
              </div>

              <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
                Create DNS Record
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
