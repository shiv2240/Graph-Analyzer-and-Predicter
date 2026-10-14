import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Play,
  RotateCcw,
  TrendingUp,
  Percent,
  Activity,
  ShieldAlert,
  Sliders,
  DollarSign,
  BarChart,
} from "lucide-react";
import { runBacktest } from "../services/marketData";
import { LoadingState } from "../components/ui/States";
import StockSelectDropdown from "../components/ui/StockSelectDropdown";

export default function BacktestPage() {
  const [symbol, setSymbol] = useState("RELIANCE.NS");
  const [strategy, setStrategy] = useState("sma_crossover");
  const [fastPeriod, setFastPeriod] = useState("20");
  const [slowPeriod, setSlowPeriod] = useState("50");
  const [capital, setCapital] = useState("100000");
  const [commission, setCommission] = useState("0.1");
  const [slippage, setSlippage] = useState("0.05");

  const {
    mutate: executeBacktest,
    data: backtestData,
    isPending,
    error,
  } = useMutation({
    mutationFn: () =>
      runBacktest({
        symbol: symbol.toUpperCase(),
        strategy_name: strategy,
        params: {
          fast: parseInt(fastPeriod, 10),
          slow: parseInt(slowPeriod, 10),
        },
        initial_capital: parseFloat(capital),
        commission_pct: parseFloat(commission),
        slippage_pct: parseFloat(slippage),
      }),
  });

  const result = backtestData?.result;

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Activity className="h-6 w-6 text-brand" />
          Quantitative Strategy Backtester
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Simulate algorithmic trading models with realistic transaction fee accounting (commission + slippage)
        </p>
      </div>

      {/* ── Configuration Form ───────────────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-text-secondary font-semibold mb-1">Security / Commodity</label>
            <StockSelectDropdown
              value={symbol}
              onChange={(newSym) => setSymbol(newSym)}
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-1">Trading Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand"
            >
              <option value="sma_crossover">SMA Trend Following (Golden/Death Cross)</option>
              <option value="buy_and_hold">Benchmark: Passive Buy & Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-1">Initial Starting Capital</label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Strategy Specific Parameters */}
        {strategy === "sma_crossover" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border/50 text-xs">
            <div>
              <label className="block text-text-secondary font-medium mb-1">Fast SMA Period</label>
              <input
                type="number"
                value={fastPeriod}
                onChange={(e) => setFastPeriod(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary font-mono focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">Slow SMA Period</label>
              <input
                type="number"
                value={slowPeriod}
                onChange={(e) => setSlowPeriod(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary font-mono focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">Brokerage Commission (%)</label>
              <input
                type="number"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary font-mono focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">Execution Slippage (%)</label>
              <input
                type="number"
                step="0.01"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary font-mono focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={() => executeBacktest()}
            disabled={isPending || !symbol}
            className="btn btn-primary flex items-center gap-2 text-xs py-2 px-5"
          >
            <Play className="h-3.5 w-3.5" />
            {isPending ? "Simulating Algorithmic Trades..." : "Run Backtest Simulation"}
          </button>
        </div>
      </div>

      {/* ── Results Output ────────────────────────────────────────────────────── */}
      {isPending && <LoadingState message={`Simulating 3-year historical execution for ${symbol}...`} />}

      {error && (
        <div className="card p-5 border-negative/30 bg-negative/5 text-negative text-xs flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>Failed to complete backtest. Ensure backend is running and symbol has adequate history.</span>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="card p-4">
              <span className="text-text-muted text-[11px] block font-medium">Total Return</span>
              <span
                className={`text-xl font-bold font-mono mt-1 block ${
                  result.total_return >= 0 ? "text-positive" : "text-negative"
                }`}
              >
                {result.total_return >= 0 ? "+" : ""}
                {(result.total_return * 100).toFixed(1)}%
              </span>
            </div>

            <div className="card p-4">
              <span className="text-text-muted text-[11px] block font-medium">CAGR</span>
              <span className="text-xl font-bold font-mono text-text-primary mt-1 block">
                {(result.cagr * 100).toFixed(1)}%
              </span>
            </div>

            <div className="card p-4">
              <span className="text-text-muted text-[11px] block font-medium">Sharpe Ratio</span>
              <span className="text-xl font-bold font-mono text-brand mt-1 block">
                {result.sharpe_ratio?.toFixed(2) ?? "—"}
              </span>
            </div>

            <div className="card p-4">
              <span className="text-text-muted text-[11px] block font-medium">Max Drawdown</span>
              <span className="text-xl font-bold font-mono text-negative mt-1 block">
                {(result.max_drawdown * 100).toFixed(1)}%
              </span>
            </div>

            <div className="card p-4">
              <span className="text-text-muted text-[11px] block font-medium">Win Rate</span>
              <span className="text-xl font-bold font-mono text-text-primary mt-1 block">
                {(result.win_rate * 100).toFixed(0)}%
              </span>
            </div>

            <div className="card p-4">
              <span className="text-text-muted text-[11px] block font-medium">Total Executions</span>
              <span className="text-xl font-bold font-mono text-text-secondary mt-1 block">
                {result.num_trades} trades
              </span>
            </div>
          </div>

          {/* Equity Curve Visualizer */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand" />
                Portfolio Cumulative Equity Curve
              </h3>
              <span className="text-xs text-text-muted font-mono">
                Benchmark Buy & Hold: {(result.benchmark_return * 100).toFixed(1)}%
              </span>
            </div>

            {/* SVG Normalized Equity Curve Chart */}
            <div className="h-64 w-full relative bg-surface-elevated/40 rounded-lg p-4 flex items-end">
              {result.equity_curve && result.equity_curve.length > 1 ? (
                <div className="w-full h-full flex items-end gap-1">
                  {result.equity_curve.map((pt: any, i: number) => {
                    const minVal = Math.min(...result.equity_curve.map((x: any) => x.value));
                    const maxVal = Math.max(...result.equity_curve.map((x: any) => x.value));
                    const range = maxVal - minVal || 1;
                    const heightPct = Math.max(5, ((pt.value - minVal) / range) * 90);

                    return (
                      <div
                        key={i}
                        className="flex-1 bg-brand/80 hover:bg-brand transition-all rounded-t-sm group relative"
                        style={{ height: `${heightPct}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface text-[10px] font-mono px-2 py-1 rounded shadow-lg border border-border whitespace-nowrap pointer-events-none z-10">
                          {pt.date}: {pt.value?.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full text-center text-xs text-text-muted self-center">
                  Insufficient data points to plot curve.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-muted pt-2">
              <span>Start: {result.equity_curve?.[0]?.date}</span>
              <span>End: {result.equity_curve?.[result.equity_curve.length - 1]?.date}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="card p-4 text-[11px] text-text-muted bg-surface border-border/50">
            <span className="font-bold text-text-secondary block mb-1">Backtest Notice:</span>
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
