"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getDomainAvailabilityAction,
  getDomainPriceAction,
  buyDomainAction,
} from "@/app/actions/vercel";

interface RegistrarTabProps {
  project: any;
  returnTo: string;
}

export function RegistrarTab({ project, returnTo }: RegistrarTabProps) {
  const [searchDomain, setSearchDomain] = useState("");
  const [availabilityResult, setAvailabilityResult] = useState<any>(null);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [registrarError, setRegistrarError] = useState("");

  const handleSearchDomainAvailability = async () => {
    if (!searchDomain) return;
    setCheckingAvailability(true);
    setRegistrarError("");
    setAvailabilityResult(null);
    setPriceResult(null);
    try {
      const availRes = await getDomainAvailabilityAction(project.id, searchDomain);
      if (availRes.success) {
        setAvailabilityResult({ available: availRes.available, searched: true });
        if (availRes.available) {
          const priceRes = await getDomainPriceAction(project.id, searchDomain);
          if (priceRes.success && priceRes.priceData) {
            setPriceResult(priceRes.priceData);
          }
        }
      } else {
        setRegistrarError(availRes.error || "Failed to check domain availability");
      }
    } catch (err: any) {
      setRegistrarError(err?.message || "Failed to search domain");
    } finally {
      setCheckingAvailability(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">Domain Registrar</CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            Search, verify availability, and buy custom domains directly from Vercel's Domain Registrar service.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0 space-y-4">
          <div className="flex gap-2 items-end">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="searchDomainInput" className="text-xs font-bold text-ink-secondary">Search Domain Name</Label>
              <Input
                id="searchDomainInput"
                placeholder="e.g. my-cool-startup.com"
                value={searchDomain}
                onChange={(e) => setSearchDomain(e.target.value)}
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>
            <Button 
              type="button" 
              onClick={handleSearchDomainAvailability} 
              disabled={checkingAvailability || !searchDomain}
              className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4"
            >
              {checkingAvailability ? "Checking..." : "Check Availability"}
            </Button>
          </div>

          {registrarError && (
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription className="text-xs font-semibold">{registrarError}</AlertDescription>
            </Alert>
          )}

          {availabilityResult && (
            <div className="mt-6 border border-hairline rounded-lg p-5 bg-canvas-soft/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-ink">{searchDomain}</div>
                  <div className="text-xs mt-1">
                    {availabilityResult.available ? (
                      <span className="text-primary font-semibold flex items-center gap-1">
                        <CheckCircle className="size-4" /> Available for registration
                      </span>
                    ) : (
                      <span className="text-destructive font-semibold flex items-center gap-1">
                        <AlertCircle className="size-4" /> Already registered
                      </span>
                    )}
                  </div>
                </div>

                {availabilityResult.available && priceResult && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-ink">${priceResult.purchasePrice}</div>
                    <div className="text-[10px] text-ink-mute">
                      Renewal price: ${priceResult.renewalPrice || priceResult.purchasePrice}/yr
                    </div>
                  </div>
                )}
              </div>

              {availabilityResult.available && priceResult && (
                <form action={buyDomainAction} className="mt-4 pt-4 border-t border-hairline flex justify-end">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="name" value={searchDomain} />
                  <input type="hidden" name="expectedPrice" value={priceResult.purchasePrice} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-bold h-9 rounded-sm px-4">
                    Buy Domain
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
