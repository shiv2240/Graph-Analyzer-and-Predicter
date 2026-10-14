import { Clock, Database, Wifi, WifiOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DataQuality } from "@/services/marketData";

interface Props {
  dataQuality?: DataQuality;
  quality?: DataQuality;
  className?: string;
}

export function DataQualityBadge({ dataQuality, quality, className }: Props) {
  const activeQuality = quality || dataQuality;
  if (!activeQuality) return null;
  const lastRefreshed = new Date(activeQuality.lastRefreshed);
  const age = formatDistanceToNow(lastRefreshed, { addSuffix: true });

  return (
    <div className={`flex items-center gap-2.5 text-2xs whitespace-nowrap shrink-0 ${className ?? ""}`}>
      {/* Source */}
      <span className="flex items-center gap-1 text-text-muted whitespace-nowrap">
        <Database size={10} />
        {activeQuality.source}
      </span>

      {/* Delay status */}
      {activeQuality.isDelayed ? (
        <span className="flex items-center gap-1 text-amber-400/90 whitespace-nowrap font-medium">
          <WifiOff size={10} />
          Delayed {activeQuality.delayMinutes ? `~${activeQuality.delayMinutes}m` : ""}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-market-up whitespace-nowrap font-medium">
          <Wifi size={10} />
          Live
        </span>
      )}

      {/* Cached indicator */}
      {activeQuality.isCached && (
        <span className="text-text-muted/70 whitespace-nowrap">(cached)</span>
      )}

      {/* Timestamp */}
      <span className="flex items-center gap-1 text-text-muted whitespace-nowrap">
        <Clock size={10} />
        {age}
      </span>
    </div>
  );
}

export default DataQualityBadge;

