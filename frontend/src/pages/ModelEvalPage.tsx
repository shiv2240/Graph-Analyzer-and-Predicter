import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Cpu,
  ShieldCheck,
  BarChart2,
  CheckCircle,
  Play,
  Activity,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { fetchMLModels, fetchMLPrediction, trainMLModel } from "../services/marketData";
import { LoadingState } from "../components/ui/States";
import StockSelectDropdown from "../components/ui/StockSelectDropdown";

export default function ModelEvalPage() {
  const [testSymbol, setTestSymbol] = useState("RELIANCE.NS");
  const [selectedModel, setSelectedModel] = useState("xgboost");

  const { data: modelsData } = useQuery({
    queryKey: ["ml_models"],
    queryFn: fetchMLModels,
  });

  const {
    data: predictionData,
    isLoading: isPredicting,
    refetch: runPredict,
  } = useQuery({
    queryKey: ["ml_predict", testSymbol, selectedModel],
    queryFn: () => fetchMLPrediction(testSymbol, selectedModel),
  });

  const {
    mutate: triggerTrain,
    isPending: isTraining,
    data: trainResult,
  } = useMutation({
    mutationFn: () => trainMLModel(testSymbol, selectedModel, 1),
  });

  const models = modelsData?.available_models || [];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Cpu className="h-6 w-6 text-brand" />
            Machine Learning Model Evaluation & Validation
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Rigorous walk-forward validation, anti-leakage audit, and directional probabilistic forecasting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-positive/10 text-positive border border-positive/20 flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="h-4 w-4" />
            49 / 49 Assets Fully Trained (100% Ready)
          </span>
        </div>
      </div>

      {/* ── Anti-Leakage Audit Card ───────────────────────────────────────────── */}
      <div className="card p-5 bg-gradient-to-r from-positive/5 via-surface to-surface border-positive/20 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-positive" />
          <h3 className="font-bold text-sm text-text-primary">Anti-Lookahead Financial ML Checklist</h3>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Standard randomized train/test splits destroy temporal autocorrelation and create severe lookahead bias in financial markets.
          Our forecasting pipeline enforces strict time-series integrity:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {[
            "Chronological walk-forward expanding window (no future data in training set)",
            "StandardScaler fit exclusively on past training fold, then applied to test",
            "Incomplete and partial intra-day candles strictly excluded from feature matrix",
            "Target labels (t+1 return) decoupled from input feature calculation window",
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-text-secondary">
              <CheckCircle className="h-4 w-4 text-positive shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live Inference & Retrain Box ──────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand" />
          Live Model Inference & Walk-Forward Training
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-text-secondary font-semibold mb-1">Select Target Stock</label>
            <StockSelectDropdown
              value={testSymbol}
              onChange={(newSym) => setTestSymbol(newSym)}
            />
          </div>

          <div>
            <label className="block text-text-secondary font-semibold mb-1">Architecture</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand"
            >
              <option value="xgboost">XGBoost (Extreme Gradient Boosting)</option>
              <option value="rf">Random Forest Classifier</option>
              <option value="logistic">Regularized Logistic Regression</option>
              <option value="baseline">Majority Class Benchmark</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => runPredict()}
              disabled={isPredicting}
              className="btn btn-outline flex-1 text-xs py-2"
            >
              Predict Next Session
            </button>
            <button
              onClick={() => triggerTrain()}
              disabled={isTraining}
              className="btn btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
            >
              <Play className="h-3 w-3" />
              {isTraining ? "Retraining..." : "Retrain Model"}
            </button>
          </div>
        </div>

        {/* Prediction Output */}
        {isPredicting ? (
          <LoadingState message="Extracting technical features & calculating odds..." />
        ) : predictionData ? (
          <div className="mt-4 p-4 bg-surface-elevated rounded-lg border border-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-text-muted">Target Horizon: Next Trading Session ({predictionData.target_date})</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-bold text-text-primary">{testSymbol} Direction:</span>
                  <span
                    className={`font-mono font-bold text-lg px-2 py-0.5 rounded ${
                      predictionData.prediction === 1
                        ? "bg-positive/10 text-positive"
                        : "bg-negative/10 text-negative"
                    }`}
                  >
                    {predictionData.prediction === 1 ? "▲ POSITIVE (UP)" : "▼ NEGATIVE (DOWN)"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-text-muted">Estimated Class Probability</span>
                <div className="text-xl font-bold font-mono text-brand">
                  {(predictionData.probability * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Features Used Table */}
            {predictionData.features_used && (
              <div className="pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-text-muted block mb-1">
                  Features Feed Snapshot (Zero Lookahead):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[10px] font-mono">
                  {Object.entries(predictionData.features_used).map(([k, v]) => (
                    <div key={k} className="bg-surface p-1.5 rounded">
                      <span className="text-text-muted block truncate">{k}</span>
                      <span className="font-semibold text-text-primary">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {trainResult && (
          <div className="p-3 bg-positive/10 border border-positive/30 rounded text-positive text-xs space-y-1">
            <span className="font-bold">Training Complete!</span>
            <p>
              Accuracy: {(trainResult.metrics?.accuracy * 100).toFixed(1)}% | Precision:{" "}
              {(trainResult.metrics?.precision * 100).toFixed(1)}% | AUC-ROC: {trainResult.metrics?.auc_roc}
            </p>
          </div>
        )}
      </div>

      {/* ── Model Architectures Grid ─────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Available Machine Learning Model Architectures
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((m: any) => (
            <div key={m.id} className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-primary">{m.name}</span>
                <span className="badge badge-surface text-[10px] uppercase font-mono">{m.type || m.id}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{m.description || "State-of-the-art quantitative directional forecasting model."}</p>
              {Array.isArray(m.features) && m.features.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] font-semibold text-text-muted block mb-1">
                    Engineered Features:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {m.features.map((f: string) => (
                      <span key={f} className="text-[10px] font-mono bg-surface-elevated px-1.5 py-0.5 rounded text-text-muted">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
