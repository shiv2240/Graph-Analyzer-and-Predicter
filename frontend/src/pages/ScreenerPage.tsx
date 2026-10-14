import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Filter,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Cpu,
  BarChart2,
} from "lucide-react";
import { runScreener } from "../services/marketData";
import { LoadingState } from "../components/ui/States";

const SCREEN_PRESETS = [
  {
    name: "Oversold Pullbacks",
    description: "Equities with 14-period RSI below 35 indicating potential mean-reversion",
    filters: [{ field: "rsi_14", operator: "lt", value: 35 }],
  },
  {
    name: "Bullish Momentum",
    description: "Stocks gaining over +0.5% with healthy RSI between 50 and 70",
    filters: [
      { field: "change_pct", operator: "gt", value: 0.5 },
      { field: "rsi_14", operator: "gte", value: 50 },
    ],
  },
  {
    name: "NSE Equities (India)",
    description: "Prominent Indian benchmarks and blue chips on National Stock Exchange",
    filters: [{ field: "exchange", operator: "eq", value: "NSE" }],
  },
  {
    name: "US Tech Giants",
    description: "High-liquidity NASDAQ and NYSE technology leadership",
    filters: [{ field: "exchange", operator: "eq", value: "NASDAQ" }],
  },
];

export default function ScreenerPage() {
  const [activePreset, setActivePreset] = useState<number>(0);
  const [exchangeFilter, setExchangeFilter] = useState<string>("ALL");
  const [rsiMax, setRsiMax] = useState<string>("");
  const [rsiMin, setRsiMin] = useState<string>("");

  // Construct active filters
  const currentFilters = [...SCREEN_PRESETS[activePreset].filters];
  if (exchangeFilter !== "ALL") {
    currentFilters.push({ field: "exchange", operator: "eq", value: exchangeFilter });
  }
  if (rsiMax) {
    currentFilters.push({ field: "rsi_14", operator: "lte", value: parseFloat(rsiMax) });
  }
  if (rsiMin) {
    currentFilters.push({ field: "rsi_14", operator: "gte", value: parseFloat(rsiMin) });
  }

  const {
    data: screenerData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["screener", activePreset, exchangeFilter, rsiMax, rsiMin],
    queryFn: () => runScreener(currentFilters, { field: "change_pct", direction: "desc" }),
  });

  const results = screenerData?.results || [];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Filter className="h-6 w-6 text-brand" />
            Quantitative Equity Screener
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Filter the Indian and US equity universe using technical indicators, price action, and liquidity
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="btn btn-ghost flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Re-run Screen
        </button>
      </div>

      {/* ── Preset Strategies Carousel ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCREEN_PRESETS.map((preset, idx) => (
          <div
            key={idx}
            onClick={() => setActivePreset(idx)}
            className={`card p-4 cursor-pointer transition-all border ${
              activePreset === idx
                ? "border-brand bg-brand/5 shadow-md shadow-brand/10"
                : "hover:border-brand/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-text-primary">{preset.name}</span>
              {activePreset === idx && (
                <span className="badge badge-surface text-[10px] text-brand border border-brand/30">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
              {preset.description}
            </p>
          </div>
        ))}
      </div>

      {/* ── Custom Filters Bar ────────────────────────────────────────────────── */}
      <div className="card p-4 flex flex-wrap gap-4 items-center justify-between text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-text-muted" />
            <span className="font-semibold text-text-secondary">Exchange:</span>
            <select
              value={exchangeFilter}
              onChange={(e) => setExchangeFilter(e.target.value)}
              className="bg-surface-elevated border border-border rounded px-2.5 py-1 text-text-primary text-xs focus:outline-none focus:border-brand"
            >
              <option value="ALL">All Exchanges</option>
              <option value="NSE">NSE (India)</option>
              <option value="BSE">BSE (India)</option>
              <option value="NASDAQ">NASDAQ (US)</option>
              <option value="NYSE">NYSE (US)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-secondary">RSI Min:</span>
            <input
              type="number"
              placeholder="e.g. 30"
              value={rsiMin}
              onChange={(e) => setRsiMin(e.target.value)}
              className="w-20 bg-surface-elevated border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-secondary">RSI Max:</span>
            <input
              type="number"
              placeholder="e.g. 70"
              value={rsiMax}
              onChange={(e) => setRsiMax(e.target.value)}
              className="w-20 bg-surface-elevated border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <span className="text-text-muted">
          Showing <span className="font-bold text-text-primary">{results.length}</span> matching securities
        </span>
      </div>

      {/* ── Results Table ────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Screening securities universe..." />
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm">
            No instruments matched current criteria. Try loosening RSI bounds or changing exchange.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Exchange</th>
                  <th className="py-3 px-4 text-right">Last Close</th>
                  <th className="py-3 px-4 text-right">24h Change</th>
                  <th className="py-3 px-4 text-center">RSI (14)</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {results.map((row: any) => {
                  const isPositive = (row.change_pct ?? 0) >= 0;
                  const isOversold = (row.rsi_14 ?? 50) < 30;
                  const isOverbought = (row.rsi_14 ?? 50) > 70;

                  return (
                    <tr key={row.symbol} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-mono text-text-primary">
                        {row.symbol}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary max-w-[200px] truncate">
                        {row.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="badge badge-surface text-[10px]">{row.exchange}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-text-primary">
                        {row.close ? row.close.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-semibold inline-flex items-center gap-0.5 ${
                            isPositive ? "text-positive" : "text-negative"
                          }`}
                        >
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isPositive ? "+" : ""}
                          {row.change_pct ? row.change_pct.toFixed(2) : "0.00"}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            isOversold
                              ? "bg-positive/10 text-positive"
                              : isOverbought
                              ? "bg-negative/10 text-negative"
                              : "text-text-primary"
                          }`}
                        >
                          {row.rsi_14 ? row.rsi_14.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-text-muted">
                        {row.volume ? row.volume.toLocaleString() : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/stocks/${row.symbol}`}
                            className="p-1 text-text-muted hover:text-brand hover:bg-surface-elevated rounded"
                            title="Open Technical Chart"
                          >
                            <BarChart2 className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/ai-research?symbol=${row.symbol}`}
                            className="p-1 text-text-muted hover:text-brand hover:bg-surface-elevated rounded"
                            title="Generate AI Note"
                          >
                            <Cpu className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
