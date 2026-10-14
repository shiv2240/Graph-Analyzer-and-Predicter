import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Filter,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Cpu,
  BarChart2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  ArrowUpDown,
} from "lucide-react";
import { runScreener } from "../services/marketData";
import { LoadingState } from "../components/ui/States";

const SCREEN_PRESETS = [
  {
    name: "All Markets",
    description: "Complete multi-asset equity universe across Indian and US exchanges",
    filters: [],
    country: "ALL",
  },
  {
    name: "🇮🇳 NIFTY 50 Bluechips",
    description: "Benchmark market leaders on the National Stock Exchange of India",
    filters: [{ field: "country", operator: "eq", value: "IN" }],
    country: "IN",
  },
  {
    name: "🇺🇸 US Tech & S&P 500",
    description: "Mega-cap tech and leadership equities on NASDAQ & NYSE",
    filters: [{ field: "country", operator: "eq", value: "US" }],
    country: "US",
  },
  {
    name: "⚡ Bullish Momentum",
    description: "Stocks gaining over +0.5% with healthy RSI between 50 and 70",
    filters: [
      { field: "change_pct", operator: "gt", value: 0.5 },
      { field: "rsi_14", operator: "gte", value: 50 },
    ],
    country: "ALL",
  },
  {
    name: "🎯 Oversold Pullbacks",
    description: "Equities with 14-period RSI below 35 indicating potential mean-reversion",
    filters: [{ field: "rsi_14", operator: "lt", value: 35 }],
    country: "ALL",
  },
];

function formatVolume(val?: number) {
  if (!val) return "—";
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + "B";
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + "M";
  if (val >= 1_000) return (val / 1_000).toFixed(1) + "K";
  return val.toLocaleString();
}

function formatPrice(price?: number, currency = "USD") {
  if (price === undefined || price === null || isNaN(price)) return "—";
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ScreenerPage() {
  const [activePreset, setActivePreset] = useState<number>(0);
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [exchangeFilter, setExchangeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rsiMax, setRsiMax] = useState<string>("");
  const [rsiMin, setRsiMin] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sortField, setSortField] = useState<string>("change_pct");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Construct active filters
  const currentFilters: any[] = [];
  const presetFilters = SCREEN_PRESETS[activePreset]?.filters || [];

  for (const pf of presetFilters) {
    currentFilters.push(pf);
  }

  // Country filter (if not overridden by preset or if explicitly selected)
  if (countryFilter !== "ALL") {
    if (!currentFilters.some((f) => f.field === "country")) {
      currentFilters.push({ field: "country", operator: "eq", value: countryFilter });
    }
  }

  // Exchange filter
  if (exchangeFilter !== "ALL") {
    currentFilters.push({ field: "exchange", operator: "eq", value: exchangeFilter });
  }

  // RSI bounds
  if (rsiMax) {
    currentFilters.push({ field: "rsi_14", operator: "lte", value: parseFloat(rsiMax) });
  }
  if (rsiMin) {
    currentFilters.push({ field: "rsi_14", operator: "gte", value: parseFloat(rsiMin) });
  }

  const {
    data: screenerData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "screener",
      activePreset,
      countryFilter,
      exchangeFilter,
      searchQuery,
      rsiMax,
      rsiMin,
      sortField,
      sortDirection,
      page,
      pageSize,
    ],
    queryFn: () =>
      runScreener(
        currentFilters,
        { field: sortField, direction: sortDirection },
        page,
        pageSize,
        searchQuery
      ),
  });

  const results = screenerData?.results || [];
  const total = screenerData?.total ?? 0;
  const totalPages = screenerData?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  // Handler for changing country directly
  const handleCountryChange = (c: string) => {
    setCountryFilter(c);
    setPage(1);
    if (c === "IN") {
      setExchangeFilter("ALL");
    } else if (c === "US") {
      setExchangeFilter("ALL");
    }
  };

  // Handler for preset selection
  const handlePresetSelect = (idx: number) => {
    setActivePreset(idx);
    setPage(1);
    const p = SCREEN_PRESETS[idx];
    if (p.country && p.country !== "ALL") {
      setCountryFilter(p.country);
    } else if (p.country === "ALL") {
      setCountryFilter("ALL");
    }
  };

  // Toggle column sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <Filter className="h-6 w-6 text-brand" />
              Quantitative Market Screener
            </h1>
            <span className="badge badge-surface text-[11px] font-mono px-2 py-0.5 border border-brand/30 text-brand">
              🇮🇳 India + 🇺🇸 USA
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Screen top Indian (NIFTY 50 / Sensex) and US (NASDAQ / NYSE / S&P) stocks with technicals & momentum
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-ghost flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary self-start sm:self-auto border border-border/60 hover:border-brand/40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-brand" : ""}`} />
          {isFetching ? "Refreshing..." : "Re-run Screen"}
        </button>
      </div>

      {/* ── Direct Search Bar & Country Switcher ──────────────────────────────── */}
      <div className="card p-4 space-y-3.5 border border-border/80 bg-surface-1 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Direct Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search directly by symbol or company (e.g. RELIANCE, TCS, NIFTY, Apple, NVDA, Tesla)..."
              className="w-full pl-10 pr-9 py-2.5 bg-surface-2 border border-border/80 rounded-xl text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
                title="Clear Search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Country / Market Segmented Filter */}
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border/80 self-start md:self-auto shrink-0">
            <span className="text-[11px] font-semibold text-text-muted px-2 flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> Market:
            </span>
            <button
              type="button"
              onClick={() => handleCountryChange("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                countryFilter === "ALL"
                  ? "bg-brand text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-3"
              }`}
            >
              All Markets
            </button>
            <button
              type="button"
              onClick={() => handleCountryChange("IN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                countryFilter === "IN"
                  ? "bg-brand text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-3"
              }`}
            >
              <span>🇮🇳</span> India (NSE/BSE)
            </button>
            <button
              type="button"
              onClick={() => handleCountryChange("US")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                countryFilter === "US"
                  ? "bg-brand text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-3"
              }`}
            >
              <span>🇺🇸</span> USA (NASDAQ/NYSE)
            </button>
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-text-muted" />
              <span className="font-semibold text-text-secondary">Exchange:</span>
              <select
                value={exchangeFilter}
                onChange={(e) => {
                  setExchangeFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-surface-2 border border-border/80 rounded-lg px-2.5 py-1 text-text-primary text-xs focus:outline-none focus:border-brand"
              >
                <option value="ALL">All Exchanges</option>
                {countryFilter !== "US" && <option value="NSE">NSE (India)</option>}
                {countryFilter !== "US" && <option value="BSE">BSE (India)</option>}
                {countryFilter !== "IN" && <option value="NASDAQ">NASDAQ (US)</option>}
                {countryFilter !== "IN" && <option value="NYSE">NYSE (US)</option>}
                <option value="CRYPTO">Crypto & Commodities</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-secondary">RSI Min:</span>
              <input
                type="number"
                placeholder="e.g. 30"
                value={rsiMin}
                onChange={(e) => {
                  setRsiMin(e.target.value);
                  setPage(1);
                }}
                className="w-18 bg-surface-2 border border-border/80 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-secondary">RSI Max:</span>
              <input
                type="number"
                placeholder="e.g. 70"
                value={rsiMax}
                onChange={(e) => {
                  setRsiMax(e.target.value);
                  setPage(1);
                }}
                className="w-18 bg-surface-2 border border-border/80 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand font-mono"
              />
            </div>

            {(rsiMin || rsiMax || searchQuery || exchangeFilter !== "ALL" || countryFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCountryFilter("ALL");
                  setExchangeFilter("ALL");
                  setRsiMin("");
                  setRsiMax("");
                  setActivePreset(0);
                  setPage(1);
                }}
                className="text-[11px] text-brand hover:underline font-medium"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="text-text-muted">
            Found <span className="font-bold text-text-primary font-mono">{total}</span> matching securities
          </div>
        </div>
      </div>

      {/* ── Preset Strategies Carousel ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {SCREEN_PRESETS.map((preset, idx) => (
          <div
            key={idx}
            onClick={() => handlePresetSelect(idx)}
            className={`card p-3.5 cursor-pointer transition-all border ${
              activePreset === idx
                ? "border-brand bg-brand/5 shadow-md shadow-brand/10 ring-1 ring-brand/30"
                : "hover:border-brand/40 bg-surface-1"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-text-primary truncate">{preset.name}</span>
              {activePreset === idx && (
                <span className="badge badge-surface text-[9px] text-brand border border-brand/30 shrink-0">
                  Active
                </span>
              )}
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2">
              {preset.description}
            </p>
          </div>
        ))}
      </div>

      {/* ── Results Table ────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden border border-border/80 bg-surface-1 shadow-sm">
        {isLoading ? (
          <div className="p-12">
            <LoadingState message="Screening securities universe..." />
          </div>
        ) : results.length === 0 ? (
          <div className="p-16 text-center text-text-muted text-sm space-y-3">
            <div className="text-3xl">🔍</div>
            <p className="font-semibold text-text-primary">No securities matched your criteria</p>
            <p className="text-xs max-w-md mx-auto text-text-muted">
              Try adjusting your search query, clearing RSI bounds, or selecting "All Markets" to broaden the screen.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setCountryFilter("ALL");
                setExchangeFilter("ALL");
                setRsiMin("");
                setRsiMax("");
                setActivePreset(0);
                setPage(1);
              }}
              className="btn btn-secondary text-xs mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/90 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort("symbol")}
                  >
                    <div className="flex items-center gap-1">
                      Symbol
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Company / Asset
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Market / Exchange</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort("close")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Last Close
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort("change_pct")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      24h Change
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-center cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort("rsi_14")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      RSI (14)
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort("volume")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Volume
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {results.map((row: any) => {
                  const isPositive = (row.change_pct ?? 0) >= 0;
                  const isOversold = (row.rsi_14 ?? 50) < 35;
                  const isOverbought = (row.rsi_14 ?? 50) > 70;
                  const isIndia = row.country === "IN" || row.symbol.endsWith(".NS") || row.symbol.endsWith(".BO") || row.symbol.startsWith("^NSE") || row.symbol === "^BSESN";
                  const flag = isIndia ? "🇮🇳" : "🇺🇸";
                  const currency = row.currency || (isIndia ? "INR" : "USD");

                  return (
                    <tr
                      key={row.symbol}
                      className="hover:bg-surface-elevated/60 transition-colors group"
                    >
                      {/* Symbol & Country Flag */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base select-none" title={isIndia ? "India" : "United States"}>
                            {flag}
                          </span>
                          <div>
                            <Link
                              to={`/stocks/${encodeURIComponent(row.symbol)}`}
                              className="font-bold font-mono text-text-primary hover:text-brand transition-colors text-xs"
                            >
                              {row.symbol}
                            </Link>
                            {row.sector && (
                              <div className="text-[10px] text-text-muted truncate max-w-[130px]">
                                {row.sector}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company / Asset Name */}
                      <td className="py-3 px-4 text-text-secondary max-w-[220px]">
                        <span className="truncate block font-medium" title={row.name}>
                          {row.name}
                        </span>
                      </td>

                      {/* Market / Exchange Badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="badge badge-surface text-[10px] font-mono font-semibold">
                            {row.exchange}
                          </span>
                          <span className="text-[10px] text-text-muted uppercase">
                            {isIndia ? "India" : "USA"}
                          </span>
                        </div>
                      </td>

                      {/* Last Close Price */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">
                        {formatPrice(row.close, currency)}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span
                          className={`font-semibold inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] ${
                            isPositive
                              ? "bg-positive/10 text-positive"
                              : "bg-negative/10 text-negative"
                          }`}
                        >
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isPositive ? "+" : ""}
                          {row.change_pct !== undefined ? Number(row.change_pct).toFixed(2) : "0.00"}%
                        </span>
                      </td>

                      {/* RSI (14) */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            isOversold
                              ? "bg-positive/20 text-positive border border-positive/30"
                              : isOverbought
                              ? "bg-negative/20 text-negative border border-negative/30"
                              : "bg-surface-2 text-text-primary border border-border/40"
                          }`}
                          title={isOversold ? "Oversold (<35)" : isOverbought ? "Overbought (>70)" : "Neutral"}
                        >
                          {row.rsi_14 !== undefined ? Number(row.rsi_14).toFixed(1) : "50.0"}
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="py-3 px-4 text-right font-mono text-text-muted">
                        {formatVolume(row.volume)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/stocks/${encodeURIComponent(row.symbol)}`}
                            className="p-1.5 text-text-muted hover:text-brand hover:bg-surface-elevated rounded-lg transition-all"
                            title="Open Technical Chart & Live Copilot"
                          >
                            <BarChart2 className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/ai-research?symbol=${encodeURIComponent(row.symbol)}`}
                            className="p-1.5 text-text-muted hover:text-brand hover:bg-surface-elevated rounded-lg transition-all"
                            title="Generate AI Research Report"
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

        {/* ── Pagination Controls Bar ─────────────────────────────────────────── */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-surface-2/60 text-xs">
            {/* Page Count Info */}
            <div className="text-text-muted">
              Showing <span className="font-bold text-text-primary">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-bold text-text-primary">
                {Math.min(page * pageSize, total)}
              </span>{" "}
              of <span className="font-bold text-text-primary">{total}</span> securities
            </div>

            {/* Page Size & Page Navigation */}
            <div className="flex items-center gap-3">
              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-text-muted">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-surface-1 border border-border/80 rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="btn btn-ghost px-2 py-1 text-xs text-text-muted hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed border border-border/60"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Prev
                </button>

                {/* Page Number Pills */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-text-muted">...</span>}
                        <button
                          type="button"
                          onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition-all ${
                            page === p
                              ? "bg-brand text-white shadow-sm"
                              : "text-text-muted hover:text-text-primary hover:bg-surface-3 border border-border/50"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="btn btn-ghost px-2 py-1 text-xs text-text-muted hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed border border-border/60"
                  title="Next Page"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
