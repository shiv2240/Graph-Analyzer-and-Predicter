import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  BarChart2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";
import { fetchIndices, fetchQuote, fetchIndicators } from "../services/marketData";
import CandlestickChart from "../components/charts/CandlestickChart";
import PriceDisplay from "../components/ui/PriceDisplay";
import DataQualityBadge from "../components/ui/DataQualityBadge";
import { LoadingState, ErrorState } from "../components/ui/States";

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE.NS");

  // Fetch major market indices
  const {
    data: indicesData,
    isLoading: indicesLoading,
    error: indicesError,
    refetch: refetchIndices,
  } = useQuery({
    queryKey: ["indices"],
    queryFn: fetchIndices,
    refetchInterval: 30000,
  });

  // Fetch selected stock quote
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ["quote", selectedSymbol],
    queryFn: () => fetchQuote(selectedSymbol),
    refetchInterval: 15000,
  });

  // Fetch indicators for selected stock
  const { data: indicatorsData, isLoading: indLoading } = useQuery({
    queryKey: ["indicators", selectedSymbol],
    queryFn: () => fetchIndicators(selectedSymbol),
    refetchInterval: 60000,
  });

  const popularPicks = [
    { symbol: "RELIANCE.NS", label: "Reliance" },
    { symbol: "TCS.NS", label: "TCS" },
    { symbol: "INFY.NS", label: "Infosys" },
    { symbol: "AAPL", label: "Apple" },
    { symbol: "NVDA", label: "NVIDIA" },
  ];

  const indicators = indicatorsData?.indicators;

  return (
    <div className="space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand" />
            Market Intelligence Overview
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Institutional-grade equity analysis, live technical indicators & AI forecasts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchIndices()}
            className="btn btn-ghost flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <Link to="/ai-research" className="btn btn-primary flex items-center gap-1.5 text-xs">
            <Cpu className="h-3.5 w-3.5" />
            Generate AI Report
          </Link>
        </div>
      </div>

      {/* ── Major Indices Bar ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          Global & Indian Benchmark Indices
        </h2>
        {indicesLoading ? (
          <LoadingState message="Loading live market indices..." />
        ) : indicesError ? (
          <div className="card p-4 text-xs text-negative flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Could not retrieve indices. Backend services initializing.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {indicesData?.indices?.map((idx) => {
              const isPositive = (idx.changePct ?? 0) >= 0;
              return (
                <div
                  key={idx.symbol}
                  className="card p-4 hover:border-brand/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedSymbol(idx.symbol)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-text-secondary">{idx.name}</span>
                    <span className="badge badge-surface text-[10px]">{idx.exchange}</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-lg font-bold font-mono text-text-primary">
                      {idx.price ? idx.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 ${
                        isPositive ? "text-positive" : "text-negative"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {idx.changePct !== null && idx.changePct !== undefined
                        ? `${isPositive ? "+" : ""}${idx.changePct.toFixed(2)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Chart & Analysis Area ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="bg-brand/10 p-2 rounded-lg text-brand font-bold text-sm">
                  {selectedSymbol.replace(".NS", "").replace(".BO", "")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-text-primary">{selectedSymbol}</span>
                    {quote?.dataQuality && <DataQualityBadge quality={quote.dataQuality} />}
                  </div>
                  {quote && (
                    <div className="mt-1">
                      <PriceDisplay
                        price={quote.price}
                        changeAbs={quote.changeAbs}
                        changePct={quote.changePct}
                        currency={selectedSymbol.endsWith(".NS") || selectedSymbol.endsWith(".BO") ? "INR" : "USD"}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Symbol Switcher */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {popularPicks.map((pick) => (
                  <button
                    key={pick.symbol}
                    onClick={() => setSelectedSymbol(pick.symbol)}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      selectedSymbol === pick.symbol
                        ? "bg-brand text-white"
                        : "bg-surface-elevated text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {pick.label}
                  </button>
                ))}
                <Link
                  to="/explorer"
                  className="p-1.5 text-text-muted hover:text-text-primary bg-surface-elevated rounded"
                  title="Search all instruments"
                >
                  <Search className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Candlestick Interactive Chart */}
            <div className="h-[420px] w-full">
              <CandlestickChart symbol={selectedSymbol} interval="1d" />
            </div>
          </div>
        </div>

        {/* Technical Signals & AI Highlights Column (1 Col) */}
        <div className="space-y-4">
          {/* Key Indicators Snapshot */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-brand" />
                Technical Health Check
              </h3>
              <span className="text-[10px] text-text-muted">1D Timeframe</span>
            </div>

            {indLoading ? (
              <LoadingState message="Computing indicators..." />
            ) : indicators ? (
              <div className="space-y-3 text-xs">
                {/* RSI */}
                <div className="flex items-center justify-between p-2.5 bg-surface-elevated rounded-lg">
                  <div>
                    <span className="font-medium text-text-secondary">RSI (14)</span>
                    <p className="text-[10px] text-text-muted">
                      {indicators.rsi?.["14"] >= 70
                        ? "Overbought Territory"
                        : indicators.rsi?.["14"] <= 30
                        ? "Oversold Opportunity"
                        : "Neutral Momentum"}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm ${
                      indicators.rsi?.["14"] >= 70
                        ? "text-negative"
                        : indicators.rsi?.["14"] <= 30
                        ? "text-positive"
                        : "text-text-primary"
                    }`}
                  >
                    {indicators.rsi?.["14"]?.toFixed(1) ?? "—"}
                  </span>
                </div>

                {/* MACD */}
                <div className="flex items-center justify-between p-2.5 bg-surface-elevated rounded-lg">
                  <div>
                    <span className="font-medium text-text-secondary">MACD Histogram</span>
                    <p className="text-[10px] text-text-muted">
                      {(indicators.macd?.histogram ?? 0) >= 0 ? "Bullish Crossover" : "Bearish Momentum"}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm ${
                      (indicators.macd?.histogram ?? 0) >= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {indicators.macd?.histogram !== null ? indicators.macd.histogram.toFixed(2) : "—"}
                  </span>
                </div>

                {/* Moving Averages */}
                <div className="p-2.5 bg-surface-elevated rounded-lg space-y-1.5">
                  <span className="font-medium text-text-secondary block mb-1">Moving Average Grid</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-surface p-1.5 rounded">
                      <span className="text-[10px] text-text-muted block">SMA 20</span>
                      <span className="font-mono font-semibold text-text-primary">
                        {indicators.sma?.["20"] ? Math.round(indicators.sma["20"]) : "—"}
                      </span>
                    </div>
                    <div className="bg-surface p-1.5 rounded">
                      <span className="text-[10px] text-text-muted block">SMA 50</span>
                      <span className="font-mono font-semibold text-text-primary">
                        {indicators.sma?.["50"] ? Math.round(indicators.sma["50"]) : "—"}
                      </span>
                    </div>
                    <div className="bg-surface p-1.5 rounded">
                      <span className="text-[10px] text-text-muted block">SMA 200</span>
                      <span className="font-mono font-semibold text-text-primary">
                        {indicators.sma?.["200"] ? Math.round(indicators.sma["200"]) : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bollinger Bands */}
                <div className="flex items-center justify-between p-2.5 bg-surface-elevated rounded-lg">
                  <div>
                    <span className="font-medium text-text-secondary">Bollinger Upper / Lower</span>
                    <p className="text-[10px] text-text-muted">Volatility Envelope</p>
                  </div>
                  <div className="font-mono text-right text-[11px]">
                    <span className="text-text-muted block">
                      H: {indicators.bollinger_bands?.upper?.toFixed(1) ?? "—"}
                    </span>
                    <span className="text-text-muted block">
                      L: {indicators.bollinger_bands?.lower?.toFixed(1) ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted">Indicator data will appear after selection.</p>
            )}

            <Link
              to={`/stocks/${selectedSymbol}`}
              className="btn btn-outline w-full flex items-center justify-center gap-1.5 text-xs py-2"
            >
              Full Technical Workspace
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Quick AI Research Callout */}
          <div className="card p-5 bg-gradient-to-br from-brand/10 via-surface-elevated to-surface border-brand/20 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-brand" />
              <h4 className="font-semibold text-sm text-text-primary">AI Research Assistant</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Synthesize live news, momentum indicators, and machine learning models for {selectedSymbol} into an institutional equity note.
            </p>
            <Link
              to={`/ai-research?symbol=${selectedSymbol}`}
              className="btn btn-primary w-full text-xs flex items-center justify-center gap-1.5"
            >
              Analyze with Gemini
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
