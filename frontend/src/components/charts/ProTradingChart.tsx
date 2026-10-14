import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type BarData,
  type LineData,
  type AreaData,
  type HistogramData,
} from "lightweight-charts";
import {
  CandlestickChart as CandleIcon,
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  Maximize2,
  RotateCcw,
  Table,
  Sliders,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CandleBar } from "../../services/marketData";
import { useLiveMarketStream } from "../../services/liveStreamService";

export type ChartType = "candlestick" | "bar" | "area" | "line" | "baseline";

interface ProTradingChartProps {
  candles: CandleBar[];
  symbol: string;
  interval: string;
  onIntervalChange: (newInterval: string) => void;
  currency?: string;
  onOpenDataTable?: () => void;
  className?: string;
}

export default function ProTradingChart({
  candles,
  symbol,
  interval,
  onIntervalChange,
  currency = "USD",
  onOpenDataTable,
  className = "",
}: ProTradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Series references
  const mainSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sma200SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Chart configuration state
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [showVolume, setShowVolume] = useState(true);
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(false);
  const [showBB, setShowBB] = useState(true);

  // Connect to Real-time Live Market Stream (Binance 24/7 WS for crypto, Interbank engine for forex)
  const { currentTick, isLive, streamSource } = useLiveMarketStream({
    symbol,
    interval,
    initialCandles: candles,
  });

  // Crosshair HUD state
  const [hudData, setHudData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    changePct: number;
  } | null>(null);

  // Latest candle default HUD with real-time live tick priority
  const latestCandle = candles[candles.length - 1];
  const activeHud = hudData || (currentTick ? {
    time: new Date(currentTick.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    open: currentTick.open,
    high: currentTick.high,
    low: currentTick.low,
    close: currentTick.close,
    volume: currentTick.volume,
    changePct: currentTick.changePct,
  } : latestCandle ? {
    time: new Date(latestCandle.ts).toLocaleString(),
    open: latestCandle.open,
    high: latestCandle.high,
    low: latestCandle.low,
    close: latestCandle.close,
    volume: latestCandle.volume,
    changePct: latestCandle.open ? ((latestCandle.close - latestCandle.open) / latestCandle.open) * 100 : 0,
  } : null);

  const TIMEFRAMES = [
    { id: "1m", label: "1m" },
    { id: "5m", label: "5m" },
    { id: "15m", label: "15m" },
    { id: "30m", label: "30m" },
    { id: "1h", label: "1H" },
    { id: "1d", label: "1D" },
    { id: "1wk", label: "1W" },
    { id: "1mo", label: "1M" },
  ];

  // Helper mathematical indicator calculators
  const processedData = useMemo(() => {
    if (!candles || candles.length === 0) return { sorted: [], sma20: [], sma50: [], sma200: [], bbUpper: [], bbLower: [] };

    // Format and sort candles
    const sorted = [...candles]
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
      .map((c) => ({
        time: (Math.floor(new Date(c.ts).getTime() / 1000)) as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        ts: c.ts,
      }));

    // Deduplicate timestamps if any
    const uniqueSorted: typeof sorted = [];
    const seenTimes = new Set<number>();
    for (const item of sorted) {
      if (!seenTimes.has(item.time)) {
        seenTimes.add(item.time);
        uniqueSorted.push(item);
      }
    }

    // Compute SMA
    const computeSMA = (period: number) => {
      const res: LineData[] = [];
      for (let i = period - 1; i < uniqueSorted.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += uniqueSorted[i - j].close;
        res.push({ time: uniqueSorted[i].time, value: sum / period });
      }
      return res;
    };

    // Compute Bollinger Bands (20, 2)
    const computeBB = (period = 20, mult = 2) => {
      const upper: LineData[] = [];
      const lower: LineData[] = [];
      for (let i = period - 1; i < uniqueSorted.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += uniqueSorted[i - j].close;
        const mean = sum / period;
        let v = 0;
        for (let j = 0; j < period; j++) v += Math.pow(uniqueSorted[i - j].close - mean, 2);
        const std = Math.sqrt(v / period);
        upper.push({ time: uniqueSorted[i].time, value: mean + mult * std });
        lower.push({ time: uniqueSorted[i].time, value: mean - mult * std });
      }
      return { upper, lower };
    };

    const bb = computeBB(20, 2);

    return {
      sorted: uniqueSorted,
      sma20: computeSMA(20),
      sma50: computeSMA(50),
      sma200: computeSMA(200),
      bbUpper: bb.upper,
      bbLower: bb.lower,
    };
  }, [candles]);

  // Initialize TradingView Lightweight Chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0B0E14" },
        textColor: "#8A94A6",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#3B82F6",
          width: 1,
          style: 3,
          labelBackgroundColor: "#1E293B",
        },
        horzLine: {
          color: "#3B82F6",
          width: 1,
          style: 3,
          labelBackgroundColor: "#1E293B",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        textColor: "#94A3B8",
        scaleMargins: {
          top: 0.12,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: interval.includes("m"),
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    });

    chartRef.current = chart;

    // Volume histogram on secondary scale
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume-scale",
      color: "#3B82F6",
    });
    chart.priceScale("volume-scale").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Technical Overlays
    sma20SeriesRef.current = chart.addLineSeries({
      color: "#EAB308",
      lineWidth: 1,
      title: "SMA 20",
      crosshairMarkerVisible: false,
    });

    sma50SeriesRef.current = chart.addLineSeries({
      color: "#38BDF8",
      lineWidth: 1,
      title: "SMA 50",
      crosshairMarkerVisible: false,
    });

    sma200SeriesRef.current = chart.addLineSeries({
      color: "#A855F7",
      lineWidth: 1,
      title: "SMA 200",
      crosshairMarkerVisible: false,
    });

    bbUpperRef.current = chart.addLineSeries({
      color: "rgba(56, 189, 248, 0.5)",
      lineWidth: 1,
      lineStyle: 2,
      title: "BB Upper",
      crosshairMarkerVisible: false,
    });

    bbLowerRef.current = chart.addLineSeries({
      color: "rgba(56, 189, 248, 0.5)",
      lineWidth: 1,
      lineStyle: 2,
      title: "BB Lower",
      crosshairMarkerVisible: false,
    });

    // Crosshair move handler for live HUD
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHudData(null);
        return;
      }
      const data = mainSeriesRef.current ? (param.seriesData.get(mainSeriesRef.current) as any) : null;
      if (data) {
        const o = data.open ?? data.value;
        const c = data.close ?? data.value;
        const h = data.high ?? Math.max(o, c);
        const l = data.low ?? Math.min(o, c);
        const change = o ? ((c - o) / o) * 100 : 0;
        const vol = volumeSeriesRef.current ? ((param.seriesData.get(volumeSeriesRef.current) as any)?.value || 0) : 0;

        let dateStr = "";
        if (typeof param.time === "number") {
          dateStr = new Date(param.time * 1000).toLocaleString();
        } else if (typeof param.time === "object") {
          dateStr = `${(param.time as any).year}-${(param.time as any).month}-${(param.time as any).day}`;
        }

        setHudData({
          time: dateStr,
          open: o,
          high: h,
          low: l,
          close: c,
          volume: vol,
          changePct: change,
        });
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Re-create or switch main series based on chartType
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (mainSeriesRef.current) {
      try {
        chart.removeSeries(mainSeriesRef.current);
      } catch (e) {
        // ignore
      }
    }

    if (chartType === "candlestick") {
      mainSeriesRef.current = chart.addCandlestickSeries({
        upColor: "#10B981",
        downColor: "#EF4444",
        borderUpColor: "#10B981",
        borderDownColor: "#EF4444",
        wickUpColor: "#10B981",
        wickDownColor: "#EF4444",
      });
    } else if (chartType === "bar") {
      mainSeriesRef.current = chart.addBarSeries({
        upColor: "#10B981",
        downColor: "#EF4444",
      });
    } else if (chartType === "area") {
      mainSeriesRef.current = chart.addAreaSeries({
        topColor: "rgba(59, 130, 246, 0.4)",
        bottomColor: "rgba(59, 130, 246, 0.0)",
        lineColor: "#3B82F6",
        lineWidth: 2,
      });
    } else if (chartType === "line") {
      mainSeriesRef.current = chart.addLineSeries({
        color: "#3B82F6",
        lineWidth: 2,
      });
    } else if (chartType === "baseline") {
      mainSeriesRef.current = chart.addBaselineSeries({
        baseValue: { type: "price", price: processedData.sorted[0]?.close || 0 },
        topFillColor1: "rgba(16, 185, 129, 0.28)",
        topFillColor2: "rgba(16, 185, 129, 0.05)",
        topLineColor: "rgba(16, 185, 129, 1)",
        bottomFillColor1: "rgba(239, 68, 68, 0.05)",
        bottomFillColor2: "rgba(239, 68, 68, 0.28)",
        bottomLineColor: "rgba(239, 68, 68, 1)",
      });
    }

    // Push data to main series
    if (processedData.sorted.length > 0 && mainSeriesRef.current) {
      if (chartType === "candlestick" || chartType === "bar") {
        mainSeriesRef.current.setData(processedData.sorted);
      } else {
        mainSeriesRef.current.setData(
          processedData.sorted.map((c) => ({ time: c.time, value: c.close }))
        );
      }
    }
  }, [chartType, processedData]);

  // Update volume and indicator series data
  useEffect(() => {
    if (!chartRef.current || processedData.sorted.length === 0) return;

    if (volumeSeriesRef.current) {
      if (showVolume) {
        const volumeData: HistogramData[] = processedData.sorted.map((c) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)",
        }));
        volumeSeriesRef.current.setData(volumeData);
      } else {
        volumeSeriesRef.current.setData([]);
      }
    }

    if (sma20SeriesRef.current) {
      sma20SeriesRef.current.setData(showSMA20 ? processedData.sma20 : []);
    }
    if (sma50SeriesRef.current) {
      sma50SeriesRef.current.setData(showSMA50 ? processedData.sma50 : []);
    }
    if (sma200SeriesRef.current) {
      sma200SeriesRef.current.setData(showSMA200 ? processedData.sma200 : []);
    }
    if (bbUpperRef.current) {
      bbUpperRef.current.setData(showBB ? processedData.bbUpper : []);
    }
    if (bbLowerRef.current) {
      bbLowerRef.current.setData(showBB ? processedData.bbLower : []);
    }
  }, [processedData, showVolume, showSMA20, showSMA50, showSMA200, showBB]);

  // ── Push Live Real-Time Ticks into the Active Candle on the Chart ──────────
  useEffect(() => {
    if (!currentTick || !mainSeriesRef.current || processedData.sorted.length === 0) return;

    const lastCandle = processedData.sorted[processedData.sorted.length - 1];
    const lastTime = lastCandle ? Number(lastCandle.time) : 0;
    const tickTime = Math.max(Number(currentTick.time), lastTime);

    try {
      if (chartType === "candlestick" || chartType === "bar") {
        mainSeriesRef.current.update({
          time: tickTime as any,
          open: currentTick.open,
          high: currentTick.high,
          low: currentTick.low,
          close: currentTick.close,
        });
      } else {
        mainSeriesRef.current.update({
          time: tickTime as any,
          value: currentTick.close,
        });
      }

      if (volumeSeriesRef.current && showVolume) {
        volumeSeriesRef.current.update({
          time: tickTime as any,
          value: currentTick.volume,
          color: currentTick.close >= currentTick.open ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)",
        });
      }
    } catch (err) {
      console.debug("Live tick chart update skipped:", err);
    }
  }, [currentTick, chartType, showVolume, processedData.sorted]);

  const handleFitContent = () => {
    chartRef.current?.timeScale().fitContent();
  };

  return (
    <div className={`flex flex-col bg-[#0B0E14] border border-border/80 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* ── Top Professional Trading Toolbar ─────────────────────────────────── */}
      <div className="p-3 bg-[#111622] border-b border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Timeframe Intervals & Chart Type & Live Stream Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Market Pulsing Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
              {streamSource === "binance_ws" ? "LIVE BINANCE 24/7" : "LIVE INTERBANK"}
            </span>
            {currentTick && (
              <span className="font-mono text-[11px] font-extrabold text-white ml-0.5">
                {currency === "INR" || symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "₹" : "$"}{currentTick.price.toFixed(currentTick.price < 10 ? 4 : 2)}
              </span>
            )}
          </div>

          <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />
          {/* Timeframes */}
          <div className="flex items-center bg-surface-2/80 rounded-xl p-1 border border-border/60">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => onIntervalChange(tf.id)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold text-xs transition-all ${
                  interval === tf.id
                    ? "bg-brand text-white shadow-md"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-3"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* Chart Type Selector */}
          <div className="flex items-center bg-surface-2/80 rounded-xl p-1 border border-border/60">
            {[
              { id: "candlestick", label: "Candle", icon: CandleIcon },
              { id: "bar", label: "Bars", icon: BarChart2 },
              { id: "area", label: "Area", icon: Activity },
              { id: "line", label: "Line", icon: TrendingUp },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChartType(t.id as ChartType)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartType === t.id
                      ? "bg-brand text-white shadow-md"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-3"
                  }`}
                  title={`${t.label} Chart`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Technical Overlays, Data Inspector & Zoom */}
        <div className="flex items-center gap-2">
          {/* Overlay toggles dropdown or buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSMA20(!showSMA20)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors border ${
                showSMA20
                  ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                  : "bg-surface-2/40 text-text-muted border-border/40"
              }`}
            >
              SMA20
            </button>
            <button
              type="button"
              onClick={() => setShowSMA50(!showSMA50)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors border ${
                showSMA50
                  ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                  : "bg-surface-2/40 text-text-muted border-border/40"
              }`}
            >
              SMA50
            </button>
            <button
              type="button"
              onClick={() => setShowBB(!showBB)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors border ${
                showBB
                  ? "bg-brand/15 text-brand border-brand/30"
                  : "bg-surface-2/40 text-text-muted border-border/40"
              }`}
            >
              BBands
            </button>
            <button
              type="button"
              onClick={() => setShowVolume(!showVolume)}
              className={`p-1.5 rounded-lg text-xs transition-colors border ${
                showVolume
                  ? "bg-surface-3 text-text-primary border-border"
                  : "bg-surface-2/40 text-text-muted border-border/40"
              }`}
              title="Toggle Volume"
            >
              {showVolume ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="h-5 w-px bg-border/60 mx-1" />

          {/* Table Data Inspector Button */}
          {onOpenDataTable && (
            <button
              type="button"
              onClick={onOpenDataTable}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2/80 hover:bg-surface-3 border border-border/60 text-xs font-medium text-text-secondary hover:text-text-primary transition-all"
              title="Open Complete Candle Data Table"
            >
              <Table className="h-3.5 w-3.5 text-brand" />
              <span className="hidden sm:inline">Data Table</span>
            </button>
          )}

          {/* Reset Zoom */}
          <button
            type="button"
            onClick={handleFitContent}
            className="p-1.5 rounded-lg bg-surface-2/80 hover:bg-surface-3 border border-border/60 text-text-muted hover:text-text-primary transition-all"
            title="Fit Chart to Content"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Live Crosshair HUD (OHLCV Legend) ─────────────────────────────────── */}
      <div className="px-4 py-2 bg-[#0E131E] border-b border-border/40 flex flex-wrap items-center justify-between text-xs font-mono gap-2 text-text-muted">
        <div className="flex items-center gap-3">
          <span className="text-text-primary font-bold">{symbol}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-3 text-text-secondary uppercase">
            {interval}
          </span>
          {activeHud && <span className="text-[11px] text-text-muted">{activeHud.time}</span>}
        </div>

        {activeHud && (
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs">
            <div>
              <span className="text-text-muted mr-1">O:</span>
              <span className="text-text-primary font-bold">
                {activeHud.open?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-text-muted mr-1">H:</span>
              <span className="text-positive font-bold">
                {activeHud.high?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-text-muted mr-1">L:</span>
              <span className="text-negative font-bold">
                {activeHud.low?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-text-muted mr-1">C:</span>
              <span className="text-text-primary font-bold">
                {activeHud.close?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-text-muted mr-1">Chg:</span>
              <span
                className={`font-bold ${
                  activeHud.changePct >= 0 ? "text-positive" : "text-negative"
                }`}
              >
                {activeHud.changePct >= 0 ? "+" : ""}
                {activeHud.changePct?.toFixed(2)}%
              </span>
            </div>
            {showVolume && activeHud.volume > 0 && (
              <div className="hidden lg:block">
                <span className="text-text-muted mr-1">Vol:</span>
                <span className="text-text-primary">{activeHud.volume?.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main Canvas Viewport ────────────────────────────────────────────── */}
      <div className="relative w-full h-[520px]">
        {candles.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted space-y-2">
            <div className="h-6 w-6 border-2 border-brand/20 border-t-brand animate-spin rounded-full" />
            <span className="text-xs">Loading {interval} real-time chart candles...</span>
          </div>
        ) : null}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
