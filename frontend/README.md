# 💻 Frontend Trading & Research Platform (`frontend`)

The **Frontend Application** is an institutional-grade, responsive single-page web application built with **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**. It provides interactive technical charting, live WebSocket price streaming, multi-timeframe pattern recognition, and an AI Trading Copilot.

---

## 🎯 Key Features & Modules

1. **Pro Trading Chart Canvas (`src/components/charts/ProTradingChart.tsx`):**
   - High-FPS canvas powered by TradingView's Lightweight Charts library.
   - Five chart types: **Candlestick**, **Bar Chart**, **Area Chart**, **Line**, and **Baseline**.
   - Timeframe toggles: `1m`, `5m`, `15m`, `30m`, `1h`, `1d`, `1w`, `1mo`.
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
   - **Asset Screener (`src/pages/ScreenerPage.tsx`):** Filter instruments by market cap, sector, P/E ratio, RSI conditions, and 52-week proximity.
   - **Paper Portfolio (`src/pages/PortfolioPage.tsx`):** Multi-currency mock equity tracking with real-time mark-to-market P&L.
   - **Strategy Backtester (`src/pages/BacktestPage.tsx`):** Backtest technical rules with equity curves, Sharpe ratios, and drawdowns.
   - **Model Evaluation (`src/pages/ModelEvalPage.tsx`):** Inspect ML model accuracy, confusion matrices, and ROC-AUC curves.

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
