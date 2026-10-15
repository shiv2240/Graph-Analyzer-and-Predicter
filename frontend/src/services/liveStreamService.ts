import { useEffect, useRef, useState, useCallback } from "react";
import type { CandleBar } from "./marketData";

export interface LiveMarketTick {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  price: number;
  changePct: number;
  isNewCandle: boolean;
}

// Map app symbol to Binance ticker stream symbol
const BINANCE_CRYPTO_MAP: Record<string, string> = {
  "BTC-USD": "btcusdt",
  "BTC": "btcusdt",
  "BITCOIN": "btcusdt",
  "ETH-USD": "ethusdt",
  "ETH": "ethusdt",
  "SOL-USD": "solusdt",
  "SOL": "solusdt",
  "BNB-USD": "bnbusdt",
  "BNB": "bnbusdt",
  "XRP-USD": "xrpusdt",
  "XRP": "xrpusdt",
  "DOGE-USD": "dogeusdt",
  "DOGE": "dogeusdt",
  "ADA-USD": "adausdt",
  "ADA": "adausdt",
};

// Map interval to Binance kline interval
const BINANCE_INTERVAL_MAP: Record<string, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "1d": "1d",
  "1wk": "1w",
  "1mo": "1M",
};

export function useLiveMarketStream({
  symbol,
  interval = "1m",
  initialCandles = [],
  onTick,
}: {
  symbol: string;
  interval: string;
  initialCandles: CandleBar[];
  onTick?: (tick: LiveMarketTick) => void;
}) {
  const [currentTick, setCurrentTick] = useState<LiveMarketTick | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [streamSource, setStreamSource] = useState<"binance_ws" | "realtime_poll" | "market_data" | "offline">("offline");

  const lastCandleRef = useRef<LiveMarketTick | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickSimulatorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync latest candle from historical data
  useEffect(() => {
    if (initialCandles.length > 0) {
      const last = initialCandles[initialCandles.length - 1];
      const timeSec = Math.floor(new Date(last.ts).getTime() / 1000);
      const chg = last.open ? ((last.close - last.open) / last.open) * 100 : 0;
      const tick: LiveMarketTick = {
        time: timeSec,
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
        volume: last.volume,
        price: last.close,
        changePct: chg,
        isNewCandle: false,
      };
      lastCandleRef.current = tick;
      setCurrentTick(tick);
    }
  }, [initialCandles]);

  // Connect to live market stream
  useEffect(() => {
    // Clean up previous connections
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (tickSimulatorTimerRef.current) {
      clearInterval(tickSimulatorTimerRef.current);
      tickSimulatorTimerRef.current = null;
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const binanceSymbol = BINANCE_CRYPTO_MAP[cleanSymbol];

    // ── 1. CRYPTO: Direct Real-Time 24/7 Binance WebSocket ────────────────
    if (binanceSymbol) {
      const bInterval = BINANCE_INTERVAL_MAP[interval] || "1m";
      const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_${bInterval}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsLive(true);
          setStreamSource("binance_ws");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.e === "kline" && data.k) {
              const k = data.k;
              const timeSec = Math.floor(k.t / 1000);
              const o = parseFloat(k.o);
              const h = parseFloat(k.h);
              const l = parseFloat(k.l);
              const c = parseFloat(k.c);
              const v = parseFloat(k.v);
              const chg = o ? ((c - o) / o) * 100 : 0;

              const tick: LiveMarketTick = {
                time: timeSec,
                open: o,
                high: h,
                low: l,
                close: c,
                volume: v,
                price: c,
                changePct: chg,
                isNewCandle: k.x === true,
              };

              lastCandleRef.current = tick;
              setCurrentTick(tick);
              if (onTick) onTick(tick);
            }
          } catch (err) {
            console.error("Binance WS message parse error:", err);
          }
        };

        ws.onerror = () => {
          setIsLive(false);
          setStreamSource("realtime_poll");
        };

        ws.onclose = () => {
          setIsLive(false);
        };
      } catch (err) {
        console.error("Failed to connect to Binance WebSocket:", err);
      }
    } else {
      // ── 2. EQUITIES, COMMODITIES, FOREX: Real Exchange Data Mode ─────────
      // Rely on authentic exchange candle data without fabricating fake forward bars
      setStreamSource("market_data");
      setIsLive(false);

      if (lastCandleRef.current) {
        setCurrentTick(lastCandleRef.current);
      }
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (tickSimulatorTimerRef.current) clearInterval(tickSimulatorTimerRef.current);
    };
  }, [symbol, interval, onTick]);

  return {
    currentTick,
    isLive,
    streamSource,
  };
}

export function isMarketOpen(symbol: string): boolean {
  const clean = symbol.trim().toUpperCase();
  // Crypto is open 24/7
  if (BINANCE_CRYPTO_MAP[clean] || clean.includes("BTC") || clean.includes("ETH") || clean.includes("SOL")) {
    return true;
  }

  const now = new Date();
  const utcDay = now.getUTCDay(); // 0 is Sunday, 6 is Saturday
  if (utcDay === 0 || utcDay === 6) return false;

  const isIndia =
    clean.endsWith(".NS") ||
    clean.endsWith(".BO") ||
    clean.startsWith("^NSE") ||
    clean === "^BSESN";

  if (isIndia) {
    // IST is UTC + 5:30.
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const istMinutes = (utcMinutes + 330) % 1440;
    // NSE market hours: 09:15 (555m) to 15:30 (930m)
    return istMinutes >= 555 && istMinutes <= 930;
  }

  // Default to US equities (NASDAQ/NYSE): 09:30 to 16:00 EST (13:30 to 20:00 UTC)
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return utcMinutes >= 810 && utcMinutes <= 1200;
}
