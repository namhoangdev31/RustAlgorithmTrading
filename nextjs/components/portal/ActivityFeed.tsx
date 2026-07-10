import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export type ActivityItem = {
  id: string;
  actorName: string;
  action: string;
  resourceName: string;
  timestamp: Date | string;
  metadata?: Record<string, any>;
};

type ActivityFeedProps = {
  items: ActivityItem[];
  className?: string;
};

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">
        No recent activity.
      </div>
    );
  }

  return (
    <div className={cn("flow-root", className)}>
      <ul className="-mb-8">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const timeAgo = formatDistanceToNow(new Date(item.timestamp), {
            addSuffix: true,
          });

          return (
            <li key={item.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-hairline"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="flex items-center justify-center size-8 rounded-full bg-secondary text-muted-foreground ring-8 ring-card">
                      <span className="text-[10px] font-semibold font-mono">
                        {item.actorName.slice(0, 2).toUpperCase()}
                      </span>
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-body-sm text-foreground">
                        <span className="font-semibold text-foreground">
                          {item.actorName}
                        </span>{" "}
                        {item.action}{" "}
                        <span className="font-medium text-foreground">
                          {item.resourceName}
                        </span>
                      </p>
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <p className="mt-1 text-[10px] text-muted-foreground font-mono">
                          {JSON.stringify(item.metadata)}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs whitespace-nowrap text-muted-foreground">
                      <time dateTime={new Date(item.timestamp).toISOString()}>
                        {timeAgo}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
