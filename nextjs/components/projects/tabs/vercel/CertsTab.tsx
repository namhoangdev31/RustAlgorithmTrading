"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, PlusCircle, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { issueCertificateAction, uploadCertificateAction, deleteCertificateAction } from "@/app/actions/vercel";

interface CertsTabProps {
  returnTo: string;
}

export function CertsTab({ returnTo }: CertsTabProps) {
  const t = useTranslations("VercelTab");

  return (
    <div className="space-y-6">
      {/* Issue Certificate */}
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-ink">{t("certs.title")} — Issue SSL</CardTitle>
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
              Simulator
            </span>
          </div>
          <CardDescription className="text-xs text-ink-mute">{t("certs.desc")}</CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0">
          <form action={issueCertificateAction} className="space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="space-y-1.5">
              <Label htmlFor="cns" className="text-xs font-bold text-ink-secondary">{t("certs.domain_label")}</Label>
              <Input
                id="cns"
                name="cns"
                placeholder={t("certs.domain_placeholder")}
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
              <CheckCircle className="size-3.5 mr-1.5" />
              {t("certs.issue_btn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Upload Certificate */}
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink">{t("certs.upload_btn")}</CardTitle>
          <CardDescription className="text-xs text-ink-mute">Upload a custom TLS/SSL certificate chain for external routing.</CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0">
          <form action={uploadCertificateAction} className="space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            
            <div className="space-y-1.5">
              <Label htmlFor="cert" className="text-xs font-bold text-ink-secondary">{t("certs.cert_label")}</Label>
              <Textarea
                id="cert"
                name="cert"
                placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-mono min-h-20 rounded-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="key" className="text-xs font-bold text-ink-secondary">{t("certs.key_label")}</Label>
              <Textarea
                id="key"
                name="key"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-mono min-h-20 rounded-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ca" className="text-xs font-bold text-ink-secondary">{t("certs.ca_label")}</Label>
              <Textarea
                id="ca"
                name="ca"
                placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-mono min-h-20 rounded-sm"
              />
            </div>

            <Button type="submit" className="bg-primary hover:bg-primary-deep text-primary-foreground text-xs font-semibold h-9 rounded-sm px-4">
              <PlusCircle className="size-3.5 mr-1.5" />
              {t("certs.upload_btn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Revoke Certificate */}
      <Card className="bg-canvas border border-destructive/20 rounded-lg p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-destructive">{t("certs.remove_btn")}</CardTitle>
          <CardDescription className="text-xs text-ink-mute">Revoke or delete an existing certificate by ID.</CardDescription>
        </CardHeader>
        <Separator className="bg-hairline my-4" />
        <CardContent className="px-0">
          <form action={deleteCertificateAction} className="space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="space-y-1.5">
              <Label htmlFor="certId" className="text-xs font-bold text-ink-secondary">{t("certs.cert_id_label")}</Label>
              <Input
                id="certId"
                name="certId"
                placeholder={t("certs.cert_id_placeholder")}
                required
                className="bg-canvas-soft border-hairline focus:border-primary focus:ring-0 text-xs font-medium h-9 rounded-sm"
              />
            </div>
            <Button type="submit" className="bg-destructive hover:bg-destructive-deep text-white text-xs font-semibold h-9 rounded-sm px-4">
              <Trash2 className="size-3.5 mr-1.5" />
              {t("certs.remove_btn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
