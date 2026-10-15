import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { providerRegistry } from "../providers/registry";
import { cache } from "../cache/cacheService";
import { logger } from "../utils/logger";

const router = Router();

const filterSchema = z.object({
  field: z.string(),
  operator: z.enum(["gt", "lt", "eq", "gte", "lte", "contains"]),
  value: z.union([z.number(), z.string()]),
});

const screenerRequestSchema = z.object({
  filters: z.array(filterSchema).default([]),
  search: z.string().optional().default(""),
  sort: z.object({
    field: z.string().default("change_pct"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  }).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(50),
});

export interface UniverseStock {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE" | "NASDAQ" | "NYSE" | "CRYPTO" | "COMEX" | "NYMEX";
  country: "IN" | "US";
  currency: "INR" | "USD";
  sector: string;
  basePrice: number;
  baseChangePct: number;
  baseVolume: number;
  baseRsi: number;
}

export const UNIVERSE: UniverseStock[] = [
  // ─── 🇮🇳 INDIAN EQUITIES & INDICES (NIFTY 50 + BENCHMARKS) ────────────────
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Energy & Telecom", basePrice: 2942.50, baseChangePct: 0.65, baseVolume: 4850000, baseRsi: 56.4 },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Technology & IT", basePrice: 4180.20, baseChangePct: 0.42, baseVolume: 2120000, baseRsi: 52.1 },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Banking & Financials", basePrice: 1685.10, baseChangePct: 0.78, baseVolume: 14200000, baseRsi: 58.6 },
  { symbol: "INFY.NS", name: "Infosys Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Technology & IT", basePrice: 1920.40, baseChangePct: -0.35, baseVolume: 5980000, baseRsi: 48.9 },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Banking & Financials", basePrice: 1245.80, baseChangePct: 1.12, baseVolume: 11800000, baseRsi: 63.2 },
  { symbol: "SBIN.NS", name: "State Bank of India", exchange: "NSE", country: "IN", currency: "INR", sector: "Public Sector Banking", basePrice: 812.30, baseChangePct: 0.95, baseVolume: 16400000, baseRsi: 59.8 },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Telecommunications", basePrice: 1690.00, baseChangePct: 1.45, baseVolume: 6200000, baseRsi: 67.4 },
  { symbol: "ITC.NS", name: "ITC Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Consumer Goods & FMCG", basePrice: 485.60, baseChangePct: -0.20, baseVolume: 9800000, baseRsi: 46.8 },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Banking & Financials", basePrice: 1795.50, baseChangePct: 0.30, baseVolume: 3400000, baseRsi: 51.5 },
  { symbol: "LT.NS", name: "Larsen & Toubro Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Infrastructure & Engineering", basePrice: 3580.00, baseChangePct: 1.25, baseVolume: 2800000, baseRsi: 61.3 },
  { symbol: "AXISBANK.NS", name: "Axis Bank Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Banking & Financials", basePrice: 1175.40, baseChangePct: 0.55, baseVolume: 7100000, baseRsi: 53.7 },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Automobiles & EV", basePrice: 925.60, baseChangePct: -0.80, baseVolume: 8900000, baseRsi: 44.2 },
  { symbol: "TATASTEEL.NS", name: "Tata Steel Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Metals & Mining", basePrice: 152.40, baseChangePct: 1.80, baseVolume: 28400000, baseRsi: 62.9 },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki India Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Automobiles", basePrice: 11850.00, baseChangePct: 0.40, baseVolume: 450000, baseRsi: 54.0 },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical Industries", exchange: "NSE", country: "IN", currency: "INR", sector: "Healthcare & Pharma", basePrice: 1880.20, baseChangePct: 1.10, baseVolume: 2300000, baseRsi: 64.1 },
  { symbol: "TITAN.NS", name: "Titan Company Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Consumer Discretionary", basePrice: 3450.00, baseChangePct: -0.45, baseVolume: 1100000, baseRsi: 47.3 },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "NBFC & Fintech", basePrice: 7120.00, baseChangePct: 0.85, baseVolume: 1350000, baseRsi: 57.2 },
  { symbol: "WIPRO.NS", name: "Wipro Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Technology & IT", basePrice: 540.80, baseChangePct: 0.20, baseVolume: 6500000, baseRsi: 49.5 },
  { symbol: "HCLTECH.NS", name: "HCL Technologies Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Technology & IT", basePrice: 1845.00, baseChangePct: 0.60, baseVolume: 2800000, baseRsi: 55.3 },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Paints & Chemicals", basePrice: 2960.00, baseChangePct: -1.85, baseVolume: 1400000, baseRsi: 32.4 },
  { symbol: "NTPC.NS", name: "NTPC Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Utilities & Power", basePrice: 418.50, baseChangePct: 1.30, baseVolume: 12500000, baseRsi: 65.0 },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp of India", exchange: "NSE", country: "IN", currency: "INR", sector: "Utilities & Grid", basePrice: 338.20, baseChangePct: 0.70, baseVolume: 9400000, baseRsi: 58.1 },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", exchange: "NSE", country: "IN", currency: "INR", sector: "Energy & Exploration", basePrice: 288.40, baseChangePct: 1.60, baseVolume: 15200000, baseRsi: 63.5 },
  { symbol: "COALINDIA.NS", name: "Coal India Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Energy & Mining", basePrice: 492.10, baseChangePct: 0.45, baseVolume: 8300000, baseRsi: 53.0 },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Conglomerate", basePrice: 2980.00, baseChangePct: 2.10, baseVolume: 3100000, baseRsi: 66.8 },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports and SEZ", exchange: "NSE", country: "IN", currency: "INR", sector: "Ports & Infrastructure", basePrice: 1385.00, baseChangePct: 1.05, baseVolume: 4500000, baseRsi: 60.2 },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Cement & Materials", basePrice: 11450.00, baseChangePct: 0.50, baseVolume: 380000, baseRsi: 52.8 },
  { symbol: "NESTLEIND.NS", name: "Nestle India Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Consumer Goods & FMCG", basePrice: 2380.00, baseChangePct: -0.30, baseVolume: 620000, baseRsi: 48.1 },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Metals & Steel", basePrice: 985.20, baseChangePct: 1.40, baseVolume: 3900000, baseRsi: 61.5 },
  { symbol: "GRASIM.NS", name: "Grasim Industries Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Diversified", basePrice: 2640.00, baseChangePct: 0.65, baseVolume: 980000, baseRsi: 54.6 },
  { symbol: "TECHM.NS", name: "Tech Mahindra Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Technology & IT", basePrice: 1680.00, baseChangePct: 0.90, baseVolume: 2100000, baseRsi: 57.8 },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Consumer Goods & FMCG", basePrice: 2670.00, baseChangePct: -0.50, baseVolume: 1600000, baseRsi: 45.3 },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Financial Services", basePrice: 1890.00, baseChangePct: 0.75, baseVolume: 1750000, baseRsi: 55.0 },
  { symbol: "CIPLA.NS", name: "Cipla Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Healthcare & Pharma", basePrice: 1580.00, baseChangePct: 0.80, baseVolume: 1900000, baseRsi: 58.4 },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", exchange: "NSE", country: "IN", currency: "INR", sector: "Healthcare & Pharma", basePrice: 6680.00, baseChangePct: 0.35, baseVolume: 520000, baseRsi: 51.2 },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals Enterprise", exchange: "NSE", country: "IN", currency: "INR", sector: "Healthcare & Hospitals", basePrice: 6940.00, baseChangePct: 1.20, baseVolume: 680000, baseRsi: 62.0 },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Automobiles", basePrice: 4820.00, baseChangePct: 0.90, baseVolume: 750000, baseRsi: 56.7 },
  { symbol: "BPCL.NS", name: "Bharat Petroleum Corporation", exchange: "NSE", country: "IN", currency: "INR", sector: "Energy & Oil", basePrice: 345.50, baseChangePct: -1.20, baseVolume: 8200000, baseRsi: 34.0 },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Healthcare & Pharma", basePrice: 5420.00, baseChangePct: 1.50, baseVolume: 610000, baseRsi: 63.8 },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Automobiles", basePrice: 5280.00, baseChangePct: 0.40, baseVolume: 490000, baseRsi: 53.2 },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Metals & Aluminum", basePrice: 725.00, baseChangePct: 1.75, baseVolume: 7800000, baseRsi: 64.5 },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Food & FMCG", basePrice: 5890.00, baseChangePct: -0.25, baseVolume: 410000, baseRsi: 49.0 },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products", exchange: "NSE", country: "IN", currency: "INR", sector: "Consumer & FMCG", basePrice: 1140.00, baseChangePct: 0.30, baseVolume: 2200000, baseRsi: 52.3 },
  { symbol: "SBILIFE.NS", name: "SBI Life Insurance Company", exchange: "NSE", country: "IN", currency: "INR", sector: "Insurance", basePrice: 1760.00, baseChangePct: 0.60, baseVolume: 1300000, baseRsi: 55.4 },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance Company", exchange: "NSE", country: "IN", currency: "INR", sector: "Insurance", basePrice: 720.00, baseChangePct: 0.45, baseVolume: 3500000, baseRsi: 53.1 },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Banking & Financials", basePrice: 1380.00, baseChangePct: -2.30, baseVolume: 4200000, baseRsi: 29.8 },
  { symbol: "SHREECEM.NS", name: "Shree Cement Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Cement & Materials", basePrice: 24800.00, baseChangePct: 0.20, baseVolume: 75000, baseRsi: 50.8 },
  { symbol: "UPL.NS", name: "UPL Ltd", exchange: "NSE", country: "IN", currency: "INR", sector: "Agrochemicals", basePrice: 565.00, baseChangePct: -1.70, baseVolume: 3800000, baseRsi: 31.5 },
  { symbol: "^NSEI", name: "NIFTY 50 Benchmark Index", exchange: "NSE", country: "IN", currency: "INR", sector: "Index Benchmark", basePrice: 24850.00, baseChangePct: 0.45, baseVolume: 280000000, baseRsi: 58.2 },
  { symbol: "^NSEBANK", name: "NIFTY Bank Index", exchange: "NSE", country: "IN", currency: "INR", sector: "Index Sectoral", basePrice: 51400.00, baseChangePct: 0.68, baseVolume: 140000000, baseRsi: 59.4 },
  { symbol: "^BSESN", name: "S&P BSE SENSEX Index", exchange: "BSE", country: "IN", currency: "INR", sector: "Index Benchmark", basePrice: 81650.00, baseChangePct: 0.42, baseVolume: 95000000, baseRsi: 57.9 },
  { symbol: "GOLDBEES.NS", name: "Nippon India ETF Gold BeES", exchange: "NSE", country: "IN", currency: "INR", sector: "Precious Metals ETF", basePrice: 68.40, baseChangePct: 0.80, baseVolume: 8200000, baseRsi: 61.2 },
  { symbol: "SILVERBEES.NS", name: "Nippon India ETF Silver BeES", exchange: "NSE", country: "IN", currency: "INR", sector: "Precious Metals ETF", basePrice: 88.20, baseChangePct: 1.20, baseVolume: 5400000, baseRsi: 63.0 },

  // ─── 🇺🇸 US EQUITIES & BENCHMARKS (NASDAQ / NYSE / COMEX) ─────────────────
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Technology & Consumer Electronics", basePrice: 231.50, baseChangePct: 0.85, baseVolume: 48500000, baseRsi: 59.2 },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Software & Cloud Services", basePrice: 425.20, baseChangePct: 0.60, baseVolume: 22100000, baseRsi: 55.1 },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Semiconductors & AI Hardware", basePrice: 138.40, baseChangePct: 2.45, baseVolume: 68200000, baseRsi: 69.4 },
  { symbol: "GOOGL", name: "Alphabet Inc. (Google)", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Internet & Digital Advertising", basePrice: 182.10, baseChangePct: 0.75, baseVolume: 26400000, baseRsi: 56.8 },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "E-Commerce & Cloud AWS", basePrice: 194.80, baseChangePct: 1.15, baseVolume: 34200000, baseRsi: 61.2 },
  { symbol: "META", name: "Meta Platforms Inc. (Facebook)", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Social Media & AI", basePrice: 588.60, baseChangePct: 1.80, baseVolume: 18500000, baseRsi: 66.5 },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "EVs & Clean Energy", basePrice: 224.20, baseChangePct: -2.40, baseVolume: 52000000, baseRsi: 33.8 },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Semiconductors", basePrice: 156.40, baseChangePct: 1.65, baseVolume: 38100000, baseRsi: 62.3 },
  { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Entertainment & Streaming", basePrice: 712.50, baseChangePct: 0.90, baseVolume: 4200000, baseRsi: 58.7 },
  { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Semiconductors", basePrice: 22.80, baseChangePct: -2.10, baseVolume: 45000000, baseRsi: 28.5 },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", exchange: "NYSE", country: "US", currency: "USD", sector: "Enterprise AI & Defense", basePrice: 43.50, baseChangePct: 3.20, baseVolume: 44000000, baseRsi: 72.1 },
  { symbol: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Semiconductors & Software", basePrice: 182.30, baseChangePct: 1.40, baseVolume: 16800000, baseRsi: 63.5 },
  { symbol: "CSCO", name: "Cisco Systems, Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Networking & Security", basePrice: 55.80, baseChangePct: 0.35, baseVolume: 17500000, baseRsi: 52.4 },
  { symbol: "ORCL", name: "Oracle Corporation", exchange: "NYSE", country: "US", currency: "USD", sector: "Cloud Infrastructure & Database", basePrice: 176.40, baseChangePct: 1.20, baseVolume: 12400000, baseRsi: 60.8 },
  { symbol: "CRM", name: "Salesforce, Inc.", exchange: "NYSE", country: "US", currency: "USD", sector: "Enterprise CRM & Cloud", basePrice: 292.00, baseChangePct: 0.70, baseVolume: 7800000, baseRsi: 56.1 },
  { symbol: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Creative & Digital Software", basePrice: 515.00, baseChangePct: -1.40, baseVolume: 3100000, baseRsi: 34.5 },
  { symbol: "QCOM", name: "Qualcomm Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Wireless & Semiconductors", basePrice: 171.20, baseChangePct: 0.80, baseVolume: 9400000, baseRsi: 54.9 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", country: "US", currency: "USD", sector: "Investment Banking", basePrice: 224.80, baseChangePct: 0.95, baseVolume: 10200000, baseRsi: 59.6 },
  { symbol: "BAC", name: "Bank of America Corp", exchange: "NYSE", country: "US", currency: "USD", sector: "Banking & Financials", basePrice: 42.60, baseChangePct: 0.50, baseVolume: 28000000, baseRsi: 53.8 },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE", country: "US", currency: "USD", sector: "Digital Payments", basePrice: 286.40, baseChangePct: 0.65, baseVolume: 6800000, baseRsi: 55.4 },
  { symbol: "MA", name: "Mastercard Inc.", exchange: "NYSE", country: "US", currency: "USD", sector: "Payments Network", basePrice: 498.20, baseChangePct: 0.70, baseVolume: 2900000, baseRsi: 56.2 },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE", country: "US", currency: "USD", sector: "Consumer Staples & Retail", basePrice: 82.50, baseChangePct: 0.40, baseVolume: 16500000, baseRsi: 54.1 },
  { symbol: "PG", name: "Procter & Gamble Co.", exchange: "NYSE", country: "US", currency: "USD", sector: "Consumer Goods", basePrice: 172.00, baseChangePct: -0.15, baseVolume: 7200000, baseRsi: 49.8 },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", country: "US", currency: "USD", sector: "Healthcare & Pharmaceuticals", basePrice: 162.40, baseChangePct: 0.25, baseVolume: 8400000, baseRsi: 51.0 },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE", country: "US", currency: "USD", sector: "Media & Parks", basePrice: 96.20, baseChangePct: 0.80, baseVolume: 11200000, baseRsi: 53.6 },
  { symbol: "XOM", name: "Exxon Mobil Corporation", exchange: "NYSE", country: "US", currency: "USD", sector: "Energy & Oil", basePrice: 124.50, baseChangePct: 1.10, baseVolume: 14600000, baseRsi: 58.9 },
  { symbol: "CVX", name: "Chevron Corporation", exchange: "NYSE", country: "US", currency: "USD", sector: "Energy & Oil", basePrice: 152.80, baseChangePct: 0.85, baseVolume: 8900000, baseRsi: 56.3 },
  { symbol: "BRK-B", name: "Berkshire Hathaway Inc.", exchange: "NYSE", country: "US", currency: "USD", sector: "Holding & Insurance", basePrice: 462.00, baseChangePct: 0.30, baseVolume: 3400000, baseRsi: 52.8 },
  { symbol: "COIN", name: "Coinbase Global, Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Crypto Brokerage & Fintech", basePrice: 195.40, baseChangePct: 4.50, baseVolume: 14200000, baseRsi: 71.5 },
  { symbol: "UBER", name: "Uber Technologies, Inc.", exchange: "NYSE", country: "US", currency: "USD", sector: "Mobility & Platform", basePrice: 78.60, baseChangePct: 1.30, baseVolume: 18200000, baseRsi: 62.4 },
  { symbol: "PYPL", name: "PayPal Holdings, Inc.", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Digital Payments", basePrice: 79.20, baseChangePct: 0.90, baseVolume: 10500000, baseRsi: 57.3 },
  { symbol: "^GSPC", name: "S&P 500 Benchmark Index", exchange: "NYSE", country: "US", currency: "USD", sector: "Index Benchmark", basePrice: 5860.00, baseChangePct: 0.55, baseVolume: 3800000000, baseRsi: 61.2 },
  { symbol: "^IXIC", name: "NASDAQ Composite Index", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Index Tech Benchmark", basePrice: 18520.00, baseChangePct: 0.80, baseVolume: 4600000000, baseRsi: 63.8 },
  { symbol: "^DJI", name: "Dow Jones Industrial Average", exchange: "NYSE", country: "US", currency: "USD", sector: "Index Bluechip Benchmark", basePrice: 43250.00, baseChangePct: 0.35, baseVolume: 390000000, baseRsi: 56.4 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE", country: "US", currency: "USD", sector: "Index ETF", basePrice: 584.20, baseChangePct: 0.52, baseVolume: 58000000, baseRsi: 61.0 },
  { symbol: "QQQ", name: "Invesco QQQ Trust (NASDAQ 100)", exchange: "NASDAQ", country: "US", currency: "USD", sector: "Tech ETF", basePrice: 492.60, baseChangePct: 0.78, baseVolume: 42000000, baseRsi: 63.2 },
  { symbol: "BTC-USD", name: "Bitcoin USD (Crypto vs USA)", exchange: "CRYPTO", country: "US", currency: "USD", sector: "Digital Assets & Crypto", basePrice: 81750.00, baseChangePct: 1.85, baseVolume: 28500000000, baseRsi: 64.2 },
  { symbol: "ETH-USD", name: "Ethereum USD", exchange: "CRYPTO", country: "US", currency: "USD", sector: "Smart Contracts & Crypto", basePrice: 2640.00, baseChangePct: 1.40, baseVolume: 14800000000, baseRsi: 58.0 },
  { symbol: "SOL-USD", name: "Solana USD", exchange: "CRYPTO", country: "US", currency: "USD", sector: "Layer 1 Blockchain", basePrice: 178.50, baseChangePct: 3.10, baseVolume: 4200000000, baseRsi: 68.5 },
  { symbol: "GC=F", name: "Gold Futures COMEX (Gold vs USA)", exchange: "COMEX", country: "US", currency: "USD", sector: "Precious Metals", basePrice: 2740.00, baseChangePct: 0.65, baseVolume: 195000, baseRsi: 62.8 },
  { symbol: "SI=F", name: "Silver Futures COMEX", exchange: "COMEX", country: "US", currency: "USD", sector: "Precious Metals", basePrice: 32.80, baseChangePct: 1.15, baseVolume: 84000, baseRsi: 61.4 },
  { symbol: "CL=F", name: "Crude Oil WTI Futures", exchange: "NYMEX", country: "US", currency: "USD", sector: "Energy Commodity", basePrice: 71.40, baseChangePct: -1.95, baseVolume: 340000, baseRsi: 32.0 },
];

/**
 * POST /api/v1/screener
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filters, search, sort, page, limit } = screenerRequestSchema.parse(req.body);

    // 1. Initial Filtering by country, exchange, and direct search term on UNIVERSE
    let candidates = [...UNIVERSE];

    // Filter by search query (symbol, name, sector)
    const cleanSearch = (search || "").trim().toLowerCase();
    if (cleanSearch) {
      candidates = candidates.filter(
        (c) =>
          c.symbol.toLowerCase().includes(cleanSearch) ||
          c.name.toLowerCase().includes(cleanSearch) ||
          c.sector.toLowerCase().includes(cleanSearch) ||
          c.exchange.toLowerCase().includes(cleanSearch)
      );
    }

    // Filter by Country if specified in filters
    const countryFilter = filters.find((f) => f.field === "country");
    if (countryFilter) {
      const targetCountry = String(countryFilter.value).toUpperCase();
      if (targetCountry !== "ALL") {
        candidates = candidates.filter((c) => c.country === targetCountry);
      }
    }

    // Filter by Exchange if specified in filters
    const exchangeFilter = filters.find((f) => f.field === "exchange");
    if (exchangeFilter) {
      const targetExchange = String(exchangeFilter.value).toUpperCase();
      if (targetExchange !== "ALL") {
        candidates = candidates.filter((c) => c.exchange === targetExchange);
      }
    }

    // 2. Fetch or resolve metrics for each candidate (using cache + fast live fallback)
    const items = await Promise.all(
      candidates.map(async (stock) => {
        const cacheKey = `screener_item:${stock.symbol}`;
        const cached = cache.get<any>(cacheKey);
        if (cached) return cached;

        let liveClose = stock.basePrice;
        let liveChangePct = stock.baseChangePct;
        let liveVolume = stock.baseVolume;
        let liveRsi = stock.baseRsi;
        let source = "reference";

        try {
          const provider = providerRegistry.getProviderForSymbol(stock.symbol);
          // Fast quote query with 1500ms timeout
          const quote = await Promise.race([
            provider.getLatestQuote(stock.symbol),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 1500)
            ),
          ]);

          if (quote && quote.price > 0) {
            liveClose = quote.price;
            liveChangePct = quote.changePct ?? liveChangePct;
            liveVolume = quote.volume ?? liveVolume;
            source = provider.name;
          }
        } catch {
          // Graceful fallback to baseline realistic quote
        }

        const data = {
          symbol: stock.symbol,
          name: stock.name,
          exchange: stock.exchange,
          country: stock.country,
          currency: stock.currency,
          sector: stock.sector,
          close: liveClose,
          change_pct: liveChangePct,
          volume: liveVolume,
          rsi_14: liveRsi,
          data_quality: {
            source,
            as_of: new Date().toISOString(),
          },
        };

        cache.set(cacheKey, data, 300);
        return data;
      })
    );

    let results = items;

    // 3. Apply Remaining Numeric / Custom Filters (rsi_14, change_pct, close, etc.)
    for (const f of filters) {
      if (f.field === "country" || f.field === "exchange") continue;

      results = results.filter((item) => {
        const val = (item as any)[f.field];
        if (val === undefined || val === null) return false;

        if (f.operator === "contains") {
          return String(val).toLowerCase().includes(String(f.value).toLowerCase());
        }

        if (f.operator === "eq") {
          return String(val).toLowerCase() === String(f.value).toLowerCase();
        }

        const numVal = Number(val);
        const targetVal = Number(f.value);
        if (isNaN(numVal) || isNaN(targetVal)) return false;

        if (f.operator === "gt") return numVal > targetVal;
        if (f.operator === "lt") return numVal < targetVal;
        if (f.operator === "gte") return numVal >= targetVal;
        if (f.operator === "lte") return numVal <= targetVal;
        return true;
      });
    }

    // 4. Sort results
    if (sort) {
      const field = sort.field;
      const dir = sort.direction === "asc" ? 1 : -1;
      results.sort((a: any, b: any) => {
        if (a[field] < b[field]) return -1 * dir;
        if (a[field] > b[field]) return 1 * dir;
        return 0;
      });
    }

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    res.json({
      results: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    logger.error({ err }, "Screener execution error");
    next(err);
  }
});

export default router;
