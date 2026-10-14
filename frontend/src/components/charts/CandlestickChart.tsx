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
        background: { type: ColorType.Solid, color: "#161b22" },
        textColor: "#7d8590",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: "#21262d" },
        horzLines: { color: "#21262d" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#4493f8", labelBackgroundColor: "#4493f8" },
        horzLine: { color: "#4493f8", labelBackgroundColor: "#4493f8" },
      },
      rightPriceScale: {
        borderColor: "#30363d",
        textColor: "#7d8590",
      },
      timeScale: {
        borderColor: "#30363d",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: Math.round(height * 0.85),
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#3fb950",
      downColor: "#f85149",
      borderUpColor: "#3fb950",
      borderDownColor: "#f85149",
      wickUpColor: "#3fb950",
      wickDownColor: "#f85149",
    });

    // Volume histogram in lower panel
    const volumeSeries = chart.addHistogramSeries({
      color: "#4493f820",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
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
