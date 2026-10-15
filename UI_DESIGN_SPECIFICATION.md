# 🎨 Stock Intelligence AI & Graph Analyzer — UI/UX Master Redesign Specification

> **Document Purpose:** This document provides a complete, granular, component-by-component design and technical specification for the **Stock Intelligence AI & Graph Analyzer** platform. You can feed this entire document directly to any AI design model, UI generator (e.g., v0.dev, Lovable, Claude 3.5 Sonnet, Galileo AI), or human UI/UX designer to completely redesign or generate the next-generation user interface.

---

## 📑 Table of Contents
1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [Target Aesthetic & Design Language](#2-target-aesthetic--design-language)
3. [Global App Shell & Navigation Layout](#3-global-app-shell--navigation-layout)
4. [Page 1: Pro Stock Analysis & Trading Workspace (`/analysis/:symbol`)](#4-page-1-pro-stock-analysis--trading-workspace)
5. [Page 2: Institutional Multi-Market Screener (`/screener`)](#5-page-2-institutional-multi-market-screener)
6. [Page 3: Market Intelligence Dashboard (`/`)](#6-page-3-market-intelligence-dashboard)
7. [Page 4: AI Equity Research & Narrative Reports (`/research`)](#7-page-4-ai-equity-research--narrative-reports)
8. [Page 5: Paper Portfolio & Strategy Backtester (`/portfolio` & `/backtest`)](#8-page-5-paper-portfolio--strategy-backtester)
9. [Page 6: Quantitative Model Evaluation & Integrity (`/model-eval`)](#9-page-6-quantitative-model-evaluation--integrity)
10. [Design System Tokens (Colors, Typography, Elevation)](#10-design-system-tokens)
11. [Copy-Paste Master Prompt for AI Designers](#11-copy-paste-master-prompt-for-ai-designers)

---

## 1. Executive Summary & Product Vision

### 1.1 What is the Product?
**Stock Intelligence AI** is an institutional-grade, multi-asset quantitative trading terminal and AI market intelligence workstation. It covers **Indian Equities (NSE/BSE)**, **US Equities (NASDAQ/NYSE)**, **Commodities (Gold, Silver, Crude Oil)**, and **Cryptocurrency (BTC, ETH, SOL)**.

### 1.2 Who is the User?
- **Active Intraday & Swing Traders:** Need high-frequency, clean TradingView-style charts, multi-timeframe filters (`1m` to `ALL`), drawing tools (order blocks, trendlines), and instant confluence signals.
- **Quantitative Investors:** Need transparent, non-hallucinated machine learning directional probabilities (53.5%–58.2% realistic statistical edge), walk-forward validation, and algorithmic screening.
- **Retail Investors:** Need clear, actionable verdicts (Entry, Target 1, Target 2, Invalidation Stop-Loss) with plain-English AI explanations.

### 1.3 Key Differentiator
Unlike generic charting tools or hype-driven "99% win rate" bots, this platform pairs **mathematical technical confluence** (RSI, Bollinger Bands, Moving Averages, Candlestick Reversal Formations) with **honest, verified machine learning models** (XGBoost, Random Forest) that explicitly show real out-of-sample edge without lookahead bias.

---

## 2. Target Aesthetic & Design Language

| Attribute | Specification |
| :--- | :--- |
| **Theme** | **Deep Institutional Dark Mode** (Inspired by Linear.app, Bloomberg Terminal, TradingView Pro, Raycast). |
| **Color Philosophy** | Obsidian `#0B0E14` and Carbon `#111622` backgrounds. Subtle slate borders (`#1E293B`). Neon lime green (`#10B981`) for bullish/positive states, electric rose (`#EF4444`) for bearish/negative states, and institutional cyan (`#06B6D4`) or blue (`#3B82F6`) for brand accents. |
| **Typography** | **UI/Headings:** `Inter`, `Outfit`, or `Plus Jakarta Sans` (Clean, geometric, premium).<br>**Financial Data & Numbers:** `JetBrains Mono`, `Roboto Mono`, or tabular numbers (`font-variant-numeric: tabular-nums`) to prevent jittering when prices tick. |
| **Depth & Materials** | Subtle glassmorphic cards (`backdrop-blur-md` with `bg-surface/80`), 1px borders with 40-60% opacity, minimal clean shadows (`shadow-2xl` on modals and dropdowns). |
| **Density** | High information density suitable for financial multi-tasking without feeling cluttered. Clean padding and rounded corners (`rounded-xl` / `rounded-2xl`). |

---

## 3. Global App Shell & Navigation Layout

The application utilizes a persistent, responsive shell:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo: StockIntel AI]  [Search Stock / Command K...]  [Indices Ticker]  [Theme] [Profile]│
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│ 📊 Dashboard │                                                                         │
│ 📈 Analysis  │                                                                         │
│ 🔍 Screener  │                         MAIN PAGE CONTENT AREA                          │
│ 🧠 AI Report │                                                                         │
│ 💼 Portfolio │                                                                         │
│ ⚙️ Settings  │                                                                         │
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Collapsible Left Sidebar (`Sidebar.tsx`)
- **Brand Identity:** Animated pulsing logo with "Stock Intelligence AI" and "Institutional v1.0" badge.
- **Primary Navigation Links:**
  - 📊 **Dashboard:** High-level market indices, macro sentiment, active alerts (`/`).
  - 📈 **Pro Analysis:** Core charting and AI Copilot split workspace (`/stocks/:symbol`).
  - 🔍 **Market Screener:** Multi-market 95+ constituent scanner with instant search and pagination (`/screener`).
  - 🧠 **AI Research:** Deep-dive equity research report generator (`/research`).
  - 💼 **Paper Portfolio:** Multi-currency mock tracking and transaction ledger (`/portfolio`).
  - 🧪 **Backtester:** Strategy rule backtesting engine (`/backtest`).
  - 📐 **Model Evaluation:** Real ML validation curves and confusion matrices (`/model-eval`).
- **Footer:** System connectivity indicator (`PostgreSQL: Connected`, `AI Engine: Active`, `Latency: 24ms`).

### 3.2 Top Header Navbar (`Header.tsx`)
- **Global Asset Search / Omnibar (`StockSelectDropdown.tsx`):**
  - Instant autocomplete search supporting Indian stocks (`RELIANCE.NS`, `TCS.NS`), US stocks (`AAPL`, `NVDA`), Commodities (`GC=F`, `CL=F`), and Crypto (`BTC-USD`).
  - Keyboard shortcut: <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd>.
- **Live Global Indices Ribbon:** Scrolling micro-ticker with NIFTY 50 (`+0.42%`), SENSEX (`+0.38%`), S&P 500 (`+0.65%`), NASDAQ (`+0.81%`), Gold (`$2,680.40`).
- **Quick Action Buttons:** Market status badge, Currency toggle (`INR ₹` / `USD $`), Notifications bell, User profile avatar.

---

## 4. Page 1: Pro Stock Analysis & Trading Workspace

**URL:** `/stocks/:symbol` or `/analysis/:symbol` (e.g. `/stocks/RELIANCE.NS` or `/stocks/BTC-USD`)

This is the primary flagship workspace of the application. It employs a **12-column responsive grid**:
- **Left Column (8 Columns):** Asset Header + Metric Cards + Pro Trading Chart Canvas + Sub-Oscillators.
- **Right Column (4 Columns):** AI Trading Copilot Decision Panel.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [← Back]  RELIANCE INDUSTRIES (NSE: RELIANCE.NS)  ₹1,215.38 (+0.05%)  O: 1214.79  H: 1215.38  L: 1214.69│
├───────────────────────────────────────────────────────────────────┬────────────────────────────────────┤
│ [24h Volume]  [Day Range]  [52W Range]  [RSI (14)]  [Realized Vol]│ [🤖 AI Trading Copilot] [🔄 Refresh]│
├───────────────────────────────────────────────────────────────────┼────────────────────────────────────┤
│ ┌─ Pro Trading Chart Toolbar ───────────────────────────────────┐ │ [STRONG BUY]  Confidence: 57.8%    │
│ │ [● Status] [1m 5m 15m 30m 1H 1D 1W 1M 1Y 5Y ALL] [Candle ▾]  │ │ Optimal Entry: ₹1,215.00           │
│ │ [Draw Tools ▾] [SMA20] [SMA50] [BBands] [Vol] [Table] [Reset] │ │ Target 1: ₹1,232.00 (+1.4%)        │
│ └───────────────────────────────────────────────────────────────┘ │ Target 2: ₹1,250.00 (+2.9%)        │
│                                                                   │ Stop Loss: ₹1,202.00 (-1.1%)       │
│                TRADINGVIEW LIGHTWEIGHT CHART CANVAS               │ Risk/Reward: 2.6 : 1               │
│               (With Transparent Drawing Tool Overlay)             │                                    │
│                                                                   │ ── Technical Confluence ────────── │
│                                                                   │ • Trend: Bullish Golden Cross      │
│ ┌───────────────────────────────┬───────────────────────────────┐ │ • Momentum: Neutral-Bullish (52.4) │
│ │ RSI (14) Oscillator Subpanel  │ MACD (12, 26, 9) Subpanel     │ │ • Reversal: Bullish Pin Bar      │
│ │ Line at 52.4 (Oversold 30/70) │ Histogram + MACD/Signal Lines │ │ • ML Forecast: Upward Probability │
│ └───────────────────────────────┴───────────────────────────────┘ │                                    │
│                                                                   │ [Ask Copilot: "Should I buy?"] [▶] │
└───────────────────────────────────────────────────────────────────┴────────────────────────────────────┘
```

### 4.1 Asset Header & Live Price Bar
- **Asset Title & Exchange Badge:** Ticker (`RELIANCE.NS`), Full Company Name (`Reliance Industries Limited`), Exchange Flag (`NSE` with 🇮🇳 or `NASDAQ` with 🇺🇸).
- **Price Display (`PriceDisplay.tsx`):** Large tabular price (`₹1,215.38` or `$232.50`) with color-coded daily change badge (`+₹0.60 (+0.05%)`).
- **Data Quality Indicator (`DataQualityBadge.tsx`):** Badges showing `Live Tick Stream`, `Real-time`, or `Market Closed`.

### 4.2 High-Level Metric Tiles (5-Card Grid)
1. **24h Volume:** Total shares traded + comparison against 20-day average.
2. **Day Range:** Visual min-max slider bar showing current price position between Day Low and Day High.
3. **52-Week Range:** Min-max slider showing distance from 52-week low and 52-week all-time high.
4. **RSI (14) Momentum:** Gauge showing current index (e.g. `52.4`) with label (`Neutral`, `Oversold`, `Overbought`).
5. **Realized Volatility:** 21-day annualized Parkinson/historical volatility (e.g. `14.2%`).

### 4.3 Pro Trading Chart Canvas (`ProTradingChart.tsx`)
Built on **TradingView Lightweight Charts** with an interactive overlay canvas.

#### A. Chart Top Toolbar:
1. **Market / Exchange Status Badge:**
   - 🟢 `LIVE BINANCE 24/7` (with pulsing animation for crypto).
   - 🔵 `EXCHANGE ACTIVE` (during official market hours for equities: 09:15–15:30 IST / 09:30–16:00 EST).
   - ⚪ `MARKET CLOSED` (solid state outside market hours, showing official closing settlement price without phantom ticks).
2. **Comprehensive 11-Timeframe Filter Bar (with horizontal scroll):**
   - Chips: `1m`, `5m`, `15m`, `30m`, `1H`, `1D`, `1W`, `1M`, `1Y` (1-Year daily), `5Y` (5-Year weekly), `ALL` (All-Time monthly spanning 40+ years).
   - Active timeframe highlighted with brand blue background and bold font.
3. **Chart Type Dropdown / Switcher:**
   - `Candlestick` (Japanese candles with emerald up / rose down).
   - `Bar Chart` (OHLC bars).
   - `Area Chart` (Gradient filled baseline).
   - `Line Chart` (Closing price line).
   - `Baseline Chart` (Green above historical entry, red below).
4. **Investor Drawing & Technical Analysis Dropdown (`Draw Tools ▾`):**
   - Clicking opens an institutional glassmorphic tool palette:
     - 🖱️ **Cursor (Normal Pan & Zoom):** Default navigation mode.
     - ✏️ **Pencil (Freehand):** Draw freeform sketches, circle inflection candles, draw trend arrows.
     - 📏 **Line (Trendline / Ray):** Draw precision support/resistance channels with endpoint nodes.
     - 🔲 **Square / Rectangle:** Draw semi-transparent supply & demand order blocks and consolidation boxes.
     - 🎨 **6-Color Palette:** Lime (`#22c55e`), Cyan (`#06b6d4`), Gold (`#eab308`), Rose (`#f43f5e`), Purple (`#a855f7`), White (`#ffffff`).
     - 📏 **Stroke Widths:** Fine (1.5px), Medium (2.5px), Bold (4.5px).
     - ↩️ **Undo** & 🗑️ **Clear All** buttons.
5. **Floating Active Drawing HUD:**
   - When any drawing tool is active, a floating pill appears at the top center of the chart:
     `[● Drawing: RECTANGLE | Color: 🟢 | ↩️ Undo | 🗑️ Clear | ✕ Done (Cursor)]`
   - Pressing <kbd>Esc</kbd> automatically exits back to normal cursor mode.
6. **Technical Indicator Quick Toggles:**
   - `SMA20` (Yellow fast moving average line).
   - `SMA50` (Sky blue intermediate moving average line).
   - `BBands` (Bollinger Bands with 20-period centerline and 2σ upper/lower envelopes).
   - `Volume` (Color-coded histogram at chart bottom).
7. **Utility Actions:**
   - `Data Table` (Opens full modal table with all historical timestamps, OHLCV rows, and CSV export).
   - `Reset Zoom` (Fits all candles to screen).

#### B. Live Crosshair HUD (OHLCV Legend):
- Displays at the top of the canvas during mouse hover:
  `RELIANCE.NS  1M  16:13:00  O: 1,214.79  H: 1,215.38  L: 1,214.69  C: 1,215.38  Chg: +0.05%  Vol: 1,099,442`

#### C. Sub-Oscillator Panels (Below Main Chart):
- **RSI (14) Sub-chart:** Purple momentum line oscillating between 0 and 100 with horizontal threshold lines at 30 (Oversold green zone) and 70 (Overbought red zone).
- **MACD Sub-chart:** MACD Fast line (Blue), Signal line (Orange), and zero-centered histogram bars (Green for positive momentum expansion, Red for contraction).

---

### 4.4 AI Trading Copilot Decision Panel (`AICopilotPanel.tsx`)
Positioned prominently on the right side of the analysis workspace:

1. **Header & Dynamic Live Refresh:**
   - Title: `AI Trading Copilot`.
   - **Interactive Refresh Button:** Prominent single-click refresh button with spinning icon that triggers instantaneous re-computation of technical indicators, ML probabilistic inference, and news sentiment.
   - Status: `Live Recalculation Engine`.
2. **Directional Verdict & Realistic Probabilities:**
   - High-contrast verdict pill: `STRONG BUY`, `BUY`, `NEUTRAL`, `SELL`, or `STRONG SELL`.
   - **Algorithmic Confidence Score:** Displays realistic quant probabilities (**53.5% – 58.2%** edge). Includes an educational tooltip explaining why 90%+ in finance is fraudulent lookahead bias.
3. **Institutional Execution Plan (Card):**
   - **Optimal Entry:** Exact recommended price level (`₹1,215.00`).
   - **Take Profit Target 1 (Conservative):** Scalp target (`₹1,232.00 / +1.4%`).
   - **Take Profit Target 2 (Extended):** Trend runner (`₹1,250.00 / +2.9%`).
   - **Invalidation Stop-Loss:** Structural risk cutoff (`₹1,202.00 / -1.1%`).
   - **Risk-to-Reward Ratio:** Formatted metric badge (e.g. `2.6 : 1`).
4. **Multi-Pillar Confluence Breakdown (4 Accordion/Tiles):**
   - 📈 **Trend Structure:** Moving average alignment status (e.g. *"Price above SMA 20 & SMA 50. Bullish Golden Cross active"*).
   - ⚡ **Momentum Velocity:** RSI(14) velocity and MACD histogram expansion.
   - 🕯️ **Candlestick Pattern & Market Turn Badges:** Dynamically detects and renders badges:
     - `Bullish Hammer / Pin Bar`
     - `Bullish Engulfing`
     - `Shooting Star (Bearish Reversal)`
     - `Double Bottom Support Pivot`
     - `Double Top Ceiling Resistance`
   - 🤖 **Machine Learning Forecast:** XGBoost & Random Forest out-of-sample directional prediction probability.
5. **Micro vs. Macro Dual-Horizon Intelligence:**
   - **Micro (Last 10 minutes/bars):** Detects immediate order-flow inflection, aggressive buyer absorption, or micro-momentum deceleration.
   - **Macro (Daily / Multi-Week):** Identifies position within major support/resistance channels and multi-month trend direction.
6. **Interactive AI Analyst Chat:**
   - Conversational prompt input: *"Is this a good time to scalp?", "Where is the next major resistance?", "What is my downside risk?"*
   - Chat history with instantaneous, contextual mathematical responses.

---

## 5. Page 2: Institutional Multi-Market Screener

**URL:** `/screener`

Designed to scan the entire 95+ multi-asset universe in real-time.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Institutional Market Screener                        [Search Ticker, Name, Sector...] [Reset]          │
│ 95+ Assets Tracked Across Indian Bluechips, US Equities, Commodities & Crypto                          │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [All Markets (95)]  [🇮🇳 India NSE/BSE (52)]  [🇺🇸 USA NASDAQ/NYSE (28)]  [🪙 Crypto/Commodities (15)]    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Quick Presets: [⚡ Oversold RSI < 35] [🚀 Bullish Momentum] [🏆 NIFTY 50 Bluechips] [💎 Mega-Cap Tech] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Symbol ▲  Name                    Market  Price       24h Chg ▲  RSI(14)  Trend     Volume    Action   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ RELIANCE  Reliance Industries     🇮🇳 NSE  ₹1,215.38   +0.05%     52.4     Bullish   1.1M      [Analyze]│
│ TCS.NS    Tata Consultancy Serv.  🇮🇳 NSE  ₹3,920.10   +1.12%     58.1     Strong    840K      [Analyze]│
│ AAPL      Apple Inc.              🇺🇸 NAS  $232.50     +1.45%     61.2     Bullish   48.2M     [Analyze]│
│ NVDA      NVIDIA Corporation      🇺🇸 NAS  $134.80     +3.20%     68.4     Strong    62.1M     [Analyze]│
│ BTC-USD   Bitcoin                 🪙 CRY  $68,420.00  +2.15%     54.0     Bullish   28.4B     [Analyze]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Showing 1 to 20 of 95 results                              Rows per page: [20 ▾]  [<] [1] 2 3 4 5 [>]  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Screener Controls & Filters
1. **Direct Search Bar:** Real-time client-side filter searching by symbol (`RELIANCE`), company name (`Tata`), or sector (`Banking`, `Semiconductor`).
2. **Segmented Country/Market Filter:**
   - `All Markets`
   - `🇮🇳 India (NSE/BSE)` (Filters full NIFTY 50 + Sensex)
   - `🇺🇸 USA (NASDAQ/NYSE)` (Filters Apple, Microsoft, NVIDIA, Amazon, Google, Meta, Tesla)
   - `🪙 Commodities & Crypto` (Gold, Silver, Crude Oil, BTC, ETH, SOL)
3. **One-Click Quantitative Presets:**
   - `RSI < 35 (Oversold Pullbacks)`
   - `Bullish Momentum (RSI > 55 & Price > SMA 20)`
   - `High Volatility (> 25% Realized Vol)`
   - `Volume Surges (> 1.5x 20-day Average Volume)`
4. **Table Columns:**
   - **Symbol & Logo/Flag:** Company ticker with exchange indicator.
   - **Company Name:** Full legal name.
   - **Market / Exchange:** Regional pill (`NSE`, `BSE`, `NASDAQ`, `NYSE`, `BINANCE`).
   - **Current Price:** Formatted in native currency (`₹` or `$`).
   - **24h Change:** Numeric delta with green/red badge and percentage.
   - **RSI (14):** Tabular numeric score with color gradient (green when oversold, red when overbought).
   - **Moving Average Trend:** `Strong Bullish`, `Bullish`, `Neutral`, or `Bearish`.
   - **Volume:** Scaled volume (`K`, `M`, `B`).
   - **Action:** Direct link button `[Analyze ↗]` leading straight to the `/stocks/:symbol` workspace.
5. **Pagination Controls:**
   - Results counter (`Showing 1 to 20 of 95 results`).
   - Rows per page dropdown (`10`, `20`, `50`, `100`).
   - Page navigation buttons (`Previous`, `Page 1`, `Page 2`, `Next`).

---

## 6. Page 3: Market Intelligence Dashboard

**URL:** `/`

High-level command center displaying macro market health:
- **Global Index Cards:** NIFTY 50, S&P BSE SENSEX, S&P 500, NASDAQ-100, Dow Jones, Gold, Crude Oil with sparkline charts.
- **Fear & Greed Index Barometer:** Radial dial showing institutional market sentiment (0–100 score).
- **Top Movers Grid:** Top 5 Gainers, Top 5 Losers, and Volume Breakout Leaders.
- **Live AI Reversal Feed:** Real-time stream of detected patterns across the universe (e.g., *"HDFC Bank printed a Bullish Pin Bar on 15m chart"*).

---

## 7. Page 4: AI Equity Research & Narrative Reports

**URL:** `/research` or `/research/:symbol`

Synthesizes complex quantitative data into executive-ready research memorandums:
- **Executive Summary:** Plain-English synthesis of algorithmic signals, fundamental health, and macro risk.
- **Valuation & Fundamentals Card:** P/E Ratio, Market Cap, 52-week performance, sector percentile.
- **Technical Confluence Scorecard:** Breakdown of moving averages, oscillators, and volatility.
- **Key Risks & Downside Scenarios:** Critical support levels and macro headwinds.
- **Export Action:** One-click `[Download PDF Report]` / `[Copy Markdown]`.

---

## 8. Page 5: Paper Portfolio & Strategy Backtester

**URLs:** `/portfolio` and `/backtest`

- **Paper Trading Portfolio:**
  - Multi-currency portfolio tracker (Tracks both USD and INR cash reserves).
  - Open positions table with real-time mark-to-market P&L.
  - One-click buy/sell simulated trade execution modal with stop-loss & take-profit orders.
- **Strategy Backtester:**
  - Rule selector: *EMA Cross (12/26), RSI Pullback (Buy < 30, Sell > 70), Bollinger Band Mean Reversion*.
  - Performance Metrics: Total Return %, Benchmark Return %, Sharpe Ratio, Maximum Drawdown %, Win Rate %.
  - Interactive cumulative equity growth curve.

---

## 9. Page 6: Quantitative Model Evaluation & Integrity

**URL:** `/model-eval`

Demonstrates institutional transparency and proves that the machine learning models are genuinely trained:
- **Real-World Directional Accuracy Card:** Displays measured out-of-sample hit rate (**53.5% – 58.2%**).
- **AUC-ROC Score Card:** **0.55 – 0.63** discriminative rating.
- **Brier Loss Score:** Probability calibration benchmark (0.23 – 0.24).
- **Interactive Confusion Matrix:** True Positives, False Positives, True Negatives, False Negatives.
- **Anti-Leakage Protocol Diagram:** Visualizes the 80/20 chronological time-series split and rolling walk-forward cross-validation.

---

## 10. Design System Tokens

```css
/* Color Palette */
--bg-root: #0B0E14;        /* Deepest obsidian canvas */
--bg-surface-1: #111622;    /* Card and toolbar background */
--bg-surface-2: #182030;    /* Interactive elements, button default */
--bg-surface-3: #222D42;    /* Hover states and active selections */

--border-subtle: rgba(255, 255, 255, 0.08); /* 1px card borders */
--border-focus: #3B82F6;                     /* Focus rings and active tabs */

--brand-primary: #3B82F6;   /* Electric Blue */
--brand-cyan: #06B6D4;      /* High-tech Cyan */

--status-positive: #10B981; /* Bullish Green (HEX: #10B981) */
--status-negative: #EF4444; /* Bearish Red (HEX: #EF4444) */
--status-warning: #F59E0B;  /* Neutral / Alert Amber (HEX: #F59E0B) */

/* Typography */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Roboto Mono', monospace;

/* Radii & Shadows */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-full: 9999px;

--shadow-card: 0 4px 20px -2px rgba(0, 0, 0, 0.5);
--shadow-modal: 0 20px 50px -10px rgba(0, 0, 0, 0.8);
```

---

## 11. Copy-Paste Master Prompt for AI Designers

If you want an AI design tool (like **v0.dev**, **Lovable.dev**, **Claude 3.5 Sonnet**, or **Cursor**) to create or redesign the entire user interface, copy and paste the prompt below:

```text
You are an elite fintech UI/UX designer and frontend engineer specializing in institutional trading platforms like TradingView, Bloomberg Terminal, Linear.app, and Raycast.

Design an institutional-grade dark-mode web application for "Stock Intelligence AI & Graph Analyzer". 

Aesthetic & Theme Requirements:
1. Deep obsidian background (#0B0E14) with subtle slate glassmorphic cards (#111622), 1px borders (rgba(255,255,255,0.08)), and tabular financial fonts (Inter for UI, JetBrains Mono for prices).
2. Clean status accents: Emerald green (#10B981) for bullish, Rose red (#EF4444) for bearish, and Electric blue (#3B82F6) for brand highlights.
3. High information density without visual clutter. Fast, snappy, institutional feel.

Primary Pages to Design:
1. Pro Stock Analysis Workspace (/stocks/RELIANCE.NS):
   - Top Header: Ticker, legal company name, exchange flag (NSE/NASDAQ), live price, daily change %, and Day Range / 52W Range slider bars.
   - Pro Trading Chart Toolbar:
     - Market status pill (LIVE BINANCE 24/7 or EXCHANGE ACTIVE or MARKET CLOSED).
     - 11 timeframe chips: 1m, 5m, 15m, 30m, 1H, 1D, 1W, 1M, 1Y, 5Y, ALL.
     - Chart Type selector: Candlestick, Bars, Area, Line, Baseline.
     - Technical Drawing Dropdown (Draw Tools): Cursor, Pencil (Freehand), Line (Trendline), Square/Rectangle (Order blocks), 6-color palette, stroke width selector, Undo, Clear All.
     - Floating drawing mode status pill on the canvas when active with quick exit toggle.
     - Indicator toggles: SMA20, SMA50, BBands, Volume.
     - Live crosshair OHLCV legend.
     - Sub-panels for RSI(14) with 30/70 bands and MACD histogram.
   - Right-Hand AI Trading Copilot Panel:
     - Header with instant re-calculation refresh button.
     - Directional bias badge (STRONG BUY, BUY, NEUTRAL, SELL) with realistic statistical probability (53.5%–58.2%).
     - Institutional trade setup card: Optimal Entry, Target 1, Target 2, Invalidation Stop-Loss, and Risk/Reward ratio.
     - Technical Confluence accordion (Trend structure, RSI momentum, reversal pattern badges like Bullish Pin Bar or Engulfing, ML forecast).
     - Micro (last 10m) vs. Macro dual-horizon breakdown.
     - In-panel AI query chat box.

2. Institutional Multi-Market Screener (/screener):
   - 95+ asset universe covering full NIFTY 50 Indian bluechips, US tech leaders (Apple, NVIDIA, Microsoft), commodities, and crypto.
   - Market filter segmented switcher: All Markets, 🇮🇳 India (NSE/BSE), 🇺🇸 USA (NASDAQ/NYSE), 🪙 Commodities/Crypto.
   - Live search bar by ticker, company, or sector.
   - One-click presets: Oversold RSI < 35, Bullish Momentum, Volume Surges.
   - Rich sortable data table with prices, changes, RSI, trend badges, and pagination (10, 20, 50, 100 per page).

3. Global Navigation Shell:
   - Collapsible left sidebar with links to Dashboard, Analysis, Screener, AI Research, Portfolio, Backtester, and Model Evaluation.
   - Top search omnibar with Cmd+K shortcut, global indices live ribbon, and currency switcher (INR ₹ vs USD $).

Generate production-ready React 18, Tailwind CSS, Lucide icons, and Framer Motion code for these pages with stateful interactive elements.
```
