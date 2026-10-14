import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Globe, Sparkles, X, Coins, TrendingUp, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { searchInstruments } from "../../services/marketData";

export interface StockOption {
  symbol: string;
  name: string;
  exchange: string;
  category: "all" | "india" | "us" | "commodity" | "index" | "crypto";
  type: string;
  currency: "INR" | "USD";
  keywords?: string[];
}

export const POPULAR_INSTRUMENTS: StockOption[] = [
  // 🇮🇳 Indian Equities
  { symbol: "RELIANCE.NS", name: "Reliance Industries Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["reliance", "ril", "oil", "jio"] },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["tcs", "tata", "it", "tech"] },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["hdfc", "bank", "finance"] },
  { symbol: "INFY.NS", name: "Infosys Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["infosys", "infy", "it"] },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["icici", "bank"] },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["airtel", "telecom"] },
  { symbol: "ITC.NS", name: "ITC Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["itc", "fmcg", "tobacco"] },
  { symbol: "SBIN.NS", name: "State Bank of India", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["sbi", "psu", "bank"] },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["tata", "motors", "auto", "ev"] },
  { symbol: "LT.NS", name: "Larsen & Toubro Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["l&t", "infra"] },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["hul", "fmcg"] },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Limited", exchange: "NSE", category: "india", type: "Equity", currency: "INR", keywords: ["bajaj", "nbfc"] },
  { symbol: "GOLDBEES.NS", name: "Nippon India ETF Gold BeES", exchange: "NSE", category: "commodity", type: "Commodity ETF", currency: "INR", keywords: ["gold", "goldbees", "gold india", "gold/inr"] },
  { symbol: "SILVERBEES.NS", name: "Nippon India ETF Silver BeES", exchange: "NSE", category: "commodity", type: "Commodity ETF", currency: "INR", keywords: ["silver", "silverbees"] },

  // 🪙 Commodities & Precious Metals
  { symbol: "GC=F", name: "Gold Futures (COMEX / USA)", exchange: "COMEX", category: "commodity", type: "Commodity Futures", currency: "USD", keywords: ["gold", "gold/usa", "goldvsusa", "gold vs usa", "gold-usd", "xauusd", "gold futures"] },
  { symbol: "GLD", name: "SPDR Gold Shares ETF (USA)", exchange: "NYSE", category: "commodity", type: "Commodity ETF", currency: "USD", keywords: ["gold", "gold etf", "gold/usa", "goldvsusa", "spdr"] },
  { symbol: "IAU", name: "iShares Gold Trust", exchange: "NYSE", category: "commodity", type: "Commodity ETF", currency: "USD", keywords: ["gold", "gold trust"] },
  { symbol: "GOLD", name: "Barrick Gold Corporation", exchange: "NYSE", category: "commodity", type: "Gold Miner", currency: "USD", keywords: ["gold", "barrick", "mining"] },
  { symbol: "SI=F", name: "Silver Futures (COMEX / USA)", exchange: "COMEX", category: "commodity", type: "Commodity Futures", currency: "USD", keywords: ["silver", "silver/usa", "xagusd"] },
  { symbol: "SLV", name: "iShares Silver Trust ETF", exchange: "NYSE", category: "commodity", type: "Commodity ETF", currency: "USD", keywords: ["silver", "slv"] },
  { symbol: "CL=F", name: "Crude Oil WTI Futures (NYMEX)", exchange: "NYMEX", category: "commodity", type: "Energy Futures", currency: "USD", keywords: ["oil", "crude", "wti", "petroleum"] },
  { symbol: "BZ=F", name: "Brent Crude Oil Futures (ICE)", exchange: "ICE", category: "commodity", type: "Energy Futures", currency: "USD", keywords: ["brent", "crude", "oil"] },
  { symbol: "NG=F", name: "Natural Gas Futures", exchange: "NYMEX", category: "commodity", type: "Energy Futures", currency: "USD", keywords: ["gas", "natural gas"] },

  // 🇺🇸 US & Global Equities
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", category: "us", type: "Equity", currency: "USD", keywords: ["apple", "iphone", "mac", "tech"] },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", category: "us", type: "Equity", currency: "USD", keywords: ["microsoft", "windows", "azure", "ai"] },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", category: "us", type: "Equity", currency: "USD", keywords: ["nvidia", "gpu", "ai", "chips"] },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", category: "us", type: "Equity", currency: "USD", keywords: ["amazon", "ecommerce", "aws"] },
  { symbol: "GOOGL", name: "Alphabet Inc. (Google)", exchange: "NASDAQ", category: "us", type: "Equity", currency: "USD", keywords: ["google", "alphabet", "youtube"] },
  { symbol: "META", name: "Meta Platforms Inc. (Facebook)", exchange: "NASDAQ", category: "us", type: "Equity", currency: "USD", keywords: ["meta", "facebook", "instagram"] },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", category: "us", type: "Equity", currency: "USD", keywords: ["tesla", "ev", "elon"] },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "NASDAQ", category: "us", type: "Equity", currency: "USD", keywords: ["amd", "semiconductors"] },
  { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", category: "us", type: "Equity", currency: "USD", keywords: ["netflix", "streaming"] },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", exchange: "NYSE", category: "us", type: "Equity", currency: "USD", keywords: ["palantir", "ai", "defense"] },
  { symbol: "BRK-B", name: "Berkshire Hathaway Inc.", exchange: "NYSE", category: "us", type: "Equity", currency: "USD", keywords: ["buffett", "berkshire"] },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", category: "us", type: "Equity", currency: "USD", keywords: ["jpmorgan", "bank"] },

  // 📈 Global Indices & Benchmark ETFs
  { symbol: "^NSEI", name: "NIFTY 50 Index (India)", exchange: "NSE", category: "index", type: "Index", currency: "INR", keywords: ["nifty", "nifty50", "india50"] },
  { symbol: "^NSEBANK", name: "NIFTY Bank Index (India)", exchange: "NSE", category: "index", type: "Index", currency: "INR", keywords: ["banknifty", "bank nifty"] },
  { symbol: "^BSESN", name: "S&P BSE SENSEX (India)", exchange: "BSE", category: "index", type: "Index", currency: "INR", keywords: ["sensex", "bse"] },
  { symbol: "^GSPC", name: "S&P 500 Index (USA)", exchange: "NYSE", category: "index", type: "Index", currency: "USD", keywords: ["sp500", "spx", "s&p"] },
  { symbol: "^IXIC", name: "NASDAQ Composite Index", exchange: "NASDAQ", category: "index", type: "Index", currency: "USD", keywords: ["nasdaq", "tech index"] },
  { symbol: "^DJI", name: "Dow Jones Industrial Average", exchange: "NYSE", category: "index", type: "Index", currency: "USD", keywords: ["dow", "dow jones"] },
  { symbol: "^VIX", name: "CBOE Volatility Index", exchange: "CBOE", category: "index", type: "Index", currency: "USD", keywords: ["vix", "fear index"] },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE", category: "index", type: "ETF", currency: "USD", keywords: ["spy", "etf", "sp500"] },
  { symbol: "QQQ", name: "Invesco QQQ Trust (NASDAQ 100)", exchange: "NASDAQ", category: "index", type: "ETF", currency: "USD", keywords: ["qqq", "nasdaq 100"] },

  // ⚡ Cryptocurrencies & Forex (Bit vs USA, etc.)
  { symbol: "BTC-USD", name: "Bitcoin USD (Bit vs USA)", exchange: "CRYPTO", category: "crypto", type: "Cryptocurrency", currency: "USD", keywords: ["bit", "bitcoin", "bitvsusa", "bit vs usa", "btc", "btc-usd", "btc/usd", "crypto"] },
  { symbol: "ETH-USD", name: "Ethereum USD", exchange: "CRYPTO", category: "crypto", type: "Cryptocurrency", currency: "USD", keywords: ["eth", "ethereum", "crypto", "ether"] },
  { symbol: "SOL-USD", name: "Solana USD", exchange: "CRYPTO", category: "crypto", type: "Cryptocurrency", currency: "USD", keywords: ["sol", "solana", "crypto"] },
  { symbol: "EURUSD=X", name: "EUR / USD Forex", exchange: "FOREX", category: "crypto", type: "Currency Pair", currency: "USD", keywords: ["eur", "usd", "forex", "euro"] },
  { symbol: "USDINR=X", name: "USD / INR Forex", exchange: "FOREX", category: "crypto", type: "Currency Pair", currency: "INR", keywords: ["usd", "inr", "rupee", "forex"] },
];

interface StockSelectDropdownProps {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}

export default function StockSelectDropdown({
  value,
  onChange,
  className = "",
}: StockSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "india" | "us" | "commodity" | "index">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Selected item metadata
  const selectedItem = useMemo(() => {
    return (
      POPULAR_INSTRUMENTS.find((item) => item.symbol.toUpperCase() === value.toUpperCase()) || {
        symbol: value,
        name: value,
        exchange: value.endsWith(".NS") ? "NSE" : value.endsWith(".BO") ? "BSE" : "GLOBAL",
        category: "all" as const,
        type: "Securities",
        currency: (value.endsWith(".NS") || value.endsWith(".BO") ? "INR" : "USD") as "INR" | "USD",
      }
    );
  }, [value]);

  // Dynamic server search if query is longer than 2 characters
  const { data: serverSearchResults } = useQuery({
    queryKey: ["instrument-search", searchTerm],
    queryFn: () => searchInstruments(searchTerm),
    enabled: searchTerm.trim().length >= 2,
    staleTime: 60000,
  });

  // Filtered local list
  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q && activeTab === "all") return POPULAR_INSTRUMENTS;

    const tokens = q.split(/[\s/,-]+/).filter(Boolean);

    return POPULAR_INSTRUMENTS.filter((item) => {
      // Tab filter
      if (activeTab !== "all" && item.category !== activeTab) {
        return false;
      }
      if (!q) return true;

      const inSymbol = item.symbol.toLowerCase().includes(q);
      const inName = item.name.toLowerCase().includes(q);
      const inExchange = item.exchange.toLowerCase().includes(q);
      const inKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;

      const allSearchable = `${item.symbol} ${item.name} ${item.exchange} ${item.keywords?.join(" ") || ""}`.toLowerCase();
      const inTokens = tokens.length > 0 && tokens.every((tok) => allSearchable.includes(tok));

      return inSymbol || inName || inExchange || inKeywords || inTokens;
    });
  }, [searchTerm, activeTab]);

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onChange(searchTerm.trim().toUpperCase());
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* ── Trigger Button ────────────────────────────────────────────────────── */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-surface-2/80 backdrop-blur-md border ${
          isOpen ? "border-brand shadow-[0_0_15px_rgba(59,130,246,0.25)] ring-1 ring-brand" : "border-border hover:border-brand/60"
        } rounded-xl px-3.5 py-2.5 text-left text-sm flex items-center justify-between transition-all duration-200 focus:outline-none`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono font-bold text-text-primary text-sm tracking-wide bg-surface-3/80 px-2 py-0.5 rounded-md border border-border/40">
            {selectedItem.symbol}
          </span>
          <span className="text-xs text-text-muted truncate hidden sm:inline">
            {selectedItem.name}
          </span>
          <span className="badge badge-surface text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-surface-3 text-text-secondary shrink-0 border border-border/40">
            {selectedItem.exchange}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 ml-2"
        >
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </motion.div>
      </motion.button>

      {/* ── Dropdown Popover with Framer Motion ───────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 mt-2 z-50 bg-surface-1/95 border border-border/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden backdrop-blur-2xl w-full md:min-w-[460px]"
          >
            {/* Search Box Header */}
            <div className="p-3 border-b border-border/60 bg-surface-2/40">
              <form onSubmit={handleCustomSubmit} className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-brand pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search stock, commodity, crypto (e.g. Gold, BitvsUSA, Reliance, Apple)..."
                  className="w-full bg-surface-3/60 border border-border/80 rounded-xl pl-10 pr-9 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-inner"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 text-text-muted hover:text-text-primary p-0.5 rounded-full hover:bg-surface-3"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              {/* Category Filter Pills with layoutId animation */}
              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
                {[
                  { id: "all", label: "All Assets" },
                  { id: "india", label: "🇮🇳 India" },
                  { id: "us", label: "🇺🇸 US / Global" },
                  { id: "commodity", label: "🪙 Gold & Commodities" },
                  { id: "crypto", label: "⚡ Crypto & Forex" },
                  { id: "index", label: "📈 Indices" },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`relative px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors z-10 ${
                        isActive
                          ? "text-white font-semibold"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-3/50"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="stockCategoryTab"
                          className="absolute inset-0 bg-brand rounded-lg shadow-sm -z-10"
                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                        />
                      )}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instruments Scroll List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-border/20">
              {/* Quick option to use custom ticker */}
              {searchTerm.trim().length >= 2 && (
                <motion.div
                  whileHover={{ x: 3, backgroundColor: "rgba(59, 130, 246, 0.12)" }}
                  onClick={() => handleSelect(searchTerm.trim().toUpperCase())}
                  className="p-3 cursor-pointer flex items-center justify-between text-xs text-brand border-b border-brand/20 bg-brand/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand animate-pulse" />
                    <span>
                      Select ticker: <strong className="font-mono">{searchTerm.trim().toUpperCase()}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted uppercase font-mono bg-surface-3 px-2 py-0.5 rounded border border-border/40">
                    Press Enter ↵
                  </span>
                </motion.div>
              )}

              {filteredList.length === 0 && !serverSearchResults?.length ? (
                <div className="p-8 text-center text-xs text-text-muted space-y-2">
                  <p>No matching securities found for "{searchTerm}".</p>
                  <button
                    type="button"
                    onClick={() => handleSelect(searchTerm.trim().toUpperCase())}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors font-medium"
                  >
                    Use "{searchTerm.trim().toUpperCase()}" anyway
                  </button>
                </div>
              ) : (
                filteredList.map((stock) => {
                  const isSelected = stock.symbol.toUpperCase() === value.toUpperCase();
                  return (
                    <motion.button
                      key={stock.symbol}
                      type="button"
                      whileHover={{ x: 3, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                      onClick={() => handleSelect(stock.symbol)}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? "bg-brand/15 text-text-primary"
                          : "text-text-primary"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-text-primary">
                            {stock.symbol}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-3 text-text-secondary font-mono border border-border/30">
                            {stock.exchange}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {stock.type}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {stock.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-semibold text-text-muted px-1.5 py-0.5 rounded bg-surface-2 border border-border/30">
                          {stock.currency}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-brand" />}
                      </div>
                    </motion.button>
                  );
                })
              )}

              {/* External Search Results from Server */}
              {serverSearchResults && serverSearchResults.length > 0 && (
                <div className="p-2.5 bg-surface-2/40 text-[11px] font-semibold text-text-muted border-t border-border/40">
                  <div className="flex items-center gap-1.5 mb-1.5 text-text-secondary">
                    <Globe className="h-3 w-3 text-brand" />
                    <span>Global Market Live Matches:</span>
                  </div>
                  <div className="divide-y divide-border/20">
                    {serverSearchResults.map((sr: any) => (
                      <motion.button
                        key={sr.symbol}
                        type="button"
                        whileHover={{ x: 3 }}
                        onClick={() => handleSelect(sr.symbol)}
                        className="w-full py-2 px-2.5 flex items-center justify-between text-left hover:bg-surface-3/60 rounded-lg transition-colors text-xs text-text-primary"
                      >
                        <span className="font-mono font-bold">{sr.symbol}</span>
                        <span className="text-text-muted text-[11px] truncate mx-2">{sr.name}</span>
                        <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 bg-surface-3 rounded">
                          {sr.exchange}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="p-2.5 border-t border-border/50 bg-surface-2/30 flex items-center justify-between text-[10px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-brand" />
                <span>India (NSE/BSE), US, Commodities (Gold/Oil), Crypto & Forex</span>
              </span>
              <span className="font-mono">{filteredList.length} assets</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
