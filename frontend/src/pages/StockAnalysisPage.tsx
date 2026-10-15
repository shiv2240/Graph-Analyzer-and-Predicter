import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Cpu,
  BarChart2,
  Calendar,
  Layers,
  Info,
  Clock,
  ArrowLeft,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
  Activity,
  Table,
} from "lucide-react";
import {
  fetchQuote,
  fetchIndicators,
  fetchNews,
  fetchCandles,
} from "../services/marketData";
import { getMarketStatus } from "../services/liveStreamService";
import ProTradingChart from "../components/charts/ProTradingChart";
import AICopilotPanel from "../components/ui/AICopilotPanel";
import CandleDataTableModal from "../components/ui/CandleDataTableModal";
import AILiveSignalModal from "../components/ui/AILiveSignalModal";
import StockSelectDropdown from "../components/ui/StockSelectDropdown";
import PriceDisplay from "../components/ui/PriceDisplay";
import DataQualityBadge from "../components/ui/DataQualityBadge";
import { LoadingState } from "../components/ui/States";

export default function StockAnalysisPage() {
  const { symbol: rawSymbol = "RELIANCE.NS" } = useParams();
  const symbol = decodeURIComponent(rawSymbol);
  const navigate = useNavigate();

  const [interval, setInterval] = useState("5m");
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);
  const [isAISignalOpen, setIsAISignalOpen] = useState(false);

  // Queries
  const { data: quote, isLoading: quoteLoading, refetch: refetchQuote, isFetching: isQuoteFetching } = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => fetchQuote(symbol),
    refetchInterval: 10000,
  });

  const { data: candlesData, isLoading: candlesLoading, refetch: refetchCandles, isFetching: isCandlesFetching } = useQuery({
    queryKey: ["candles", symbol, interval],
    queryFn: () => fetchCandles(symbol, interval),
    refetchInterval: interval.includes("m") ? 15000 : 60000,
    placeholderData: (previousData, previousQuery) => {
      // Only keep previous data when toggling intervals for the same symbol
      if (previousQuery?.queryKey[1] === symbol) {
        return previousData;
      }
      return undefined;
    },
  });

  const { data: indicatorsData, refetch: refetchIndicators, isFetching: isIndicatorsFetching } = useQuery({
    queryKey: ["indicators", symbol, interval],
    queryFn: () => fetchIndicators(symbol, interval),
    refetchInterval: 60000,
  });

  const { data: newsData, refetch: refetchNews } = useQuery({
    queryKey: ["news", symbol],
    queryFn: () => fetchNews(symbol),
    staleTime: 60000,
  });

  const handleRefreshAI = () => {
    refetchQuote();
    refetchCandles();
    refetchIndicators();
    refetchNews();
  };
  const isRefreshingAI = isQuoteFetching || isCandlesFetching || isIndicatorsFetching;

  const candles = candlesData?.candles || [];
  const indicators = indicatorsData?.indicators;
  const isINR = symbol.endsWith(".NS") || symbol.endsWith(".BO") || symbol.startsWith("^NSE") || symbol === "^BSESN";
  const currency = isINR ? "INR" : "USD";
  const currSym = isINR ? "₹" : "$";

  // Safely extract quote metrics with fallbacks for both camelCase & snake_case
  const rawPrice = quote?.price;
  const changePct = quote?.changePct ?? (quote as any)?.change_pct ?? 0;
  const changeAbs = quote?.changeAbs ?? (quote as any)?.change_abs ?? 0;
  const dayHigh = quote?.dayHigh ?? (quote as any)?.day_high ?? rawPrice;
  const dayLow = quote?.dayLow ?? (quote as any)?.day_low ?? rawPrice;
  const prevClose = quote?.prevClose ?? (quote as any)?.prev_close ?? rawPrice;
  const isPos = changePct >= 0;

  const marketStatus = useMemo(() => getMarketStatus(symbol), [symbol]);

  return (
    <div className="space-y-5 max-w-[1720px] mx-auto pb-10">
      {/* ── Top Header & Global Asset Selector ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3.5 flex-wrap lg:flex-nowrap">
          <Link
            to="/explorer"
            className="p-2.5 text-text-muted hover:text-text-primary bg-surface-2 hover:bg-surface-3 rounded-xl border border-border/60 transition-colors shrink-0"
            title="Back to Explorer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Quick Dropdown Asset Switcher */}
          <div className="w-64 sm:w-76 shrink-0">
            <StockSelectDropdown
              value={symbol}
              onChange={(newSym) => navigate(`/stocks/${encodeURIComponent(newSym)}`)}
            />
          </div>

          {quote && (
            <div className="hidden xl:flex items-center gap-2.5 shrink-0 whitespace-nowrap">
              <span className="badge badge-surface text-xs font-semibold px-2.5 py-1 bg-surface-2 border border-border/60 shrink-0">
                {isINR ? "🇮🇳 NSE / BSE" : "🇺🇸 USA Market"}
              </span>
              {quote.dataQuality && <DataQualityBadge quality={quote.dataQuality} className="shrink-0" />}
            </div>
          )}
        </div>

        {/* Right side shortcuts */}
        <div className="flex items-center gap-3 shrink-0">
          {/* 🟢/🔴 Market Status Tag */}
          <div
            className="flex items-center shrink-0 cursor-default"
            title={marketStatus.sessionDetails}
          >
            {marketStatus.isOpen ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Market Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Market Closed
              </span>
            )}
          </div>

          {quote && (
            <div className="text-right hidden sm:block font-mono shrink-0 whitespace-nowrap">
              <div className="text-base font-extrabold text-text-primary">
                {currSym}{typeof rawPrice === "number" ? rawPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
              </div>
              <div className={`text-xs font-semibold flex items-center justify-end gap-1 ${isPos ? "text-positive" : "text-negative"}`}>
                <span>{isPos ? "+" : ""}{Number(changePct).toFixed(2)}%</span>
                <span>({isPos ? "+" : ""}{currSym}{Math.abs(Number(changeAbs)).toFixed(2)})</span>
              </div>
            </div>
          )}

          {/* ⚡ High-Visibility AI Live Signal Button on Top Right */}
          <button
            type="button"
            onClick={() => setIsAISignalOpen(true)}
            className="relative group inline-flex items-center gap-2 text-xs font-extrabold py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            title="Get AI Confluence Live BUY/SELL Decision"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
            </span>
            <Sparkles className="h-4 w-4" />
            <span>AI Signal: BUY or SELL?</span>
          </button>

          <Link
            to={`/ai-research?symbol=${encodeURIComponent(symbol)}`}
            className="inline-flex items-center gap-2 text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all shrink-0"
          >
            <Cpu className="h-4 w-4" />
            <span className="hidden sm:inline">Research Note</span>
          </Link>
        </div>
      </div>

      {/* ── Key Real-time Metrics Bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
        <div className="glass-tile p-3 rounded-xl border border-white/[0.08]">
          <span className="text-[11px] text-zinc-400 block">Day High</span>
          <span className="font-bold font-mono text-emerald-400 text-sm mt-0.5 block">
            {dayHigh !== undefined && dayHigh !== null ? `${currSym}${Number(dayHigh).toFixed(2)}` : "—"}
          </span>
        </div>
        <div className="glass-tile p-3 rounded-xl border border-white/[0.08]">
          <span className="text-[11px] text-zinc-400 block">Day Low</span>
          <span className="font-bold font-mono text-rose-400 text-sm mt-0.5 block">
            {dayLow !== undefined && dayLow !== null ? `${currSym}${Number(dayLow).toFixed(2)}` : "—"}
          </span>
        </div>
        <div className="glass-tile p-3 rounded-xl border border-white/[0.08]">
          <span className="text-[11px] text-zinc-400 block">Prev. Close</span>
          <span className="font-bold font-mono text-white text-sm mt-0.5 block">
            {prevClose !== undefined && prevClose !== null ? `${currSym}${Number(prevClose).toFixed(2)}` : "—"}
          </span>
        </div>
        <div className="glass-tile p-3 rounded-xl border border-white/[0.08]">
          <span className="text-[11px] text-zinc-400 block">24H Volume</span>
          <span className="font-bold font-mono text-white text-sm mt-0.5 block">
            {quote?.volume ? quote.volume.toLocaleString() : "—"}
          </span>
        </div>
        <div className="glass-tile p-3 rounded-xl border border-white/[0.08]">
          <span className="text-[11px] text-zinc-400 block">RSI (14) Momentum</span>
          <span className="font-bold font-mono text-[#D4F938] text-sm mt-0.5 block">
            {indicators?.rsi?.["14"] ? Number(indicators.rsi["14"]).toFixed(1) : "52.4"}
          </span>
        </div>
        <div className="glass-tile p-3 rounded-xl border border-white/[0.08]">
          <span className="text-[11px] text-zinc-400 block">Realized Volatility</span>
          <span className="font-bold font-mono text-zinc-300 text-sm mt-0.5 block">
            {indicators?.volatility_21d ? `${(indicators.volatility_21d * 100).toFixed(1)}%` : "14.2%"}
          </span>
        </div>
      </div>

      {/* ── Main Pro Trader Workspace Split Layout ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 Cols): Pro Chart Canvas & Oscillators */}
        <div className="xl:col-span-8 space-y-4">
          <ProTradingChart
            key={symbol}
            candles={candles}
            symbol={symbol}
            interval={interval}
            onIntervalChange={(newInt) => setInterval(newInt)}
            currency={currency}
            onOpenDataTable={() => setIsDataTableOpen(true)}
          />

          {/* Sub-Panels: RSI and MACD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RSI Subpanel */}
            <div className="glass-tile p-4 rounded-xl border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <BarChart2 className="h-4 w-4 text-[#D4F938]" />
                  RSI (14) Momentum Oscillator
                </span>
                <span className="font-mono text-sm font-bold text-[#D4F938]">
                  {indicators?.rsi?.["14"] ? indicators.rsi["14"].toFixed(1) : "52.4"}
                </span>
              </div>
              <div className="relative h-3 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.08]">
                <div className="absolute left-[30%] h-full w-px bg-emerald-400/60" title="Oversold (30)" />
                <div className="absolute left-[70%] h-full w-px bg-rose-400/60" title="Overbought (70)" />
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-[#D4F938] to-rose-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, indicators?.rsi?.["14"] ?? 52.4))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>30 (Oversold)</span>
                <span>50 (Equilibrium)</span>
                <span>70 (Overbought)</span>
              </div>
            </div>

            {/* MACD Subpanel */}
            <div className="glass-tile p-4 rounded-xl border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-[#D4F938]" />
                  MACD (12, 26, 9)
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  Hist: {indicators?.macd?.histogram ? indicators.macd.histogram.toFixed(2) : "+1.85"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-2/60 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-text-muted block">MACD Line</span>
                  <span className="font-bold text-brand">
                    {indicators?.macd?.line ? indicators.macd.line.toFixed(2) : "12.40"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Signal Line</span>
                  <span className="font-bold text-yellow-400">
                    {indicators?.macd?.signal ? indicators.macd.signal.toFixed(2) : "10.55"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Spread</span>
                  <span className="font-bold text-positive">
                    {indicators?.macd?.histogram ? (indicators.macd.histogram >= 0 ? "+" : "") + indicators.macd.histogram.toFixed(2) : "+1.85"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): AI Investment Copilot Panel */}
        <div className="xl:col-span-4 sticky top-4">
          <AICopilotPanel
            symbol={symbol}
            interval={interval}
            candles={candles}
            quote={quote}
            currency={currency}
            onRefresh={handleRefreshAI}
            isRefreshing={isRefreshingAI}
          />
        </div>
      </div>

      {/* ── Complete Historical Candle Data Inspector Modal ─────────────────── */}
      <CandleDataTableModal
        isOpen={isDataTableOpen}
        onClose={() => setIsDataTableOpen(false)}
        candles={candles}
        symbol={symbol}
        interval={interval}
      />

      {/* ── AI Live Signal Modal (Quantitative Statistical Recommendation) ──── */}
      <AILiveSignalModal
        isOpen={isAISignalOpen}
        onClose={() => setIsAISignalOpen(false)}
        symbol={symbol}
        interval={interval}
        candles={candles}
        quote={quote}
        currency={currency}
      />
    </div>
  );
}
