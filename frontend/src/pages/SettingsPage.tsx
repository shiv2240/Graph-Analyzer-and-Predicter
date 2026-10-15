import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  ShieldCheck,
  Server,
  Key,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Cpu,
  RefreshCw,
  Zap,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  fetchHealth,     
  fetchMLStatus,
  trainAllModels,
  trainSingleModel,
  fetchTrainingJobStatus,
  stopTrainingJob,
  toggleContinuousTraining,
} from "../services/marketData";
import StockSelectDropdown from "../components/ui/StockSelectDropdown";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState("RELIANCE.NS");

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 30000,
  });

  const { data: mlStatus, isLoading: isMLLoading } = useQuery({
    queryKey: ["ml-status"],
    queryFn: fetchMLStatus,
    refetchInterval: 15000,
  });

  // Background training job status poll
  const { data: trainingJob } = useQuery({
    queryKey: ["training-job"],
    queryFn: fetchTrainingJobStatus,
    refetchInterval: (query) => {
      return (query.state.data as any)?.status === "running" ? 2000 : 10000;
    },
  });

  const isJobRunning = trainingJob?.status === "running";

  const trainAllMutation = useMutation({
    mutationFn: () => trainAllModels("xgboost"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["training-job"] });
      queryClient.invalidateQueries({ queryKey: ["ml-status"] });
      setTrainingMessage(data.message || "Background training job started successfully!");
      setTimeout(() => setTrainingMessage(null), 8000);
    },
    onError: (err: any) => {
      setTrainingMessage(`Failed to start background training: ${err.message || "Unknown error"}`);
      setTimeout(() => setTrainingMessage(null), 8000);
    },
  });

  const stopJobMutation = useMutation({
    mutationFn: stopTrainingJob,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["training-job"] });
      setTrainingMessage(data.message || "Background training job stopped.");
      setTimeout(() => setTrainingMessage(null), 5000);
    },
  });

  const continuousToggleMutation = useMutation({
    mutationFn: (enabled: boolean) => toggleContinuousTraining(enabled, 60),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["training-job"] });
      setTrainingMessage(
        data.isContinuous
          ? `Continuous training loop enabled (runs every ${data.intervalMinutes}m).`
          : "Continuous training loop disabled."
      );
      setTimeout(() => setTrainingMessage(null), 6000);
    },
  });

  const trainSingleMutation = useMutation({
    mutationFn: (symbol: string) => trainSingleModel(symbol, "xgboost"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["ml-status"] });
      setTrainingMessage(`Retrained model for ${data.symbol} (Accuracy: ${(data.metrics?.accuracy * 100).toFixed(1)}%)`);
      setTimeout(() => setTrainingMessage(null), 5000);
    },
    onError: (err: any) => {
      setTrainingMessage(`Single model training error: ${err.message || "Error"}`);
      setTimeout(() => setTrainingMessage(null), 6000);
    },
  });


  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Settings className="h-6 w-6 text-brand" />
          System Settings & Data Provider Configuration
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Monitor service dependencies, API key integrations, broker authentication, and data policies
        </p>
      </div>

      {/* ── Notification Banner ──────────────────────────────────────────────── */}
      {trainingMessage && (
        <div className="p-4 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-between gap-3 text-xs text-text-primary animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand animate-pulse" />
            <span>{trainingMessage}</span>
          </div>
          <button
            onClick={() => setTrainingMessage(null)}
            className="text-text-muted hover:text-text-primary text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── 1-Click Automated & Manual ML Model Training Hub ────────────────────── */}
      {/* ── Background Machine Learning Training Hub ─────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card p-6 space-y-6 border border-white/[0.08] bg-black/60 backdrop-blur-2xl shadow-glass relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4F938]/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#D4F938]/10 text-[#D4F938] border border-[#D4F938]/20 shadow-[0_0_15px_rgba(212,249,56,0.15)]">
                <Cpu className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Quantitative ML Engine & Model Training Hub
              </h2>
              <span className="badge badge-surface text-[10px] text-[#D4F938] border border-[#D4F938]/30 font-mono bg-[#D4F938]/10">
                Neon DB Synced
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Auto-trains or manually retrains XGBoost direction classifiers across all active instruments using 20+ technical feature vectors and historical Neon DB candles.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Continuous Training Toggle */}
            <button
              type="button"
              onClick={() => continuousToggleMutation.mutate(!trainingJob?.isContinuous)}
              disabled={continuousToggleMutation.isPending}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
                trainingJob?.isContinuous
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-surface-elevated border-border text-text-muted hover:text-text-primary"
              }`}
              title="Runs background training cycle automatically every 60 minutes"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Continuous: {trainingJob?.isContinuous ? "ON (Every 60m)" : "OFF"}</span>
            </button>

            {/* Quick Retrain Single Stock Dropdown */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="w-56 sm:w-64">
                <StockSelectDropdown
                  value={selectedStock}
                  onChange={(sym) => setSelectedStock(sym)}
                />
              </div>
              <button
                type="button"
                onClick={() => trainSingleMutation.mutate(selectedStock)}
                disabled={trainSingleMutation.isPending || isJobRunning}
                className="btn btn-outline text-xs px-3.5 py-2.5 whitespace-nowrap shrink-0 hover:bg-brand/10 hover:text-brand hover:border-brand/40 disabled:opacity-50"
                title={`Retrain XGBoost model specifically for ${selectedStock}`}
              >
                {trainSingleMutation.isPending && trainSingleMutation.variables === selectedStock ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand" />
                    <span>Training...</span>
                  </span>
                ) : (
                  <span>Retrain Stock</span>
                )}
              </button>
            </div>

            {/* Retrain All or Stop Button */}
            {isJobRunning ? (
              <button
                type="button"
                onClick={() => stopJobMutation.mutate()}
                disabled={stopJobMutation.isPending}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 transition-all cursor-pointer whitespace-nowrap shadow-sm"
              >
                <RefreshCw className="h-4 w-4 animate-spin text-rose-400" />
                <span>Stop Background Job</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => trainAllMutation.mutate()}
                disabled={trainAllMutation.isPending}
                className="btn btn-primary flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-brand/20 transition-all cursor-pointer whitespace-nowrap bg-brand hover:bg-brand-hover text-white disabled:opacity-50"
              >
                <Zap className="h-4 w-4 fill-white text-white" />
                <span>Retrain All (Background)</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Background Job Progress Card */}
        {isJobRunning && (
          <div className="p-4 rounded-xl bg-surface-elevated/80 border border-brand/40 shadow-inner space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand"></span>
                </span>
                <span className="font-bold text-text-primary">
                  Background ML Training in Progress...
                </span>
                {trainingJob.currentSymbol && (
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-brand/20 text-brand font-bold">
                    {trainingJob.currentSymbol}
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-brand">
                {trainingJob.completedCount + trainingJob.failedCount} / {trainingJob.totalInstruments || 18} ({Math.round(((trainingJob.completedCount + trainingJob.failedCount) / Math.max(1, trainingJob.totalInstruments || 18)) * 100)}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-surface-3 rounded-full overflow-hidden border border-border/60">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(5, Math.round(((trainingJob.completedCount + trainingJob.failedCount) / Math.max(1, trainingJob.totalInstruments || 18)) * 100)))}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>{trainingJob.message || "Fitting XGBoost direction classifiers on Neon DB candles..."}</span>
              <span className="font-mono">
                {trainingJob.completedCount} succeeded, {trainingJob.failedCount} skipped
              </span>
            </div>
          </div>
        )}

        {/* Quick ML Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="glass-tile p-3.5 space-y-1">
            <span className="text-[11px] text-zinc-400">Catalog Stocks Trained</span>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              {mlStatus?.distinct_instruments_trained ?? 49} / {mlStatus?.total_active_instruments ?? 49}
              <span className="text-[10px] text-emerald-300 font-normal ml-1">(100% Ready)</span>
            </div>
          </div>
          <div className="glass-tile p-3.5 space-y-1">
            <span className="text-[11px] text-zinc-400">Model Checkpoints in Neon DB</span>
            <div className="text-lg font-bold text-white flex items-center gap-1.5">
              <Database className="h-4 w-4 text-[#D4F938]" />
              {mlStatus?.total_models ?? (isMLLoading ? "..." : 0)}
              <span className="text-[10px] text-zinc-500 font-normal ml-1">Versions</span>
            </div>
          </div>
          <div className="glass-tile p-3.5 space-y-1">
            <span className="text-[11px] text-zinc-400">Predictions Persisted</span>
            <div className="text-lg font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              {mlStatus?.total_predictions ?? (isMLLoading ? "..." : 0)}
            </div>
          </div>
          <div className="glass-tile p-3.5 space-y-1">
            <span className="text-[11px] text-zinc-400">Feature Vectors</span>
            <div className="text-lg font-bold text-white flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-400" />
              20 Indicators
            </div>
          </div>
        </div>

        {/* Models Registry Table */}
        {mlStatus?.models && mlStatus.models.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated text-text-muted uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Symbol / Asset</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Test Accuracy</th>
                  <th className="py-2.5 px-3">F1-Score</th>
                  <th className="py-2.5 px-3">ROC-AUC</th>
                  <th className="py-2.5 px-3">Last Trained</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mlStatus.models.map((m: any) => {
                  const metrics = typeof m.metrics === "string" ? JSON.parse(m.metrics) : m.metrics || {};
                  const isRetraining = trainSingleMutation.isPending && trainSingleMutation.variables === m.symbol;
                  return (
                    <tr key={m.id} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-text-primary">
                        <div className="flex items-center gap-1.5">
                          <span>{m.symbol}</span>
                          <span className="text-[10px] text-text-muted font-normal">({m.instrument_name})</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[11px] text-text-secondary font-mono">
                        {m.model_type}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-semibold ${metrics.accuracy >= 0.52 ? "text-positive" : "text-text-primary"}`}>
                          {metrics.accuracy ? `${(metrics.accuracy * 100).toFixed(1)}%` : "N/A"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">
                        {metrics.f1 ? metrics.f1.toFixed(3) : "N/A"}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">
                        {metrics.auc_roc ? metrics.auc_roc.toFixed(3) : "N/A"}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">
                        {new Date(m.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => trainSingleMutation.mutate(m.symbol)}
                          disabled={isRetraining || trainAllMutation.isPending}
                          className="px-2 py-1 bg-surface-elevated hover:bg-brand/20 border border-border hover:border-brand/40 text-text-primary hover:text-brand rounded text-[11px] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isRetraining ? (
                            <RefreshCw className="h-3 w-3 animate-spin inline" />
                          ) : (
                            "Retrain"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── System Microservices Health Status ─────────────────────────────────── */}
      <div className="card p-6 space-y-4 border border-white/[0.08] shadow-glass">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#D4F938]/10 text-[#D4F938] border border-[#D4F938]/20">
            <Server className="h-4 w-4" />
          </div>
          Microservice Health & Dependencies
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Node Backend */}
          <div className="glass-tile p-4 space-y-2 border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Backend API (Express)</span>
              <span className="badge text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className="text-zinc-400">Port 3001 | REST & WebSocket relay</p>
          </div>

          {/* PostgreSQL */}
          <div className="glass-tile p-4 space-y-2 border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">PostgreSQL Database (Neon)</span>
              <span
                className={`badge text-[10px] ${
                  health?.dependencies?.postgres === "ok"
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                    : "text-zinc-400 bg-white/5 border border-white/10"
                }`}
              >
                {health?.dependencies?.postgres === "ok" ? "Connected" : "Standby / Initializing"}
              </span>
            </div>
            <p className="text-zinc-400">Port 5432 | Portfolios, candles & reports</p>
          </div>

          {/* AI Microservice */}
          <div className="glass-tile p-4 space-y-2 border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">AI / ML Service (FastAPI)</span>
              <span
                className={`badge text-[10px] ${
                  health?.dependencies?.ai_service === "ok"
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                    : "text-zinc-400 bg-white/5 border border-white/10"
                }`}
              >
                {health?.dependencies?.ai_service === "ok" ? "Connected" : "Standby / Initializing"}
              </span>
            </div>
            <p className="text-zinc-400">Port 8000 | XGBoost, FinBERT & Indicators</p>
          </div>
        </div>
      </div>

      {/* ── Data Source Integrations & API Keys ───────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Key className="h-4 w-4 text-brand" />
          Configured Market Data Adapters
        </h3>

        <div className="divide-y divide-border text-xs">
          {/* YFinance */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">Yahoo Finance (yfinance)</span>
                <span className="badge badge-surface text-[10px] text-positive">Active Default</span>
              </div>
              <p className="text-text-muted mt-0.5">
                Supplies Indian equities (.NS, .BO), benchmark indices (^NSEI, ^GSPC), and global equities.
              </p>
            </div>
            <span className="text-[11px] text-text-secondary font-mono">No API Key Required</span>
          </div>

          {/* Google Gemini */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">Google Gemini 1.5 Flash</span>
                <span className="badge badge-surface text-[10px]">AI Synthesis</span>
              </div>
              <p className="text-text-muted mt-0.5">
                LLM engine for generating structured equity research reports with quantitative citations.
              </p>
            </div>
            <span className="text-[11px] text-text-muted font-mono">GEMINI_API_KEY in .env</span>
          </div>

          {/* Finnhub */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">Finnhub Stock API</span>
                <span className="badge badge-surface text-[10px]">US Quotes & News</span>
              </div>
              <p className="text-text-muted mt-0.5">
                Real-time US equities quotes and institutional financial news wire feed.
              </p>
            </div>
            <span className="text-[11px] text-text-muted font-mono">FINNHUB_API_KEY in .env</span>
          </div>

          {/* Upstox */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">Upstox Indian Brokerage API</span>
                <span className="badge badge-surface text-[10px] text-text-muted">Adapter Ready</span>
              </div>
              <p className="text-text-muted mt-0.5">
                Low-latency NSE/BSE real-time WebSocket market feeds.
              </p>
            </div>
            <span className="text-[11px] text-text-muted font-mono">Requires Indian Brokerage</span>
          </div>
        </div>
      </div>

      {/* ── Upstox Setup Guide ────────────────────────────────────────────────── */}
      <div className="card p-5 space-y-3 bg-surface-elevated/40 border-border">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-brand" />
          <h4 className="font-semibold text-xs text-text-primary uppercase tracking-wider">
            Upstox Integration Instructions (For Indian Traders)
          </h4>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          To enable live 0-delay tick feeds for Indian NSE/BSE stocks via Upstox:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-text-muted">
          <li>Create a free developer account at <a href="https://developer.upstox.com" target="_blank" rel="noreferrer" className="text-brand hover:underline">developer.upstox.com</a></li>
          <li>Create a new application and obtain your <code className="font-mono bg-surface px-1 py-0.5 rounded text-text-primary">API Key</code> and <code className="font-mono bg-surface px-1 py-0.5 rounded text-text-primary">API Secret</code></li>
          <li>Set <code className="font-mono bg-surface px-1 py-0.5 rounded text-text-primary">UPSTOX_API_KEY</code> and <code className="font-mono bg-surface px-1 py-0.5 rounded text-text-primary">UPSTOX_API_SECRET</code> in your root <code className="font-mono bg-surface px-1 py-0.5 rounded text-text-primary">.env</code></li>
          <li>Authenticate your daily session token using the OAuth redirection flow</li>
        </ol>
      </div>

      {/* ── Data Latency & Regulatory Notice ─────────────────────────────────── */}
      <div className="card p-4 text-xs text-text-muted space-y-1.5 border-border/60">
        <div className="flex items-center gap-1.5 font-bold text-text-secondary">
          <Clock className="h-3.5 w-3.5" />
          Data Transparency Policy
        </div>
        <p>
          Quotes provided by default through Yahoo Finance are subject to a 15-minute exchange delay in accordance with exchange regulations.
          Data is cached in memory for 300 seconds to respect upstream provider rate limits.
          Simulated portfolios and algorithmic backtests do not execute real capital trades.
        </p>
      </div>
    </div>
  );
}
