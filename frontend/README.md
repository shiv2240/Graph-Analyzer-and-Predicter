# 💻 Frontend Trading & Research Platform (`frontend`)

The **Frontend Application** is an institutional-grade, responsive single-page web application built with **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**. It provides interactive technical charting, live WebSocket price streaming, multi-timeframe pattern recognition, machine learning model evaluation, and an AI Trading Copilot.

---

## 🎯 Key Features & Modules

1. **Pro Trading Chart Canvas & Drawing Tools (`src/components/charts/ProTradingChart.tsx`):**
   - High-FPS canvas powered by TradingView's Lightweight Charts library.
   - **Upstox-Grade Ultra-Smooth Resizing:** Debounced `ResizeObserver` lifecycle management with hardware-accelerated transforms prevents canvas freezing and layout jitter during window resizing.
   - **Pure Pitch-Black Obsidian Theme:** Pitch-black background (`#000000`) with zero blue tints, high-contrast candlesticks, and sleek glassmorphism panels.
   - Five chart types: **Candlestick**, **Bar Chart**, **Area Chart**, **Line**, and **Baseline**.
   - Comprehensive timeframe filters: `1m`, `5m`, `15m`, `30m`, `1H`, `1D`, `1W`, `1M`, **`1Y` (1 Year)**, **`5Y` (5 Years)**, and **`ALL` (All-Time multi-decade history)**.
   - **Real-Time Market Session Badge:** High-visibility pulsating **"Market Open"** (emerald glow) or **"Market Closed"** (rose pill) badge rendered directly on the right side of the chart toolbar and top page header.
   - **Interactive Technical Analysis & Drawing Editor Dropdown:**
     - ✏️ **Pencil (Freehand):** Freeform annotations, marking candle tops/bottoms, and custom pattern outlines.
     - 📏 **Line (Trendline / Ray):** Precision ray vectors for support/resistance channels and breakout trendlines.
     - 🔲 **Square / Rectangle:** Visualizing order blocks, supply/demand zones, and consolidation ranges with semi-transparent tints.
     - 🎨 **Customization Bar:** 6 curated colors (Lime, Cyan, Yellow, Red, Purple, White) + 3 stroke widths (Fine, Medium, Bold) + Undo & Clear All.
     - ⚡ **Floating Status Bar:** Active drawing mode badge with instant Done toggle and <kbd>Esc</kbd> shortcut.
   - Technical overlays: SMA 20 (fast trend), SMA 50 (intermediate trend), SMA 200 (institutional baseline), and Bollinger Bands.
   - Live stream status indicator showing continuous Binance 24/7 WebSocket ticks for crypto or live Interbank polling.

2. **AI Trading Copilot & Multi-Timeframe Confluence (`src/components/ui/AICopilotPanel.tsx`):**
   - **Interactive Refresh Button:** Instant single-click refresh button located directly next to the "AI Trading Copilot" title to re-evaluate signals immediately against live market ticks.
   - **Multi-Timeframe Radar Matrix:** Interactive radar displaying directional bias across 7 independent timeframes (`1M`, `5M`, `15M`, `30M`, `1H`, `1D`, `1W`).
   - **Yesterday's Session Benchmark Card:** Real-time benchmark displaying Yesterday's High, Low, Close, and Floor Pivots ($P$, $R_1$, $S_1$) alongside position status (`INSIDE_RANGE`, `BREAKOUT_ABOVE_HIGH`, `BREAKDOWN_BELOW_LOW`).
   - **Confluence Scoring (0% – 100%):** Tally of Bullish vs. Bearish timeframes producing clear directional verdicts (`STRONG BUY`, `BULLISH LEAN`, `NEUTRAL / HOLD`, `BEARISH LEAN`, `STRONG SELL`) and explicit execution boundaries.
   - **Pattern Recognition & Market Turn Badges:** Dynamically identifies and displays reversal patterns including Bullish Pin Bars / Hammers, Shooting Stars, Bullish/Bearish Engulfing candles, and Double Bottom/Top pivots.
   - **Interactive Analyst Chat:** In-panel query box to ask instant questions regarding scalping setups, investment verdicts, and invalidation stop levels.

3. **Stock & Asset Intelligence Suite:**
   - **Stock Analysis Page (`src/pages/StockAnalysisPage.tsx`):** Split workspace integrating pro charting, RSI/MACD sub-oscillators, live order metrics, and AI Copilot.
   - **Stock Explorer (`src/pages/StockExplorerPage.tsx`):** Browse and search Indian bluechips (NSE/BSE), US equities (NASDAQ/NYSE), precious metals & commodities (Gold/Silver), and crypto.
   - **AI Equity Research (`src/pages/AIResearchPage.tsx`):** Quantitative research note synthesizer with auto-currency detection ($ USD and ₹ INR).
   - **Multi-Market Quantitative Screener (`src/pages/ScreenerPage.tsx`):**
     - Full **95+ universe** covering the entire **NIFTY 50** Indian benchmark + top **US NASDAQ/NYSE** leadership equities + crypto/commodities.
     - **Market Switcher:** Segmented toggles for `All Markets`, `🇮🇳 India (NSE/BSE)`, and `🇺🇸 USA (NASDAQ/NYSE)`.
     - **Live Search Bar:** Instant direct search by ticker symbol, company name, or industry sector with reset controls.
     - **Interactive Pagination:** Responsive pagination controls with customizable rows-per-page (`10`, `20`, `50`, `100`).
   - **Paper Portfolio (`src/pages/PortfolioPage.tsx`):** Multi-currency mock equity tracking with real-time mark-to-market P&L.
   - **Strategy Backtester (`src/pages/BacktestPage.tsx`):** Backtest technical rules with equity curves, Sharpe ratios, and drawdowns.
   - **Model Evaluation (`src/pages/ModelEvalPage.tsx`):** Inspect real ML model performance metrics: **53.5%–58.2% directional accuracy**, confusion matrices, Brier loss, and ROC-AUC curves across all 4 architectures (XGBoost, Random Forest, Logistic Regression, Baseline).

4. **Defensive Error Shielding & Clean Teardown (`src/main.tsx` & `src/services/liveStreamService.ts`):**
   - **Browser Extension Isolation:** Global `window.addEventListener("unhandledrejection")` and `window.addEventListener("error")` interceptors isolate and silence third-party browser extension noise (`content.js`, `polyfill.js`, `chrome-extension://`, `useCache`) so they never disrupt React error boundaries.
   - **WebSocket Teardown Debouncing:** Connection establishment in `useLiveMarketStream` is debounced by 150ms to prevent React 18 StrictMode mount/unmount and rapid timeframe switch storms. Clean unmount codes (`1000 ("Clean unmount")`) and inert dummy handlers prevent `Ping received after close` race conditions.

---

## 📂 Directory Layout

```
frontend/
├── src/
│   ├── components/
│   │   ├── charts/              # TradingView Lightweight Charts implementations
│   │   │   ├── CandlestickChart.tsx
│   │   │   └── ProTradingChart.tsx # Pro charting with drawing tools & market status badge
│   │   ├── layout/              # Sidebar navigation, header, and top navbar
│   │   └── ui/                  # Reusable UI widgets
│   │       ├── AICopilotPanel.tsx       # Live Copilot decision engine & MTF radar
│   │       ├── CandleDataTableModal.tsx # Full historical OHLCV data table inspector
│   │       ├── StockSelectDropdown.tsx  # Global instrument selector catalogue
│   │       └── States.tsx               # Loading, error, and empty state spinners
│   ├── pages/                   # Application route views
│   │   ├── AIResearchPage.tsx   # AI institutional report generator
│   │   ├── BacktestPage.tsx     # Strategy backtester
│   │   ├── DashboardPage.tsx    # High-level market indices overview
│   │   ├── ModelEvalPage.tsx    # ML model performance metrics & architecture cards
│   │   ├── PortfolioPage.tsx    # Multi-currency mock paper trading
│   │   ├── ScreenerPage.tsx     # Technical & fundamental asset screener
│   │   ├── SettingsPage.tsx     # Theme, API provider, and system settings
│   │   ├── StockAnalysisPage.tsx# Primary pro charting workspace & Copilot
│   │   └── StockExplorerPage.tsx# Instrument catalogue browser
│   ├── services/
│   │   ├── apiClient.ts         # Axios client with interceptors and base configuration
│   │   ├── liveStreamService.ts # Real-time Binance WebSocket, polling & market status
│   │   └── marketData.ts        # Zod validation schemas and React Query fetchers
│   ├── App.tsx                  # React Router configuration
│   ├── index.css                # Tailwind CSS custom themes & dark mode variables
│   └── main.tsx                 # React DOM root mounting & extension error filter
├── index.html                   # HTML5 page skeleton
├── package.json                 # Frontend dependencies and scripts
├── tailwind.config.ts           # Tailwind CSS theme extensions
├── tsconfig.json                # TypeScript project configuration
├── vite.config.ts               # Vite bundler configuration & dev server proxy
└── README.md                    # This document
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
- Node.js `>= 20.x`
- npm `>= 10.x`

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Launch Vite Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173` (or `http://localhost:5174`).

### 3. Build for Production
```bash
npm run build
npm run preview
```
