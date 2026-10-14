import clsx from "clsx";

// Loading skeleton
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} />;
}

// Loading state wrapper
export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <LoadingSpinner size={26} />
      <p className="text-text-muted text-xs font-medium">{message}</p>
    </div>
  );
}

// Error state
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-market-down-subtle flex items-center justify-center">
        <span className="text-market-down text-xl">!</span>
      </div>
      <p className="text-text-secondary text-sm max-w-xs">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-xs mt-1">
          Try again
        </button>
      )}
    </div>
  );
}

// Empty state
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
      <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center text-text-muted text-xl">
        ∅
      </div>
      <p className="text-text-primary text-sm font-medium">{title}</p>
      {description && (
        <p className="text-text-secondary text-xs max-w-xs">{description}</p>
      )}
    </div>
  );
}

// Unavailable state (provider limitation)
export function UnavailableState({ reason }: { reason: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-yellow-400/70 bg-yellow-400/5 border border-yellow-400/20 rounded-md px-3 py-2">
      <span>⚠</span>
      <span>{reason}</span>
    </div>
  );
}

// Loading spinner
export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="border-2 border-surface-3 border-t-accent-blue rounded-full animate-spin"
      style={{ width: size, height: size }}
    />
  );
}
