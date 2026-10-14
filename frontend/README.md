# 💻 Frontend Trading & Research Platform (`frontend`)

The **Frontend Application** is an institutional-grade, responsive single-page web application built with **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**. It provides interactive technical charting, live WebSocket price streaming, multi-timeframe pattern recognition, and an AI Trading Copilot.

---

## 🎯 Key Features & Modules

1. **Pro Trading Chart Canvas & Drawing Tools (`src/components/charts/ProTradingChart.tsx`):**
   - High-FPS canvas powered by TradingView's Lightweight Charts library.
   - Five chart types: **Candlestick**, **Bar Chart**, **Area Chart**, **Line**, and **Baseline**.
   - Comprehensive timeframe filters with smooth horizontal overflow handling: `1m`, `5m`, `15m`, `30m`, `1H`, `1D`, `1W`, `1M`, **`1Y` (1 Year)**, **`5Y` (5 Years)**, and **`ALL` (All-Time multi-decade history)**.
   - **Interactive Technical Analysis & Drawing Editor Dropdown:**
     - ✏️ **Pencil (Freehand):** Freeform annotations, marking candle tops/bottoms, and custom pattern outlines.
     - 📏 **Line (Trendline / Ray):** Precision ray vectors for support/resistance channels and breakout trendlines.
     - 🔲 **Square / Rectangle:** Visualizing order blocks, supply/demand zones, and consolidation ranges with semi-transparent tints.
     - 🎨 **Customization Bar:** 6 curated colors (Lime, Cyan, Yellow, Red, Purple, White) + 3 stroke widths (Fine, Medium, Bold) + Undo & Clear All.
     - ⚡ **Floating Status Bar:** Active drawing mode badge with instant Done toggle and <kbd>Esc</kbd> shortcut.
   - Technical overlays: SMA 20 (fast trend), SMA 50 (intermediate trend), SMA 200 (institutional baseline), and Bollinger Bands.
   - Live stream status indicator showing continuous Binance 24/7 WebSocket ticks for crypto or live Interbank polling.

2. **AI Trading Copilot Panel (`src/components/ui/AICopilotPanel.tsx`):**
   - **Interactive Refresh Button:** Instant single-click refresh button located directly next to the "AI Trading Copilot" title to re-evaluate signals immediately against live market ticks.
   - **Multi-Pillar Confluence Engine:** Evaluates trend structure, RSI momentum, volatility expansion, and XGBoost probabilistic fit.
   - **Pattern Recognition & Market Turn Badges:** Dynamically identifies and displays reversal patterns including Bullish Pin Bars / Hammers, Shooting Stars, Bullish/Bearish Engulfing candles, and Double Bottom/Top pivots.
   - **Micro vs. Macro Horizons:** Synthesizes the last 10 minutes/bars of micro momentum velocity with multi-week macro channel positioning.
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
     - **Quantitative Presets:** One-click filtering for Oversold Pullbacks (RSI < 35), Bullish Momentum, and regional leadership.
   - **Paper Portfolio (`src/pages/PortfolioPage.tsx`):** Multi-currency mock equity tracking with real-time mark-to-market P&L.
   - **Strategy Backtester (`src/pages/BacktestPage.tsx`):** Backtest technical rules with equity curves, Sharpe ratios, and drawdowns.
   - **Model Evaluation (`src/pages/ModelEvalPage.tsx`):** Inspect real ML model performance metrics: **53.5%–58.2% directional accuracy**, confusion matrices, Brier loss, and ROC-AUC curves.

---

## 📂 Directory Layout

```
frontend/
├── src/
│   ├── components/
│   │   ├── charts/              # TradingView Lightweight Charts implementations
│   │   │   ├── CandlestickChart.tsx
│   │   │   └── ProTradingChart.tsx
│   │   ├── layout/              # Sidebar navigation, header, and top navbar
│   │   └── ui/                  # Reusable UI widgets
│   │       ├── AICopilotPanel.tsx       # Live Copilot decision engine & refresh button
│   │       ├── CandleDataTableModal.tsx # Full historical OHLCV data table inspector
│   │       ├── StockSelectDropdown.tsx  # Global instrument selector catalogue
│   │       └── States.tsx               # Loading, error, and empty state spinners
│   ├── pages/                   # Application route views
│   │   ├── AIResearchPage.tsx   # AI institutional report generator
│   │   ├── BacktestPage.tsx     # Strategy backtester
│   │   ├── DashboardPage.tsx    # High-level market indices overview
│   │   ├── ModelEvalPage.tsx    # Machine learning model performance metrics
│   │   ├── PortfolioPage.tsx    # Multi-currency mock paper trading
│   │   ├── ScreenerPage.tsx     # Technical & fundamental asset screener
│   │   ├── SettingsPage.tsx     # Theme, API provider, and system settings
│   │   ├── StockAnalysisPage.tsx# Primary pro charting workspace & Copilot
│   │   └── StockExplorerPage.tsx# Instrument catalogue browser
│   ├── services/
│   │   ├── apiClient.ts         # Axios client with interceptors and base configuration
│   │   ├── liveStreamService.ts # Real-time Binance WebSocket & polling stream
│   │   └── marketData.ts        # Zod validation schemas and React Query fetchers
│   ├── App.tsx                  # React Router configuration
│   ├── index.css                # Tailwind CSS custom themes & dark mode variables
│   └── main.tsx                 # React DOM root mounting
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

The application will start immediately at:
👉 **`http://localhost:5173`**

Vite's proxy automatically routes `/api/v1` calls to the backend on `http://localhost:3001`.

### 3. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in `./dist`.

### 4. Preview Production Build Locally
```bash
npm run preview
```

---

## 🎨 Design System & Accessibility

- **Theme:** Sleek dark-mode palette tailored for professional traders (deep surfaces `#0B0E14`, `#0E131E`, borders `#1E293B`, positive emerald `#10B981`, negative rose `#EF4444`, brand indigo `#6366F1`).
- **Typography:** JetBrains Mono for monetary values and percentages; Inter/system sans for analytical copy.
- **Animations:** Lightweight 60 FPS transitions powered by Framer Motion.
