import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Globe, TrendingUp, TrendingDown, ArrowRight, Compass, ShieldCheck } from "lucide-react";
import { searchInstruments, fetchQuote } from "../services/marketData";
import { LoadingState } from "../components/ui/States";

const FEATURED_UNIVERSE = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd", exchange: "NSE", country: "IN", currency: "INR" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd", exchange: "NSE", country: "IN", currency: "INR" },
  { symbol: "INFY.NS", name: "Infosys Ltd", exchange: "NSE", country: "IN", currency: "INR" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", exchange: "NSE", country: "IN", currency: "INR" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd", exchange: "NSE", country: "IN", currency: "INR" },
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", country: "US", currency: "USD" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", country: "US", currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", country: "US", currency: "USD" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", country: "US", currency: "USD" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", country: "US", currency: "USD" },
  { symbol: "^NSEI", name: "NIFTY 50", exchange: "NSE", country: "IN", currency: "INR" },
  { symbol: "^GSPC", name: "S&P 500", exchange: "NYSE", country: "US", currency: "USD" },
];

export default function StockExplorerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExchange, setSelectedExchange] = useState<string>("ALL");

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["search", searchQuery, selectedExchange],
    queryFn: () =>
      searchInstruments(
        searchQuery,
        selectedExchange === "ALL" ? undefined : selectedExchange
      ),
    enabled: searchQuery.trim().length >= 2,
  });

  const displayedStocks =
    searchQuery.trim().length >= 2 && searchResults
      ? searchResults
      : FEATURED_UNIVERSE.filter(
          (s) => selectedExchange === "ALL" || s.exchange === selectedExchange
        );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Compass className="h-6 w-6 text-brand" />
          Global Equity Explorer
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Explore equities across Indian (NSE, BSE) and US (NASDAQ, NYSE) exchanges with live data
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by company or ticker (e.g. Reliance, AAPL, INFY)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
          />
        </div>

        {/* Exchange Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {["ALL", "NSE", "BSE", "NASDAQ", "NYSE"].map((ex) => (
            <button
              key={ex}
              onClick={() => setSelectedExchange(ex)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedExchange === ex
                  ? "bg-brand text-white"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary"
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Instruments */}
      {isSearching ? (
        <LoadingState message="Searching securities across exchanges..." />
      ) : displayedStocks.length === 0 ? (
        <div className="card p-12 text-center text-text-muted text-sm">
          No instruments found matching "{searchQuery}". Try another symbol or company name.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedStocks.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}

function StockCard({ stock }: { stock: any }) {
  const { data: quote } = useQuery({
    queryKey: ["quote", stock.symbol],
    queryFn: () => fetchQuote(stock.symbol),
    staleTime: 30000,
  });

  const isPositive = (quote?.changePct ?? 0) >= 0;

  return (
    <div className="card p-5 hover:border-brand/50 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-text-primary group-hover:text-brand transition-colors">
                {stock.symbol}
              </span>
              <span className="badge badge-surface text-[10px] font-semibold">{stock.exchange}</span>
            </div>
            <p className="text-xs text-text-secondary mt-1 line-clamp-1">{stock.name}</p>
          </div>
          <span className="text-[11px] font-mono text-text-muted">{stock.currency}</span>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-text-muted block">Latest Close</span>
            <span className="text-xl font-bold font-mono text-text-primary">
              {quote?.price
                ? quote.price.toLocaleString("en-US", { minimumFractionDigits: 2 })
                : "—"}
            </span>
          </div>

          {quote?.changePct !== undefined && (
            <div
              className={`text-xs font-semibold flex items-center gap-0.5 px-2 py-1 rounded ${
                isPositive ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
              }`}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}
              {quote.changePct.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
        <Link
          to={`/ai-research?symbol=${stock.symbol}`}
          className="text-text-muted hover:text-brand transition-colors"
        >
          AI Research
        </Link>
        <Link
          to={`/stocks/${stock.symbol}`}
          className="text-brand font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          Analyze
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
