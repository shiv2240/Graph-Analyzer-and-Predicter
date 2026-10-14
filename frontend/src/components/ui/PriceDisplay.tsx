import clsx from "clsx";

interface Props {
  value: number | null | undefined;
  showSign?: boolean;
  suffix?: string;
  className?: string;
  colorize?: boolean;
}

export function PriceChange({ value, showSign = true, suffix = "%", className, colorize = true }: Props) {
  if (value == null) return <span className="text-text-muted">—</span>;

  const isUp = value > 0;
  const isDown = value < 0;

  return (
    <span
      className={clsx(
        "font-mono text-sm font-medium",
        colorize && isUp && "text-market-up",
        colorize && isDown && "text-market-down",
        colorize && !isUp && !isDown && "text-text-secondary",
        className
      )}
    >
      {showSign && isUp && "+"}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}

export function Price({
  value,
  currency = "",
  decimals = 2,
  className,
}: {
  value: number | null | undefined;
  currency?: string;
  decimals?: number;
  className?: string;
}) {
  if (value == null) return <span className="text-text-muted font-mono">—</span>;
  return (
    <span className={clsx("font-mono font-semibold", className)}>
      {currency && <span className="text-text-muted text-xs mr-0.5">{currency}</span>}
      {value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

export default function PriceDisplay({
  price,
  changeAbs,
  changePct,
  currency = "",
}: {
  price?: number | null;
  changeAbs?: number | null;
  changePct?: number | null;
  currency?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <Price value={price} currency={currency} />
      <PriceChange value={changePct} />
    </div>
  );
}

