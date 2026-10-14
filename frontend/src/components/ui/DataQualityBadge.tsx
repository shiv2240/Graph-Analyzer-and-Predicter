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
    <div className={`flex items-center gap-3 text-2xs ${className ?? ""}`}>
      {/* Source */}
      <span className="flex items-center gap-1 text-text-muted">
        <Database size={10} />
        {activeQuality.source}
      </span>

      {/* Delay status */}
      {activeQuality.isDelayed ? (
        <span className="flex items-center gap-1 text-yellow-400/80">
          <WifiOff size={10} />
          Delayed {activeQuality.delayMinutes ? `~${activeQuality.delayMinutes}min` : ""}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-market-up">
          <Wifi size={10} />
          Real-time
        </span>
      )}

      {/* Cached indicator */}
      {activeQuality.isCached && (
        <span className="text-text-muted">(cached)</span>
      )}

      {/* Timestamp */}
      <span className="flex items-center gap-1 text-text-muted">
        <Clock size={10} />
        {age}
      </span>
    </div>
  );
}

export default DataQualityBadge;

