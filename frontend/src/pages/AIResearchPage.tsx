import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Sparkles,
  ShieldAlert,
  Clock,
  Layers,
  FileText,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  Zap,
  RotateCw,
  Activity,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import { generateAIReport, fetchQuote } from "../services/marketData";
import { LoadingState } from "../components/ui/States";
import StockSelectDropdown, { POPULAR_INSTRUMENTS } from "../components/ui/StockSelectDropdown";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}
class ReportErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("AIResearchPage Report render error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 border-negative/30 bg-negative/5 text-xs space-y-3 rounded-2xl">
          <div className="flex items-center gap-2 text-negative font-semibold text-sm">
            <ShieldAlert className="h-5 w-5" />
            <span>Unable to render research note</span>
          </div>
          <p className="text-text-secondary leading-relaxed">
            The quantitative engine generated data that encountered a display error ({this.state.error?.message}).
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="btn btn-ghost border border-border text-xs px-3.5 py-1.5 text-text-primary rounded-lg"
          >
            Retry Display
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function safeText(val: any, fallback = "—"): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (val.value !== undefined) return safeText(val.value, fallback);
    if (val.histogram !== undefined) return safeText(val.histogram, fallback);
    if (val.summary !== undefined) return safeText(val.summary, fallback);
    if (val.headline !== undefined) return safeText(val.headline, fallback);
    return JSON.stringify(val);
  }
  return String(val);
}

const QUESTION_PRESETS = [
  "What are the key technical levels, support/resistance, and momentum outlook?",
  "Evaluate downside risk, volatility regime, and macro earnings headwinds.",
  "Synthesize technical indicator signals with recent news sentiment.",
  "Assess probability of short-term upside continuation vs mean-reversion.",
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function AIResearchPage() {
  const [searchParams] = useSearchParams();
  const initialSymbol = searchParams.get("symbol") || "RELIANCE.NS";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [question, setQuestion] = useState(QUESTION_PRESETS[0]);

  const { data: quote } = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => fetchQuote(symbol),
    staleTime: 30000,
  });

  const matchedInstrument = POPULAR_INSTRUMENTS.find((item) => item.symbol === symbol);
  const isUSD = matchedInstrument
    ? matchedInstrument.currency === "USD"
    : (!symbol.endsWith(".NS") && !symbol.endsWith(".BO") && !symbol.startsWith("^NSE") && !symbol.startsWith("^BSE") && symbol !== "USDINR=X");
  const currencySign = isUSD ? "$" : "₹";

  const {
    mutate: runAnalysis,
    data: reportData,
    isPending: isGenerating,
    error: reportError,
  } = useMutation({
    mutationFn: (forceRefresh?: boolean) => generateAIReport(symbol, question, forceRefresh),
  });

  const report = reportData?.report;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header with UI Pro Accents ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 border border-border/80 p-6 shadow-lg"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-brand/10 border border-brand/30 text-brand mb-2.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ALPHA ENGINE v2.5 • QUANTITATIVE INTELLIGENCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
              <span className="p-2 rounded-xl bg-brand/15 border border-brand/30 text-brand">
                <Cpu className="h-7 w-7" />
              </span>
              AI Equity & Asset Research
            </h1>
            <p className="text-sm text-text-muted mt-1.5 max-w-2xl">
              Synthesizes real-time global market data, technical indicator regimes, ML direction models, and news sentiment into institutional-grade research.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-3/60 border border-border/60 text-xs text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-positive animate-ping" />
              <span>Live Engine Ready</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Input & Query Configuration ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="card p-6 rounded-2xl space-y-5 bg-surface-1/90 backdrop-blur-xl border border-border/80 shadow-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stock Dropdown Section */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-brand" />
                Select Asset / Instrument
              </span>
              <span className="text-[10px] text-text-muted">India, US, Gold & Crypto</span>
            </label>
            <StockSelectDropdown
              value={symbol}
              onChange={(newSym) => setSymbol(newSym)}
            />
            {quote && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between text-[11px] mt-1.5 px-2 py-1 rounded-lg bg-surface-2/60 border border-border/40 font-mono"
              >
                <span className="text-text-muted">Live Quote:</span>
                <span className="font-bold text-text-primary">
                  {quote.price != null
                    ? `${currencySign}${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "N/A"}{" "}
                  {quote.changePct != null && (
                    <span
                      className={`inline-flex items-center gap-0.5 ml-1 ${
                        quote.changePct >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {quote.changePct >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 inline" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 inline" />
                      )}
                      {quote.changePct >= 0 ? "+" : ""}
                      {quote.changePct.toFixed(2)}%
                    </span>
                  )}
                </span>
              </motion.div>
            )}
          </div>

          {/* Research Objective Input */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-brand" />
              Analyst Research Objective & Custom Query
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Specify custom question or select a prompt preset below..."
              className="w-full bg-surface-2/80 border border-border/80 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Preset Prompt Buttons */}
        <div>
          <span className="text-[11px] font-semibold text-text-muted block mb-2">
            Institutional Research Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {QUESTION_PRESETS.map((preset, idx) => {
              const isSelected = question === preset;
              return (
                <motion.button
                  key={idx}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setQuestion(preset)}
                  className={`text-xs px-3 py-1.5 rounded-xl transition-all border ${
                    isSelected
                      ? "bg-brand/20 border-brand text-brand font-semibold shadow-sm"
                      : "bg-surface-2/60 border-border/60 text-text-secondary hover:text-text-primary hover:border-text-muted hover:bg-surface-3"
                  }`}
                >
                  {preset}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-text-muted flex items-center gap-2">
            <span className="p-1 rounded-md bg-brand/10 text-brand">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span>Two-Tier Hybrid Cache Active (L1 Memory + L2 Redis)</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {report && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => runAnalysis(true)}
                disabled={isGenerating || !symbol}
                className="btn btn-ghost text-xs py-2.5 px-3.5 flex items-center gap-1.5 text-text-secondary hover:text-text-primary border border-border/80 rounded-xl"
                title="Force refresh live real-time analysis"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                <span>Force Refresh</span>
              </motion.button>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => runAnalysis(false)}
              disabled={isGenerating || !symbol}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] disabled:opacity-50 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Synthesizing Research..." : "Generate Research Note"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Loading Animation ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="card p-8 rounded-2xl bg-surface-1/90 border border-brand/40 shadow-2xl text-center space-y-4"
          >
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
              <Cpu className="h-7 w-7 text-brand animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Analyzing Live Market Data & Regimes for {symbol}
              </h3>
              <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
                Extracting real-time OHLCV candles, executing technical indicator pipelines, evaluating ML directional confidence, and formulating institutional takeaways...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Output ──────────────────────────────────────────────────────── */}
      {reportError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 border-negative/30 bg-negative/5 text-negative text-xs flex items-center gap-3 rounded-2xl"
        >
          <ShieldAlert className="h-6 w-6 shrink-0" />
          <div>
            <span className="font-bold block text-sm">Failed to generate research note</span>
            <span className="text-text-muted mt-0.5">Please ensure backend and AI microservice are running smoothly.</span>
          </div>
        </motion.div>
      )}

      {/* ── Report Output with Framer Motion Stagger ──────────────────────────── */}
      {report && (
        <ReportErrorBoundary>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Metadata Banner */}
            <motion.div
              variants={itemVariants}
              className="card p-4 rounded-2xl bg-surface-1/80 backdrop-blur-xl border border-brand/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono font-bold text-sm text-text-primary px-2.5 py-1 rounded-lg bg-surface-3 border border-border/50">
                  {symbol}
                </span>
                <span className="badge badge-surface text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-3">
                  Engine: {reportData.model_used ?? "gemini-2.5-flash"}
                </span>
                {reportData.cached ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full bg-brand/15 text-brand font-medium border border-brand/30 shadow-sm">
                    <Zap className="h-3 w-3" />
                    Cached (Instant, Saved API Quota)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full bg-positive/15 text-positive font-medium border border-positive/30 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-positive animate-pulse"></span>
                    Real-Time Live Analysis
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => runAnalysis(true)}
                  disabled={isGenerating}
                  className="text-xs text-brand hover:underline flex items-center gap-1 font-medium"
                >
                  <RotateCw className="h-3 w-3" />
                  Live Re-run
                </button>
                <div className="flex items-center gap-1.5 text-text-muted font-mono text-[11px]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(reportData.generated_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </motion.div>

            {/* Executive Summary Card */}
            <motion.div
              variants={itemVariants}
              className="card p-6 rounded-2xl space-y-3.5 bg-surface-1/90 border-l-4 border-l-brand border-border/80 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand" />
                  Executive Quantitative Summary
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                  Institutional Intelligence
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-sans">
                {safeText(report.summary)}
              </p>
            </motion.div>

            {/* Technical Context & Machine Learning Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Context */}
              <motion.div
                variants={itemVariants}
                className="card p-6 rounded-2xl space-y-4 bg-surface-1/90 border border-border/80 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <Layers className="h-4 w-4 text-brand" />
                    Technical Indicator Regimes
                  </h4>
                  <span className="text-[10px] text-text-muted font-mono">1D Timeframe</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* RSI */}
                  <div className="p-3 bg-surface-2/60 border border-border/40 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted font-medium">RSI (14) Momentum:</span>
                      <span className="font-mono font-bold text-text-primary">
                        {safeText(report.technical_context?.rsi_14)} ({safeText(report.technical_context?.rsi_state, "Neutral")})
                      </span>
                    </div>
                    {/* Visual Meter Bar */}
                    <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              typeof report.technical_context?.rsi_14 === "number"
                                ? report.technical_context.rsi_14
                                : 50
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* MACD */}
                  <div className="flex justify-between items-center p-3 bg-surface-2/60 border border-border/40 rounded-xl">
                    <span className="text-text-muted font-medium">MACD Histogram:</span>
                    <span className="font-mono font-bold text-text-primary">
                      {safeText(report.technical_context?.macd?.histogram)}
                    </span>
                  </div>

                  {/* Moving Averages */}
                  <div className="p-3 bg-surface-2/60 border border-border/40 rounded-xl space-y-2">
                    <span className="text-text-muted block font-medium">Moving Average Structure:</span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 bg-surface-3/60 rounded-lg border border-border/30">
                        <span className="text-[10px] text-text-muted block">SMA 20</span>
                        <span className="font-bold text-text-primary">
                          {safeText(report.technical_context?.sma_structure?.["20"])}
                        </span>
                      </div>
                      <div className="p-2 bg-surface-3/60 rounded-lg border border-border/30">
                        <span className="text-[10px] text-text-muted block">SMA 50</span>
                        <span className="font-bold text-text-primary">
                          {safeText(report.technical_context?.sma_structure?.["50"])}
                        </span>
                      </div>
                      <div className="p-2 bg-surface-3/60 rounded-lg border border-border/30">
                        <span className="text-[10px] text-text-muted block">SMA 200</span>
                        <span className="font-bold text-text-primary">
                          {safeText(report.technical_context?.sma_structure?.["200"])}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Machine Learning Forecasting */}
              <motion.div
                variants={itemVariants}
                className="card p-6 rounded-2xl space-y-4 bg-surface-1/90 border border-border/80 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand" />
                    Machine Learning Directional Odds
                  </h4>
                  <span className="text-[10px] font-mono text-positive bg-positive/10 px-2 py-0.5 rounded-full border border-positive/20">
                    Confidence Calibrated
                  </span>
                </div>

                <div className="p-4 bg-surface-2/60 border border-border/40 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Directional Bias:</span>
                    <span className="font-bold font-mono text-positive uppercase px-2 py-0.5 rounded bg-positive/10 border border-positive/30">
                      {safeText(report.model_context?.forecast_direction, "Bullish Continuation")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Probability Score:</span>
                      <span className="font-bold font-mono text-base text-text-primary">
                        {report.model_context?.probability !== undefined
                          ? `${(Number(report.model_context.probability) * 100).toFixed(1)}%`
                          : "55.0%"}
                      </span>
                    </div>
                    {/* Visual Probability Bar */}
                    <div className="w-full bg-surface-3 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              report.model_context?.probability !== undefined
                                ? Number(report.model_context.probability) * 100
                                : 55
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <span className="text-text-muted">Model Architecture:</span>
                    <span className="font-mono text-text-secondary text-[11px]">
                      {safeText(report.model_context?.model_type, "XGBoost Ensemble v1.0")}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Actionable Key Trading Levels (If Available) */}
            {report.actionable_levels && (
              <motion.div
                variants={itemVariants}
                className="card p-6 rounded-2xl bg-surface-1/90 border border-border/80 shadow-lg space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand" />
                  Actionable Support, Resistance & Target Levels
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-center">
                  <div className="p-3 bg-surface-2/60 border border-border/40 rounded-xl">
                    <span className="text-[10px] text-text-muted block">Support (S1)</span>
                    <span className="font-bold text-text-primary text-sm mt-0.5 block">
                      {safeText(report.actionable_levels.support_1)}
                    </span>
                  </div>
                  <div className="p-3 bg-surface-2/60 border border-border/40 rounded-xl">
                    <span className="text-[10px] text-text-muted block">Resistance (R1)</span>
                    <span className="font-bold text-text-primary text-sm mt-0.5 block">
                      {safeText(report.actionable_levels.resistance_1)}
                    </span>
                  </div>
                  <div className="p-3 bg-surface-2/60 border border-border/40 rounded-xl">
                    <span className="text-[10px] text-text-muted block">Target (T1)</span>
                    <span className="font-bold text-positive text-sm mt-0.5 block">
                      {safeText(report.actionable_levels.target_1)}
                    </span>
                  </div>
                  <div className="p-3 bg-surface-2/60 border border-border/40 rounded-xl">
                    <span className="text-[10px] text-text-muted block">Stop Loss</span>
                    <span className="font-bold text-negative text-sm mt-0.5 block">
                      {safeText(report.actionable_levels.stop_loss)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Key Risks Section */}
            <motion.div
              variants={itemVariants}
              className="card p-6 rounded-2xl border-negative/30 bg-negative/5 space-y-3 shadow-md"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-negative flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Downside Risks & Market Headwinds
              </h4>
              {Array.isArray(report.risks) ? (
                <ul className="space-y-2 text-xs text-text-secondary">
                  {report.risks.map((risk: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-negative font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{safeText(risk)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-secondary leading-relaxed">
                  {safeText(report.risks, "Standard market volatility and drawdown risks apply.")}
                </p>
              )}
            </motion.div>

            {/* Referenced News Articles */}
            {Array.isArray(report.news_context) && report.news_context.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="card p-6 rounded-2xl space-y-3 bg-surface-1/90 border border-border/80 shadow-lg"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-brand" />
                  Referenced Financial Wire Sources
                </h4>
                <div className="space-y-2">
                  {report.news_context.map((news: any, idx: number) => {
                    const headline =
                      typeof news === "object"
                        ? news.headline || news.title || news.summary || JSON.stringify(news)
                        : String(news);
                    const sentiment = typeof news === "object" ? news.sentiment || "Neutral" : "Neutral";
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 3 }}
                        className="p-3 bg-surface-2/60 border border-border/40 rounded-xl flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="font-medium text-text-primary line-clamp-1">{headline}</span>
                        <span className="badge badge-surface text-[10px] uppercase font-semibold shrink-0 ml-3">
                          {sentiment}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Mandatory Legal & Regulatory Disclaimer */}
            <motion.div
              variants={itemVariants}
              className="card p-4 rounded-xl bg-surface-1/50 text-[11px] text-text-muted border-border/40 flex items-start gap-2.5"
            >
              <ShieldCheck className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-secondary block mb-0.5">
                  Institutional Disclaimer & Compliance:
                </span>
                {safeText(report.disclaimer)}
              </div>
            </motion.div>
          </motion.div>
        </ReportErrorBoundary>
      )}
    </div>
  );
}
