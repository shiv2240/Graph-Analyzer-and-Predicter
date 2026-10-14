import React from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { fetchHealth } from "../services/marketData";

export default function SettingsPage() {
  const { data: health, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 30000,
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

      {/* ── System Microservices Health Status ─────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Server className="h-4 w-4 text-brand" />
          Microservice Health & Dependencies
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Node Backend */}
          <div className="p-4 bg-surface-elevated rounded-lg space-y-2 border border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">Backend API (Express)</span>
              <span className="badge badge-surface text-[10px] text-positive border border-positive/30">
                Online
              </span>
            </div>
            <p className="text-text-muted">Port 3001 | REST & WebSocket relay</p>
          </div>

          {/* PostgreSQL */}
          <div className="p-4 bg-surface-elevated rounded-lg space-y-2 border border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">PostgreSQL Database</span>
              <span
                className={`badge badge-surface text-[10px] ${
                  health?.dependencies?.postgres === "ok"
                    ? "text-positive border border-positive/30"
                    : "text-text-muted"
                }`}
              >
                {health?.dependencies?.postgres === "ok" ? "Connected" : "Standby / Initializing"}
              </span>
            </div>
            <p className="text-text-muted">Port 5432 | Portfolios, candles & reports</p>
          </div>

          {/* AI Microservice */}
          <div className="p-4 bg-surface-elevated rounded-lg space-y-2 border border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">AI / ML Service (FastAPI)</span>
              <span
                className={`badge badge-surface text-[10px] ${
                  health?.dependencies?.ai_service === "ok"
                    ? "text-positive border border-positive/30"
                    : "text-text-muted"
                }`}
              >
                {health?.dependencies?.ai_service === "ok" ? "Connected" : "Standby / Initializing"}
              </span>
            </div>
            <p className="text-text-muted">Port 8000 | XGBoost, FinBERT & Indicators</p>
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
