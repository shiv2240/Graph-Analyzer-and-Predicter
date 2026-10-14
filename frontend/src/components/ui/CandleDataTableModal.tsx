import React, { useState, useMemo } from "react";
import { X, Download, Search, ArrowUpDown, Calendar, Table as TableIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CandleBar } from "../../services/marketData";

interface CandleDataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  candles: CandleBar[];
  symbol: string;
  interval: string;
}

export default function CandleDataTableModal({
  isOpen,
  onClose,
  candles,
  symbol,
  interval,
}: CandleDataTableModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredCandles = useMemo(() => {
    let list = [...candles];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.ts.toLowerCase().includes(q) ||
          c.close.toString().includes(q) ||
          c.open.toString().includes(q)
      );
    }
    list.sort((a, b) => {
      const diff = new Date(a.ts).getTime() - new Date(b.ts).getTime();
      return sortAsc ? diff : -diff;
    });
    return list;
  }, [candles, searchTerm, sortAsc]);

  const handleExportCSV = () => {
    if (!candles.length) return;
    const headers = ["Timestamp", "Open", "High", "Low", "Close", "Volume", "AdjClose"];
    const rows = candles.map((c) => [
      c.ts,
      c.open,
      c.high,
      c.low,
      c.close,
      c.volume,
      c.adjClose ?? c.close,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${symbol}_${interval}_candles.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-5xl h-[85vh] bg-[#0E131E] border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs"
        >
          {/* Header */}
          <div className="p-4 border-b border-border/80 bg-surface-1/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-brand/15 border border-brand/30 text-brand">
                <TableIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span>Complete Historical Candle Data Inspector</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/30">
                    {symbol} ({interval})
                  </span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Complete OHLCV raw data records with exact timestamps and volume.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand/15 hover:bg-brand/25 text-brand border border-brand/30 font-semibold transition-all shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-3 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search & Stats Bar */}
          <div className="p-3 bg-surface-2/40 border-b border-border/50 flex flex-wrap items-center justify-between gap-3 font-mono">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search date, price..."
                className="w-full bg-surface-3/60 border border-border/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center gap-4 text-[11px] text-text-muted">
              <button
                type="button"
                onClick={() => setSortAsc(!sortAsc)}
                className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-brand" />
                <span>Sort by Date: {sortAsc ? "Oldest First" : "Newest First"}</span>
              </button>
              <span>Total Bars: <strong className="text-text-primary">{filteredCandles.length}</strong></span>
            </div>
          </div>

          {/* Scrollable Data Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left font-mono border-collapse">
              <thead className="bg-[#111622] sticky top-0 z-10 text-[11px] text-text-muted uppercase border-b border-border/80">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Timestamp (UTC / Local)</th>
                  <th className="p-3 text-right">Open</th>
                  <th className="p-3 text-right">High</th>
                  <th className="p-3 text-right">Low</th>
                  <th className="p-3 text-right">Close</th>
                  <th className="p-3 text-right">Return %</th>
                  <th className="p-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-xs">
                {filteredCandles.map((c, i) => {
                  const chg = c.open ? ((c.close - c.open) / c.open) * 100 : 0;
                  const isBull = c.close >= c.open;
                  return (
                    <tr
                      key={c.ts + i}
                      className="hover:bg-surface-2/40 transition-colors"
                    >
                      <td className="p-3 text-text-muted text-[11px]">{i + 1}</td>
                      <td className="p-3 text-text-primary whitespace-nowrap">
                        {new Date(c.ts).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-medium text-text-primary">
                        {c.open.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-medium text-positive">
                        {c.high.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-medium text-negative">
                        {c.low.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-text-primary">
                        {c.close.toFixed(2)}
                      </td>
                      <td
                        className={`p-3 text-right font-bold ${
                          isBull ? "text-positive" : "text-negative"
                        }`}
                      >
                        {isBull ? "+" : ""}
                        {chg.toFixed(2)}%
                      </td>
                      <td className="p-3 text-right text-text-muted">
                        {c.volume?.toLocaleString() || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border/50 bg-[#111622] text-[11px] text-text-muted flex items-center justify-between">
            <span>Showing verified exchange market records.</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-surface-3 text-text-primary hover:bg-surface-4 font-sans"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
