import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  RefreshCw,
  X,
} from "lucide-react";
import {
  fetchPortfolio,
  addPortfolioPosition,
  deletePortfolioPosition,
  fetchPortfolioPerformance,
} from "../services/marketData";
import { LoadingState } from "../components/ui/States";

export default function PortfolioPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const { data: portfolioData, isLoading, refetch } = useQuery({
    queryKey: ["portfolio"],
    queryFn: fetchPortfolio,
  });

  const { data: perfData } = useQuery({
    queryKey: ["portfolio_perf"],
    queryFn: fetchPortfolioPerformance,
  });

  const addMutation = useMutation({
    mutationFn: addPortfolioPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio_perf"] });
      setShowAddModal(false);
      setNewSymbol("");
      setNewQuantity("");
      setNewPrice("");
      setNewNotes("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePortfolioPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio_perf"] });
    },
  });

  const positions = portfolioData?.positions || [];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || !newQuantity || !newPrice) return;
    addMutation.mutate({
      symbol: newSymbol.toUpperCase(),
      quantity: parseFloat(newQuantity),
      entry_price: parseFloat(newPrice),
      notes: newNotes,
    });
  };

  const totalInvested = positions.reduce((sum: number, p: any) => sum + (p.invested_amount || 0), 0);
  const totalValue = positions.reduce((sum: number, p: any) => sum + (p.current_value || 0), 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const isPositive = totalPnl >= 0;

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-brand" />
            Virtual Portfolio Simulator
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Track multi-currency mock equity positions with real-time mark-to-market valuation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="btn btn-ghost flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            Add Position
          </button>
        </div>
      </div>

      {/* ── Portfolio Overview Metrics Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <span className="text-xs text-text-muted font-medium">Portfolio Current Value</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <DollarSign className="h-5 w-5 text-brand" />
          </div>
        </div>

        <div className="card p-5">
          <span className="text-xs text-text-muted font-medium">Total Invested Capital</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-text-muted">Cost Basis</span>
          </div>
        </div>

        <div className="card p-5">
          <span className="text-xs text-text-muted font-medium">Total Unrealized P&L</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold font-mono flex items-center gap-1 ${
                isPositive ? "text-positive" : "text-negative"
              }`}
            >
              {isPositive ? "+" : ""}
              {totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                isPositive ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
              }`}
            >
              {isPositive ? "+" : ""}
              {totalPnlPct.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="card p-5">
          <span className="text-xs text-text-muted font-medium">Active Holdings</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {positions.length}
            </span>
            <PieChart className="h-5 w-5 text-text-muted" />
          </div>
        </div>
      </div>

      {/* ── Positions Table ──────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-text-primary">Open Equity Positions</h3>
          <span className="text-xs text-text-muted">{positions.length} positions held</span>
        </div>

        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Valuating holdings..." />
          </div>
        ) : positions.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm space-y-3">
            <p>Your portfolio is currently empty.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary text-xs"
            >
              Add Your First Holding
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Avg Entry</th>
                  <th className="py-3 px-4 text-right">Current Price</th>
                  <th className="py-3 px-4 text-right">Current Value</th>
                  <th className="py-3 px-4 text-right">Total P&L</th>
                  <th className="py-3 px-4 text-right">Day Return</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {positions.map((pos: any) => {
                  const isPosGain = (pos.pnl_abs ?? 0) >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-mono text-text-primary">
                        <Link to={`/stocks/${pos.symbol}`} className="hover:text-brand">
                          {pos.symbol}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-text-secondary">
                        {pos.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-text-secondary">
                        {pos.entry_price ? pos.entry_price.toFixed(2) : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-text-primary">
                        {pos.current_price ? pos.current_price.toFixed(2) : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-text-primary">
                        {pos.current_value ? pos.current_value.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-semibold font-mono ${
                            isPosGain ? "text-positive" : "text-negative"
                          }`}
                        >
                          {isPosGain ? "+" : ""}
                          {pos.pnl_abs?.toFixed(2)} ({isPosGain ? "+" : ""}
                          {pos.pnl_pct?.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-text-muted">
                        {pos.day_change_pct ? `${pos.day_change_pct >= 0 ? "+" : ""}${pos.day_change_pct.toFixed(2)}%` : "0.00%"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => deleteMutation.mutate(pos.id)}
                          className="p-1 text-text-muted hover:text-negative hover:bg-surface-elevated rounded transition-colors"
                          title="Close position"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Position Modal ────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md space-y-4 bg-surface shadow-2xl border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text-primary">Add Simulated Holding</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-text-secondary font-semibold mb-1">
                  Ticker Symbol (e.g. RELIANCE.NS, TCS.NS, AAPL)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ticker symbol..."
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary uppercase font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="10"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="2500.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-semibold mb-1">
                  Investment Notes / Thesis (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fundamental thesis, swing target..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="btn btn-primary text-xs px-4"
                >
                  {addMutation.isPending ? "Adding..." : "Add to Portfolio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
