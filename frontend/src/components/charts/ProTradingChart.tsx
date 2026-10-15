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
  Pencil,
  Minus,
  Square,
  MousePointer,
  ChevronDown,
  Trash2,
  Undo2,
  Palette,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CandleBar } from "../../services/marketData";
import { useLiveMarketStream, isMarketOpen } from "../../services/liveStreamService";

export type ChartType = "candlestick" | "bar" | "area" | "line" | "baseline";
export type DrawingTool = "cursor" | "pencil" | "line" | "rect";

export interface DrawingItem {
  id: string;
  type: "pencil" | "line" | "rect";
  color: string;
  width: number;
  points?: { x: number; y: number }[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

function renderCanvasDrawings(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  drawings: DrawingItem[],
  inProgress?: DrawingItem | null
) {
  ctx.clearRect(0, 0, width, height);

  const drawShape = (item: DrawingItem) => {
    ctx.save();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = item.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (item.type === "pencil" && item.points && item.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(item.points[0].x, item.points[0].y);
      for (let i = 1; i < item.points.length; i++) {
        ctx.lineTo(item.points[i].x, item.points[i].y);
      }
      ctx.stroke();
    } else if (
      item.type === "line" &&
      item.x1 !== undefined &&
      item.y1 !== undefined &&
      item.x2 !== undefined &&
      item.y2 !== undefined
    ) {
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1);
      ctx.lineTo(item.x2, item.y2);
      ctx.stroke();

      // Nodes on endpoints
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.x1, item.y1, Math.max(3, item.width + 1), 0, Math.PI * 2);
      ctx.arc(item.x2, item.y2, Math.max(3, item.width + 1), 0, Math.PI * 2);
      ctx.fill();
    } else if (
      item.type === "rect" &&
      item.x1 !== undefined &&
      item.y1 !== undefined &&
      item.x2 !== undefined &&
      item.y2 !== undefined
    ) {
      const x = Math.min(item.x1, item.x2);
      const y = Math.min(item.y1, item.y2);
      const w = Math.abs(item.x2 - item.x1);
      const h = Math.abs(item.y2 - item.y1);

      // Semi-transparent fill for order block / zone
      ctx.fillStyle = `${item.color}2e`;
      ctx.fillRect(x, y, w, h);

      // Border outline
      ctx.strokeRect(x, y, w, h);

      // Corner handles
      ctx.fillStyle = item.color;
      const handleSize = 4;
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
    }
    ctx.restore();
  };

  drawings.forEach(drawShape);
  if (inProgress) {
    drawShape(inProgress);
  }
}

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

  const isMarketActive = useMemo(() => isMarketOpen(symbol), [symbol]);

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
    { id: "1y", label: "1Y" },
    { id: "5y", label: "5Y" },
    { id: "all", label: "ALL" },
  ];

  // ── Investor Analysis Drawing Tools State ─────────────────────────────────
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>("cursor");
  const [drawingColor, setDrawingColor] = useState<string>("#22c55e");
  const [drawingWidth, setDrawingWidth] = useState<number>(2.5);
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [inProgressDrawing, setInProgressDrawing] = useState<DrawingItem | null>(null);
  const [isDrawingDropdownOpen, setIsDrawingDropdownOpen] = useState(false);

  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingMenuRef = useRef<HTMLDivElement | null>(null);
  const isMouseDownRef = useRef(false);

  // Redraw whenever drawings or inProgressDrawing changes
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderCanvasDrawings(ctx, canvas.width, canvas.height, drawings, inProgressDrawing);
  }, [drawings, inProgressDrawing]);

  // Sync canvas dimensions with parent element
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          renderCanvasDrawings(ctx, canvas.width, canvas.height, drawings, inProgressDrawing);
        }
      }
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [drawings, inProgressDrawing]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawingMenuRef.current && !drawingMenuRef.current.contains(e.target as Node)) {
        setIsDrawingDropdownOpen(false);
      }
    };
    if (isDrawingDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDrawingDropdownOpen]);

  // Keyboard shortcut: Esc to switch back to cursor mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDrawingTool("cursor");
        setIsDrawingDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeDrawingTool === "cursor") return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isMouseDownRef.current = true;

    if (activeDrawingTool === "pencil") {
      setInProgressDrawing({
        id: Math.random().toString(36).slice(2),
        type: "pencil",
        color: drawingColor,
        width: drawingWidth,
        points: [{ x, y }],
      });
    } else if (activeDrawingTool === "line") {
      setInProgressDrawing({
        id: Math.random().toString(36).slice(2),
        type: "line",
        color: drawingColor,
        width: drawingWidth,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
      });
    } else if (activeDrawingTool === "rect") {
      setInProgressDrawing({
        id: Math.random().toString(36).slice(2),
        type: "rect",
        color: drawingColor,
        width: drawingWidth,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current || !inProgressDrawing) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (inProgressDrawing.type === "pencil") {
      setInProgressDrawing((prev) =>
        prev
          ? {
              ...prev,
              points: [...(prev.points || []), { x, y }],
            }
          : null
      );
    } else if (inProgressDrawing.type === "line" || inProgressDrawing.type === "rect") {
      setInProgressDrawing((prev) =>
        prev
          ? {
              ...prev,
              x2: x,
              y2: y,
            }
          : null
      );
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    if (inProgressDrawing) {
      if (
        (inProgressDrawing.type === "pencil" && inProgressDrawing.points && inProgressDrawing.points.length > 1) ||
        (inProgressDrawing.type === "line" && (inProgressDrawing.x1 !== inProgressDrawing.x2 || inProgressDrawing.y1 !== inProgressDrawing.y2)) ||
        (inProgressDrawing.type === "rect" && Math.abs((inProgressDrawing.x2 ?? 0) - (inProgressDrawing.x1 ?? 0)) > 3)
      ) {
        setDrawings((prev) => [...prev, inProgressDrawing]);
      }
      setInProgressDrawing(null);
    }
  };

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
    if (!lastCandle) return;
    const lastTime = Number(lastCandle.time);

    // Only allow appending a brand new bar if it comes from an authentic 24/7 Binance WebSocket
    // For traditional equities/commodities/forex, strictly update the latest candle in place
    // to prevent artificial time gaps and floating disconnected candles
    const isBinanceNew = currentTick.isNewCandle && streamSource === "binance_ws";
    const tickTime = isBinanceNew ? currentTick.time : lastTime;

    try {
      if (chartType === "candlestick" || chartType === "bar") {
        mainSeriesRef.current.update({
          time: tickTime as any,
          open: isBinanceNew ? currentTick.open : lastCandle.open,
          high: isBinanceNew ? currentTick.high : Math.max(lastCandle.high, currentTick.high),
          low: isBinanceNew ? currentTick.low : Math.min(lastCandle.low, currentTick.low),
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
          value: isBinanceNew ? currentTick.volume : Math.max(lastCandle.volume, currentTick.volume),
          color: currentTick.close >= (isBinanceNew ? currentTick.open : lastCandle.open)
            ? "rgba(16, 185, 129, 0.35)"
            : "rgba(239, 68, 68, 0.35)",
        });
      }
    } catch (err) {
      console.debug("Live tick chart update skipped:", err);
    }
  }, [currentTick, chartType, showVolume, processedData.sorted, streamSource]);

  const handleFitContent = () => {
    chartRef.current?.timeScale().fitContent();
  };

  return (
    <div className={`flex flex-col bg-[#0B0E14] border border-border/80 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* ── Top Professional Trading Toolbar ─────────────────────────────────── */}
      <div className="p-3 bg-[#111622] border-b border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Timeframe Intervals & Chart Type & Live Stream Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Market / Exchange Status Badge */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-colors ${
              streamSource === "binance_ws"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : isMarketActive
                ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                : "bg-surface-2 border-border/80 text-text-muted"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {streamSource === "binance_ws" || isMarketActive ? (
                <>
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      streamSource === "binance_ws" ? "bg-emerald-400" : "bg-sky-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      streamSource === "binance_ws" ? "bg-emerald-500" : "bg-sky-500"
                    }`}
                  ></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-text-muted opacity-60"></span>
              )}
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
              {streamSource === "binance_ws"
                ? "LIVE BINANCE 24/7"
                : isMarketActive
                ? "EXCHANGE ACTIVE"
                : "MARKET CLOSED"}
            </span>
            {currentTick && (
              <span className="font-mono text-[11px] font-extrabold text-white ml-0.5">
                {currency === "INR" || symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "₹" : "$"}
                {currentTick.price.toFixed(currentTick.price < 10 ? 4 : 2)}
              </span>
            )}
          </div>

          <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />
          {/* Timeframes */}
          <div className="flex items-center bg-surface-2/80 rounded-xl p-1 border border-border/60 overflow-x-auto max-w-[430px] scrollbar-none">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => onIntervalChange(tf.id)}
                className={`px-2 py-1 rounded-lg font-mono font-semibold text-xs transition-all shrink-0 ${
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

          <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* Technical Drawing & Annotation Tools Dropdown */}
          <div className="relative" ref={drawingMenuRef}>
            <button
              type="button"
              onClick={() => setIsDrawingDropdownOpen(!isDrawingDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium transition-all ${
                activeDrawingTool !== "cursor"
                  ? "bg-brand text-white border-brand shadow-sm"
                  : isDrawingDropdownOpen
                  ? "bg-surface-3 text-text-primary border-border"
                  : "bg-surface-2/80 text-text-muted hover:text-text-primary border-border/60 hover:bg-surface-3"
              }`}
              title="Chart Analysis & Drawing Tools (Pencil, Line, Rectangle)"
            >
              {activeDrawingTool === "cursor" && <MousePointer className="h-3.5 w-3.5 text-text-muted" />}
              {activeDrawingTool === "pencil" && <Pencil className="h-3.5 w-3.5" />}
              {activeDrawingTool === "line" && <Minus className="h-3.5 w-3.5 stroke-[3]" />}
              {activeDrawingTool === "rect" && <Square className="h-3.5 w-3.5" />}
              
              <span>
                {activeDrawingTool === "cursor" && "Draw Tools"}
                {activeDrawingTool === "pencil" && "Pencil"}
                {activeDrawingTool === "line" && "Line"}
                {activeDrawingTool === "rect" && "Rectangle"}
              </span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isDrawingDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu Modal */}
            {isDrawingDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-[#111622] border border-border/80 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-md">
                <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted px-1.5 pb-2 font-bold flex items-center justify-between border-b border-border/50">
                  <span>Investor Drawing Tools</span>
                  {drawings.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-brand font-bold">
                      {drawings.length} mark{drawings.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Tool Selection Buttons */}
                <div className="space-y-1 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDrawingTool("cursor");
                      setIsDrawingDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      activeDrawingTool === "cursor"
                        ? "bg-brand text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-3.5 w-3.5" />
                      <span>Cursor / Pan & Zoom</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-mono">Normal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDrawingTool("pencil");
                      setIsDrawingDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      activeDrawingTool === "pencil"
                        ? "bg-brand text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Pencil (Freehand)</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-mono">Sketch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDrawingTool("line");
                      setIsDrawingDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      activeDrawingTool === "line"
                        ? "bg-brand text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Minus className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Line (Trendline / Ray)</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-mono">Ray</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDrawingTool("rect");
                      setIsDrawingDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      activeDrawingTool === "rect"
                        ? "bg-brand text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Square className="h-3.5 w-3.5" />
                      <span>Square / Rectangle</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-mono">Zone</span>
                  </button>
                </div>

                {/* Color Selector */}
                <div className="border-t border-border/50 pt-2.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted px-1.5 mb-1.5 flex items-center justify-between">
                    <span>Stroke Color</span>
                    <span className="h-2 w-2 rounded-full ring-1 ring-white/50" style={{ backgroundColor: drawingColor }} />
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 bg-surface-2/60 rounded-xl">
                    {[
                      { color: "#22c55e", label: "Green" },
                      { color: "#06b6d4", label: "Cyan" },
                      { color: "#eab308", label: "Yellow" },
                      { color: "#f43f5e", label: "Red" },
                      { color: "#a855f7", label: "Purple" },
                      { color: "#ffffff", label: "White" },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setDrawingColor(c.color)}
                        className={`h-5 w-5 rounded-full transition-transform ${
                          drawingColor === c.color ? "scale-125 ring-2 ring-white/80 shadow-md" : "hover:scale-110 opacity-70"
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Stroke Width Selector */}
                <div className="border-t border-border/50 pt-2.5 mt-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted px-1.5 mb-1.5">
                    Line Width
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { width: 1.5, label: "Fine" },
                      { width: 2.5, label: "Medium" },
                      { width: 4.5, label: "Bold" },
                    ].map((w) => (
                      <button
                        key={w.width}
                        type="button"
                        onClick={() => setDrawingWidth(w.width)}
                        className={`py-1 rounded-lg text-[11px] font-mono text-center transition-colors ${
                          drawingWidth === w.width
                            ? "bg-brand/20 text-brand font-bold border border-brand/40"
                            : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions: Undo & Clear */}
                <div className="border-t border-border/50 pt-2.5 mt-2.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDrawings((prev) => prev.slice(0, -1));
                    }}
                    disabled={drawings.length === 0}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-medium bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed border border-border/60 transition-colors"
                  >
                    <Undo2 className="h-3 w-3" />
                    <span>Undo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawings([]);
                    }}
                    disabled={drawings.length === 0}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-500/20 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>
            )}
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

        {/* Interactive Drawing Overlay Canvas */}
        <canvas
          ref={drawingCanvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className={`absolute inset-0 z-10 ${
            activeDrawingTool === "cursor" ? "pointer-events-none" : "pointer-events-auto cursor-crosshair"
          }`}
        />

        {/* Floating Active Drawing Mode Bar */}
        {activeDrawingTool !== "cursor" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-[#111622]/95 border border-brand/50 rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-white">
              <span className="text-text-muted">Drawing:</span>
              <span className="text-brand font-bold uppercase tracking-wider">
                {activeDrawingTool === "pencil" && "Pencil"}
                {activeDrawingTool === "line" && "Line"}
                {activeDrawingTool === "rect" && "Rectangle"}
              </span>
            </div>
            <div className="h-3.5 w-px bg-border/80" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-text-muted">Color:</span>
              <span className="h-3 w-3 rounded-full border border-white/40" style={{ backgroundColor: drawingColor }} />
            </div>
            <div className="h-3.5 w-px bg-border/80" />
            <button
              type="button"
              onClick={() => setDrawings((prev) => prev.slice(0, -1))}
              disabled={drawings.length === 0}
              className="text-text-muted hover:text-text-primary disabled:opacity-30 p-1 transition-colors"
              title="Undo last mark"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDrawings([])}
              disabled={drawings.length === 0}
              className="text-text-muted hover:text-rose-400 disabled:opacity-30 p-1 transition-colors"
              title="Clear all drawings"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="h-3.5 w-px bg-border/80" />
            <button
              type="button"
              onClick={() => setActiveDrawingTool("cursor")}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand/20 hover:bg-brand/30 border border-brand/40 text-[11px] text-brand font-medium transition-colors"
              title="Exit Drawing Mode to Normal Cursor"
            >
              <MousePointer className="h-3 w-3" />
              <span>Done (Cursor)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
