import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { fetchCandles, type CandleBar } from "../../services/marketData";

interface Props {
  candles?: CandleBar[];
  symbol: string;
  interval?: string;
  height?: number;
}

export default function CandlestickChart({
  candles: propCandles,
  symbol,
  interval = "1d",
  height = 420,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // If candles aren't provided directly as props, fetch them automatically
  const { data: fetchedData } = useQuery({
    queryKey: ["candles", symbol, interval],
    queryFn: () => fetchCandles(symbol, interval),
    enabled: !propCandles,
    staleTime: 60000,
  });

  const candles = propCandles || fetchedData?.candles || [];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#a1a1aa",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#D4F938", labelBackgroundColor: "#18181b" },
        horzLine: { color: "#D4F938", labelBackgroundColor: "#18181b" },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        textColor: "#a1a1aa",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: Math.round(height * 0.85),
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    // Volume histogram in lower panel
    const volumeSeries = chart.addHistogramSeries({
      color: "rgba(59, 130, 246, 0.25)",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Hardware-accelerated smooth chart resize observer with RAF debouncing
    let chartResizeRaf: number | null = null;
    let lastWidth = 0;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const roundedW = Math.floor(entries[0].contentRect.width);
      if (roundedW <= 0 || roundedW === lastWidth) return;
      lastWidth = roundedW;

      if (chartResizeRaf) cancelAnimationFrame(chartResizeRaf);
      chartResizeRaf = requestAnimationFrame(() => {
        if (chartRef.current) {
          chartRef.current.applyOptions({ width: roundedW });
        }
      });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      if (chartResizeRaf) cancelAnimationFrame(chartResizeRaf);
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [height]);

  // Update data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles.length) return;

    const candleData: CandlestickData[] = candles.map((c) => ({
      time: (new Date(c.ts).getTime() / 1000) as unknown as CandlestickData["time"],
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData: HistogramData[] = candles.map((c) => ({
      time: (new Date(c.ts).getTime() / 1000) as unknown as HistogramData["time"],
      value: c.volume,
      color: c.close >= c.open ? "#3fb95040" : "#f8514940",
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return (
    <div ref={chartContainerRef} className="w-full rounded-b-lg overflow-hidden" style={{ height }} />
  );
}
