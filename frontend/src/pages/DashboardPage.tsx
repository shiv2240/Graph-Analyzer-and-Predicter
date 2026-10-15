import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  Bell,
  ChevronDown,
  Maximize2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  Menu,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Mock & Live Data Catalogs matching the reference design ──────────────────

interface GainerCard {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  intradayGain: number;
  bgGradient: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
  iconBg: string;
}

const TOP_GAINERS: GainerCard[] = [
  {
    symbol: "FOSL",
    name: "Fossil Group Inc.",
    price: 3.10,
    changePct: 31.91,
    intradayGain: 0.75,
    bgGradient: "bg-[#18260E]",
    borderColor: "border-[#84CC16]/30 hover:border-[#A3E635]",
    badgeBg: "bg-[#2A4016]",
    badgeColor: "text-[#A3E635]",
    iconBg: "bg-[#A3E635] text-black",
  },
  {
    symbol: "KPTI",
    name: "Karyopharm Therapeutics",
    price: 5.92,
    changePct: 27.31,
    intradayGain: 1.24,
    bgGradient: "bg-[#1E1A47]",
    borderColor: "border-[#6366F1]/30 hover:border-[#818CF8]",
    badgeBg: "bg-[#2E2866]",
    badgeColor: "text-[#818CF8]",
    iconBg: "bg-[#6366F1] text-white",
  },
  {
    symbol: "XNET",
    name: "Xunlei Limited",
    price: 6.39,
    changePct: 26.53,
    intradayGain: 1.34,
    bgGradient: "bg-[#331F0A]",
    borderColor: "border-[#F59E0B]/30 hover:border-[#FBBF24]",
    badgeBg: "bg-[#4B2F0F]",
    badgeColor: "text-[#FBBF24]",
    iconBg: "bg-[#F59E0B] text-black",
  },
  {
    symbol: "ARRY",
    name: "Array Technologies Inc.",
    price: 7.62,
    changePct: 25.33,
    intradayGain: 1.54,
    bgGradient: "bg-[#320F14]",
    borderColor: "border-[#EF4444]/30 hover:border-[#F87171]",
    badgeBg: "bg-[#4D181F]",
    badgeColor: "text-[#F87171]",
    iconBg: "bg-[#EF4444] text-white",
  },
  {
    symbol: "UNHG",
    name: "United Healthcare Group",
    price: 16.66,
    changePct: 2.22,
    intradayGain: 3.22,
    bgGradient: "bg-[#2C0D2C]",
    borderColor: "border-[#D946EF]/30 hover:border-[#E879F9]",
    badgeBg: "bg-[#451445]",
    badgeColor: "text-[#E879F9]",
    iconBg: "bg-[#D946EF] text-white",
  },
];

const TOP_LOSERS = [
  {
    symbol: "SY",
    price: 3.74,
    changePct: -22.73,
    intradayGain: -1.10,
    badgeBg: "bg-[#3A1418]",
    badgeColor: "text-[#F87171]",
    iconBg: "bg-[#C6F432] text-black",
    cardBg: "bg-[#1A2012]",
  },
  {
    symbol: "SLE",
    price: 3.20,
    changePct: -21.70,
    intradayGain: 2.89,
    badgeBg: "bg-[#1E3816]",
    badgeColor: "text-[#A3E635]",
    iconBg: "bg-[#F97316] text-black",
    cardBg: "bg-[#22140A]",
  },
];

interface MosaicStock {
  symbol: string;
  changePct: number;
  size: "large" | "medium" | "small";
  color: string;
  textColor: string;
  iconText: string;
}

const MOSAIC_TILES: MosaicStock[] = [
  { symbol: "IOBT", changePct: 68.75, size: "large", color: "bg-[#2F2113] border-[#F59E0B]/30", textColor: "text-amber-400", iconText: "IO" },
  { symbol: "PGEN", changePct: 58.92, size: "large", color: "bg-[#1A2814] border-[#84CC16]/30", textColor: "text-lime-400", iconText: "PGen" },
  { symbol: "MTNB", changePct: 43.03, size: "large", color: "bg-[#1C2417] border-[#A3E635]/30", textColor: "text-lime-300", iconText: "MD" },
  { symbol: "PPSI", changePct: 39.87, size: "large", color: "bg-[#252814] border-[#EAB308]/30", textColor: "text-yellow-400", iconText: "VP" },
  { symbol: "FOSL", changePct: 31.91, size: "medium", color: "bg-[#1F1C42] border-[#6366F1]/30", textColor: "text-indigo-400", iconText: "FS" },
  { symbol: "ARRY", changePct: 25.35, size: "medium", color: "bg-[#132A1F] border-[#10B981]/30", textColor: "text-emerald-400", iconText: "AR" },
  { symbol: "XNET", changePct: 26.35, size: "medium", color: "bg-[#331518] border-[#EF4444]/30", textColor: "text-red-400", iconText: "XN" },
  { symbol: "UNHG", changePct: 23.96, size: "medium", color: "bg-[#322010] border-[#F97316]/30", textColor: "text-orange-400", iconText: "UH" },
  { symbol: "NERV", changePct: 25.35, size: "small", color: "bg-[#2D1F13] border-[#F59E0B]/20", textColor: "text-amber-300", iconText: "N" },
  { symbol: "VERB", changePct: 23.69, size: "small", color: "bg-[#331B12] border-[#F97316]/20", textColor: "text-orange-300", iconText: "V" },
  { symbol: "HCTI", changePct: 20.91, size: "small", color: "bg-[#351815] border-[#EF4444]/20", textColor: "text-red-300", iconText: "H" },
  { symbol: "BNRG", changePct: 20.81, size: "small", color: "bg-[#2F2113] border-[#F59E0B]/20", textColor: "text-amber-300", iconText: "B" },
  { symbol: "MCRP", changePct: 17.16, size: "small", color: "bg-[#1E2514] border-[#84CC16]/20", textColor: "text-lime-300", iconText: "M" },
  { symbol: "SEDG", changePct: 16.65, size: "small", color: "bg-[#1C1A38] border-[#6366F1]/20", textColor: "text-indigo-300", iconText: "S" },
];

// Intraday wave points for the wave node chart
const WAVE_CHART_NODES = [
  { time: "16:00", value: 642.50, heightPct: 40 },
  { time: "", value: 645.80, heightPct: 62 },
  { time: "17:00", value: 643.20, heightPct: 45 },
  { time: "", value: 647.10, heightPct: 70 },
  { time: "", value: 644.00, heightPct: 52 },
  { time: "18:00", value: 648.90, heightPct: 82 },
  { time: "", value: 645.10, heightPct: 58 },
  { time: "", value: 643.00, heightPct: 44 },
  { time: "19:00", value: 647.50, heightPct: 74 },
  { time: "", value: 645.90, heightPct: 63 },
  { time: "", value: 648.20, heightPct: 79 },
  { time: "20:00", value: 644.80, heightPct: 55 },
  { time: "", value: 643.50, heightPct: 47 },
  { time: "", value: 647.90, heightPct: 76 },
  { time: "21:00", value: 646.80, heightPct: 68 },
];

const STOCK_RACERS = [
  { rank: 1, symbol: "IOBT", gain: "11.06%", price: "$2.84", progress: 88, color: "bg-[#A3E635]" },
  { rank: 2, symbol: "PGEN", gain: "8.00%", price: "$4.03", progress: 75, color: "bg-[#A3E635]" },
  { rank: 3, symbol: "MTNB", gain: "7.53%", price: "$6.58", progress: 68, color: "bg-[#A3E635]" },
  { rank: 4, symbol: "PPSI", gain: "4.90%", price: "$6.40", progress: 54, color: "bg-[#A3E635]" },
  { rank: 5, symbol: "FOSL", gain: "3.50%", price: "$13.89", progress: 44, color: "bg-[#84CC16]" },
  { rank: 6, symbol: "XNET", gain: "2.50%", price: "$5.15", progress: 38, color: "bg-[#84CC16]" },
  { rank: 7, symbol: "ARRY", gain: "2.20%", price: "$9.72", progress: 32, color: "bg-[#65A30D]" },
  { rank: 8, symbol: "UNHG", gain: "1.80%", price: "$16.07", progress: 28, color: "bg-[#65A30D]" },
  { rank: 9, symbol: "NERV", gain: "1.10%", price: "$8.28", progress: 22, color: "bg-[#4D7C0F]" },
];

const BREADTH_DISTRIBUTION = [
  { range: "<-15%", count: 180, height: 18, isPeak: false },
  { range: "-15--10%", count: 420, height: 26, isPeak: false },
  { range: "-5--2%", count: 1100, height: 45, isPeak: false },
  { range: "-2--0%", count: 2100, height: 60, isPeak: false },
  { range: "0%", count: 1850, height: 55, isPeak: false },
  { range: "2-5%", count: 3840, height: 95, isPeak: true }, // PEAK ADVANCER
  { range: "5-10%", count: 2450, height: 68, isPeak: false },
  { range: "10-15%", count: 1200, height: 48, isPeak: false },
  { range: ">15%", count: 520, height: 30, isPeak: false },
];

export default function DashboardPage() {
  const [selectedStock, setSelectedStock] = useState("IOBT");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRacePlaying, setIsRacePlaying] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<{ time: string; value: number } | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0D10] text-[#E5E7EB] font-sans -m-4 md:-m-6 p-4 md:p-6 space-y-6 relative overflow-hidden">
      {/* ── Background Subtle Ambient Neon Radial Glow ─────────────────────────── */}
      <div className="absolute top-0 left-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_top_left,rgba(198,244,50,0.08),transparent_70%)] pointer-events-none" />

      {/* ── Top Header Navigation Bar ─────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#181F26] relative z-10">
        {/* Left: Branding & Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#D4F938] text-black shadow-[0_0_25px_rgba(212,249,56,0.4)] shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <button className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors">
            <Menu className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors" title="Market Overview">
            <Info className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="relative flex-1 max-w-md mx-auto w-full">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets, gainers, crypto..."
              className="w-full bg-[#14181F] border border-[#212833] rounded-full pl-10 pr-12 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#D4F938] focus:ring-1 focus:ring-[#D4F938] transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-3 text-text-muted border border-border/40">
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Right: Notification & Profile */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Notification Button */}
          <button className="relative p-2.5 rounded-full bg-[#14181F] border border-[#212833] text-text-muted hover:text-white hover:border-[#D4F938]/40 transition-all">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#D4F938] ring-2 ring-[#0A0D10]" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#14181F] border border-[#212833] hover:border-white/20 transition-all cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand to-[#D4F938] text-black font-extrabold text-xs flex items-center justify-center">
              AB
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-white block leading-tight">Abadul Biswas</span>
              <span className="text-[10px] text-text-muted font-mono flex items-center gap-1 leading-tight">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                15 Min Delayed
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          </div>
        </div>
      </header>

      {/* ── Top Ribbon: Biggest Gainers & Biggest Losers ──────────────────────── */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Left: Biggest Gainers (8 cols) */}
          <div className="xl:col-span-9 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#D4F938]/10 text-[#D4F938]">
                  <Radio className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-bold text-white">Biggest Gainers</h2>
              </div>
              <Link to="/screener" className="text-xs font-semibold text-text-muted hover:text-[#D4F938] transition-colors flex items-center gap-1">
                See all &gt;
              </Link>
            </div>

            {/* Horizontal Cards Scroll */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {TOP_GAINERS.map((stock) => (
                <motion.div
                  key={stock.symbol}
                  whileHover={{ y: -3, scale: 1.01 }}
                  onClick={() => setSelectedStock(stock.symbol)}
                  className={`p-3.5 rounded-2xl border ${stock.borderColor} ${stock.bgGradient} transition-all cursor-pointer shadow-lg relative overflow-hidden group`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {/* Circle Initial Icon */}
                    <div className={`w-7 h-7 rounded-full ${stock.iconBg} font-extrabold text-[10px] flex items-center justify-center shadow-md`}>
                      {stock.symbol.slice(0, 2)}
                    </div>
                    {/* Intraday Gain Pill */}
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${stock.badgeBg} ${stock.badgeColor} flex items-center gap-0.5`}>
                      ▲ {stock.intradayGain}%
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-text-muted block">{stock.symbol}</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-extrabold text-white tracking-tight">${stock.price.toFixed(2)}</span>
                    <span className="text-[11px] font-mono text-text-muted">({stock.changePct.toFixed(2)}%)</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Biggest Losers (3 cols) */}
          <div className="xl:col-span-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                  <TrendingDown className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-bold text-white">Biggest Losers</h2>
              </div>
              <Link to="/screener" className="text-xs font-semibold text-text-muted hover:text-red-400 transition-colors flex items-center gap-1">
                See all &gt;
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TOP_LOSERS.map((loser) => (
                <motion.div
                  key={loser.symbol}
                  whileHover={{ y: -3 }}
                  className={`p-3.5 rounded-2xl border border-white/5 ${loser.cardBg} transition-all cursor-pointer shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-7 h-7 rounded-full ${loser.iconBg} font-extrabold text-[10px] flex items-center justify-center shadow-md`}>
                      {loser.symbol}
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${loser.badgeBg} ${loser.badgeColor}`}>
                      {loser.intradayGain >= 0 ? "▲" : "▼"} {loser.intradayGain}%
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-text-muted block">{loser.symbol}</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-extrabold text-white">${loser.price.toFixed(2)}</span>
                    <span className="text-[11px] font-mono text-red-400">({loser.changePct.toFixed(2)}%)</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main 2x2 Analytical Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── CARD 1: Friday's Biggest Gainers (%) Mosaic Matrix ────────────────── */}
        <div className="bg-[#101419] border border-[#1E2530] rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#D4F938]/10 text-[#D4F938]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Friday's Biggest Gainers (%)</h3>
            </div>
            <button className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Mosaic Treemap Matrix Layout */}
          <div className="grid grid-cols-4 gap-2.5">
            {/* Big 4 Hero Tiles */}
            {MOSAIC_TILES.slice(0, 4).map((tile) => (
              <motion.div
                key={tile.symbol}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedStock(tile.symbol)}
                className={`p-3.5 rounded-2xl border ${tile.color} transition-all cursor-pointer shadow-md flex flex-col justify-between h-24 ${
                  selectedStock === tile.symbol ? "ring-2 ring-[#D4F938] shadow-[0_0_15px_rgba(212,249,56,0.2)]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white font-extrabold text-[9px] flex items-center justify-center">
                    {tile.iconText}
                  </span>
                  <span className="font-mono text-xs font-bold text-white">{tile.symbol}</span>
                </div>
                <span className={`text-xl font-extrabold font-mono ${tile.textColor}`}>
                  {tile.changePct.toFixed(2)}%
                </span>
              </motion.div>
            ))}

            {/* Medium 4 Secondary Tiles */}
            {MOSAIC_TILES.slice(4, 8).map((tile) => (
              <motion.div
                key={tile.symbol}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedStock(tile.symbol)}
                className={`p-3 rounded-2xl border ${tile.color} transition-all cursor-pointer shadow-md flex flex-col justify-between h-20 ${
                  selectedStock === tile.symbol ? "ring-2 ring-[#D4F938]" : ""
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-white/10 text-white font-bold text-[8px] flex items-center justify-center">
                    {tile.iconText}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-white">{tile.symbol}</span>
                </div>
                <span className={`text-base font-extrabold font-mono ${tile.textColor}`}>
                  {tile.changePct.toFixed(2)}%
                </span>
              </motion.div>
            ))}

            {/* Small 6 Mini Tiles */}
            {MOSAIC_TILES.slice(8, 14).map((tile) => (
              <motion.div
                key={tile.symbol}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedStock(tile.symbol)}
                className={`p-2.5 rounded-xl border ${tile.color} transition-all cursor-pointer shadow-sm flex items-center justify-between col-span-2 sm:col-span-1 h-14 ${
                  selectedStock === tile.symbol ? "ring-2 ring-[#D4F938]" : ""
                }`}
              >
                <span className="font-mono text-[10px] font-bold text-white">{tile.symbol}</span>
                <span className={`text-xs font-extrabold font-mono ${tile.textColor}`}>
                  {tile.changePct.toFixed(2)}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── CARD 2: Selected Asset Intraday Wave Chart (e.g. IOBT) ────────────── */}
        <div className="bg-[#101419] border border-[#1E2530] rounded-3xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#D4F938] text-black font-black text-xs flex items-center justify-center shadow-[0_0_15px_rgba(212,249,56,0.3)]">
                {selectedStock.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{selectedStock}</h3>
                  <span className="text-[11px] font-mono font-bold text-[#A3E635] bg-[#A3E635]/10 px-2 py-0.5 rounded-full">
                    +68.75% High
                  </span>
                </div>
                <span className="text-[10px] text-text-muted font-mono">Live Intraday Liquidity Wave</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/stocks/${selectedStock === "IOBT" ? "BTC-USD" : selectedStock}`}
                className="text-[11px] font-mono text-[#D4F938] hover:underline flex items-center gap-1"
              >
                Open in Pro Trader <ArrowUpRight className="h-3 w-3" />
              </Link>
              <button className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interactive Golden Node Wave Chart Canvas */}
          <div className="relative h-64 w-full bg-[#0D1015]/60 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
            {/* Price axis labels on right */}
            <div className="absolute right-3 top-3 bottom-8 flex flex-col justify-between text-[10px] font-mono text-text-muted text-right pointer-events-none">
              <span>$649.00</span>
              <span>$646.00</span>
              <span>$644.00</span>
              <span>$640.00</span>
            </div>

            {/* Connecting Wave SVG Path */}
            <svg className="absolute inset-0 w-full h-full p-4 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Subtle background glow curve */}
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.5"
                points={WAVE_CHART_NODES.map((n, i) => `${((i / (WAVE_CHART_NODES.length - 1)) * 94 + 3).toFixed(2)},${(100 - n.heightPct).toFixed(2)}`).join(" ")}
              />
            </svg>

            {/* Glowing Golden Nodes & Vertical Pin Bars */}
            <div className="relative h-full flex items-end justify-between px-2 pb-6">
              {WAVE_CHART_NODES.map((node, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col items-center group cursor-pointer"
                  style={{ height: `${node.heightPct}%` }}
                  onMouseEnter={() => setHoveredNode({ time: node.time || "Intraday Tick", value: node.value })}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Glowing Amber Pin Bar */}
                  <div className="w-[1.5px] h-full bg-gradient-to-t from-transparent via-[#F59E0B]/30 to-[#F59E0B]/80 group-hover:to-[#D4F938]" />

                  {/* Golden Glowing Node */}
                  <motion.div
                    whileHover={{ scale: 1.5 }}
                    className="w-3 h-3 rounded-full bg-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.8)] border-2 border-[#101419] absolute -top-1.5 transition-all group-hover:bg-[#D4F938] group-hover:shadow-[0_0_16px_rgba(212,249,56,0.9)]"
                  />
                </div>
              ))}
            </div>

            {/* Hover Tooltip Box */}
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#14181F] border border-[#D4F938]/40 shadow-xl text-xs font-mono"
              >
                <span className="text-text-muted">{hoveredNode.time}: </span>
                <span className="font-extrabold text-[#D4F938]">${hoveredNode.value.toFixed(2)}</span>
              </motion.div>
            )}

            {/* Bottom Timeline Axis */}
            <div className="flex justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-border/40 px-2">
              <span>16:00</span>
              <span>17:00</span>
              <span>18:00</span>
              <span>19:00</span>
              <span>20:00</span>
              <span>21:00</span>
            </div>
          </div>
        </div>

        {/* ── CARD 3: Biggest Gainers (%) Stock Race Replay ─────────────────────── */}
        <div className="bg-[#101419] border border-[#1E2530] rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#D4F938]/10 text-[#D4F938]">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Biggest Gainers (%) Stock Race Replay</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRacePlaying(!isRacePlaying)}
                className="p-1.5 rounded-lg text-text-muted hover:text-[#D4F938] hover:bg-white/5 transition-colors text-xs flex items-center gap-1"
                title="Play/Pause race simulation"
              >
                {isRacePlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline font-mono">{isRacePlaying ? "Live" : "Paused"}</span>
              </button>
              <button className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Race Track Canvas with Finish Line Checkered Pattern */}
          <div className="relative rounded-2xl bg-[#0D1015]/80 border border-white/5 p-4 flex">
            {/* Race Tracks Column */}
            <div className="flex-1 space-y-2 pr-8">
              {STOCK_RACERS.map((racer) => (
                <div key={racer.symbol} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {/* Runner Progress Pill */}
                    <motion.div
                      animate={isRacePlaying ? { x: [0, 4, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ width: `${racer.progress}%` }}
                      className="flex items-center justify-between px-2 py-1 rounded-xl bg-[#233512] border border-[#A3E635]/40 shadow-sm"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-white">{racer.gain}</span>
                        <div className="w-4 h-4 rounded-full bg-[#A3E635] text-black font-extrabold text-[8px] flex items-center justify-center">
                          {racer.rank}
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">{racer.price}</span>
                      </div>
                      <ArrowUpRight className="h-2.5 w-2.5 text-[#A3E635]" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkered Flag Finish Line Pattern */}
            <div className="w-12 border-l border-dashed border-white/20 flex flex-col justify-center items-center relative overflow-hidden bg-white/5 rounded-r-xl">
              <div
                className="w-full h-full opacity-80"
                style={{
                  backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%), 
                                    linear-gradient(-45deg, #000 25%, transparent 25%), 
                                    linear-gradient(45deg, transparent 75%, #000 75%), 
                                    linear-gradient(-45deg, transparent 75%, #000 75%)`,
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                  backgroundColor: "#FFF",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── CARD 4: Advancers & Decliners Distribution ───────────────────────── */}
        <div className="bg-[#101419] border border-[#1E2530] rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#D4F938]/10 text-[#D4F938]">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Advancers &amp; Decliners Distribution</h3>
            </div>
            <button className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Market Breadth Histogram Canvas */}
          <div className="relative h-64 rounded-2xl bg-[#0D1015]/80 border border-white/5 p-4 flex flex-col justify-between">
            {/* Count Axis scale on left */}
            <div className="absolute left-3 top-3 bottom-8 flex flex-col justify-between text-[10px] font-mono text-text-muted pointer-events-none">
              <span>4k</span>
              <span>3k</span>
              <span>2k</span>
              <span>1k</span>
              <span>0</span>
            </div>

            {/* Histogram Columns */}
            <div className="h-full flex items-end justify-between pl-8 pr-2 pb-6 gap-1.5">
              {BREADTH_DISTRIBUTION.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded bg-surface-3 border border-border text-[10px] font-mono text-white whitespace-nowrap shadow-lg">
                    {item.count} assets
                  </div>

                  {/* Histogram Bar */}
                  <div
                    style={{ height: `${item.height}%` }}
                    className={`w-full rounded-t-lg transition-all ${
                      item.isPeak
                        ? "bg-gradient-to-t from-[#84CC16] to-[#D4F938] shadow-[0_0_25px_rgba(212,249,56,0.45)] relative"
                        : "bg-[#1B222C] hover:bg-[#2A3442]"
                    }`}
                  >
                    {/* Glowing Beacon Node on the Peak Bar */}
                    {item.isPeak && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_12px_#FFF] ring-2 ring-[#D4F938]" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Category Labels */}
            <div className="flex justify-between text-[9px] font-mono text-text-muted pl-8 pr-2 pt-2 border-t border-border/40">
              {BREADTH_DISTRIBUTION.map((item, idx) => (
                <span key={idx} className={item.isPeak ? "text-[#D4F938] font-bold" : ""}>
                  {item.range}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
