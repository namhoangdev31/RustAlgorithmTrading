import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, X } from "lucide-react";

interface WebhookPayloadModalProps {
  log: any;
  returnTo: string;
  locale: string;
}

export function WebhookPayloadModal({ log, returnTo, locale }: WebhookPayloadModalProps) {
  if (!log) return null;

  const payloadString = log.payload 
    ? (typeof log.payload === "string" ? log.payload : JSON.stringify(log.payload, null, 2))
    : JSON.stringify({ 
        info: "No detailed payload body recorded for this event tag.",
        event: log.event || "push",
        message: log.message,
        timestamp: log.timestamp
      }, null, 2);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-canvas-night/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <Link href={returnTo} className="absolute inset-0 cursor-default" aria-hidden="true" />
      
      <Card className="w-full max-w-2xl bg-canvas border border-hairline rounded-lg shadow-dark relative z-10 overflow-hidden flex flex-col h-[500px] animate-in zoom-in-95 duration-200 py-0">
        <CardHeader className="px-5 py-4 border-b border-hairline bg-canvas-soft/40 flex items-center justify-between shrink-0">
          <div>
            <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
              <Terminal className="size-4 text-primary" />
              {locale === "vi" ? `Chi tiết Webhook — ${log.event || "event"}` : `Webhook Payload — ${log.event || "event"}`}
            </CardTitle>
            <CardDescription className="text-[10px] text-ink-mute mt-0.5 font-mono select-all">
              {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"} • Status: {log.statusCode || 200}
            </CardDescription>
          </div>
          
          <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-ink-mute hover:text-ink hover:bg-canvas-soft cursor-pointer">
            <Link href={returnTo}>
              <X className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 bg-black text-emerald-400 font-mono text-xs p-5 overflow-y-auto select-text selection:bg-emerald-950/80">
          <pre className="whitespace-pre-wrap break-all leading-relaxed">{payloadString}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
