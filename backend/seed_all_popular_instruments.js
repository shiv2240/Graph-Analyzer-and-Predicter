require('dotenv').config({ path: __dirname + '/.env' });
require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://stockintel:changeme_strong_password@localhost:5432/stockintel'
});

const ALL_INSTRUMENTS = [
  // 🇮🇳 Indian Equities & Indices (NSE / BSE)
  { symbol: "RELIANCE.NS", name: "Reliance Industries Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "INFY.NS", name: "Infosys Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "ITC.NS", name: "ITC Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "SBIN.NS", name: "State Bank of India", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "LT.NS", name: "Larsen & Toubro Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Limited", exchange: "NSE", type: "EQUITY", currency: "INR" },
  { symbol: "GOLDBEES.NS", name: "Nippon India ETF Gold BeES", exchange: "NSE", type: "COMMODITY_ETF", currency: "INR" },
  { symbol: "SILVERBEES.NS", name: "Nippon India ETF Silver BeES", exchange: "NSE", type: "COMMODITY_ETF", currency: "INR" },
  { symbol: "^NSEI", name: "NIFTY 50 Index", exchange: "NSE", type: "INDEX", currency: "INR" },
  { symbol: "^NSEBANK", name: "NIFTY Bank Index", exchange: "NSE", type: "INDEX", currency: "INR" },
  { symbol: "^BSESN", name: "S&P BSE SENSEX", exchange: "BSE", type: "INDEX", currency: "INR" },

  // 🪙 Commodities & Precious Metals (COMEX / NYMEX / NYSE)
  { symbol: "GC=F", name: "Gold Futures (COMEX / USA)", exchange: "COMEX", type: "COMMODITY", currency: "USD" },
  { symbol: "GLD", name: "SPDR Gold Shares ETF (USA)", exchange: "NYSE", type: "COMMODITY_ETF", currency: "USD" },
  { symbol: "IAU", name: "iShares Gold Trust", exchange: "NYSE", type: "COMMODITY_ETF", currency: "USD" },
  { symbol: "GOLD", name: "Barrick Gold Corporation", exchange: "NYSE", type: "EQUITY", currency: "USD" },
  { symbol: "SI=F", name: "Silver Futures (COMEX / USA)", exchange: "COMEX", type: "COMMODITY", currency: "USD" },
  { symbol: "SLV", name: "iShares Silver Trust ETF", exchange: "NYSE", type: "COMMODITY_ETF", currency: "USD" },
  { symbol: "CL=F", name: "Crude Oil WTI Futures (NYMEX)", exchange: "COMEX", type: "COMMODITY", currency: "USD" },
  { symbol: "BZ=F", name: "Brent Crude Oil Futures (ICE)", exchange: "COMEX", type: "COMMODITY", currency: "USD" },
  { symbol: "NG=F", name: "Natural Gas Futures", exchange: "COMEX", type: "COMMODITY", currency: "USD" },

  // 🇺🇸 US & Global Bluechip Equities (NASDAQ / NYSE)
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "EQUITY", currency: "USD" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "EQUITY", currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "EQUITY", currency: "USD" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", type: "EQUITY", currency: "USD" },
  { symbol: "GOOGL", name: "Alphabet Inc. (Google)", exchange: "NASDAQ", type: "EQUITY", currency: "USD" },
  { symbol: "META", name: "Meta Platforms Inc. (Facebook)", exchange: "NASDAQ", type: "EQUITY", currency: "USD" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", type: "EQUITY", currency: "USD" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "NASDAQ", type: "EQUITY", currency: "USD" },
  { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", type: "EQUITY", currency: "USD" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", exchange: "NYSE", type: "EQUITY", currency: "USD" },
  { symbol: "BRK-B", name: "Berkshire Hathaway Inc.", exchange: "NYSE", type: "EQUITY", currency: "USD" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", type: "EQUITY", currency: "USD" },

  // 📈 Benchmark Indices & Index ETFs
  { symbol: "^GSPC", name: "S&P 500 Index (USA)", exchange: "NYSE", type: "INDEX", currency: "USD" },
  { symbol: "^IXIC", name: "NASDAQ Composite Index", exchange: "NASDAQ", type: "INDEX", currency: "USD" },
  { symbol: "^DJI", name: "Dow Jones Industrial Average", exchange: "NYSE", type: "INDEX", currency: "USD" },
  { symbol: "^VIX", name: "CBOE Volatility Index", exchange: "NYSE", type: "INDEX", currency: "USD" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE", type: "INDEX_ETF", currency: "USD" },
  { symbol: "QQQ", name: "Invesco QQQ Trust (NASDAQ 100)", exchange: "NASDAQ", type: "INDEX_ETF", currency: "USD" },

  // ⚡ Cryptocurrencies & Forex Pairs
  { symbol: "BTC-USD", name: "Bitcoin USD (Bit vs USA)", exchange: "CRYPTO", type: "CRYPTOCURRENCY", currency: "USD" },
  { symbol: "ETH-USD", name: "Ethereum USD", exchange: "CRYPTO", type: "CRYPTOCURRENCY", currency: "USD" },
  { symbol: "SOL-USD", name: "Solana USD", exchange: "CRYPTO", type: "CRYPTOCURRENCY", currency: "USD" },
  { symbol: "EURUSD=X", name: "EUR / USD Forex", exchange: "CRYPTO", type: "FOREX", currency: "USD" },
  { symbol: "USDINR=X", name: "USD / INR Forex", exchange: "CRYPTO", type: "FOREX", currency: "INR" },
];

async function seed() {
  console.log(`Starting to seed ${ALL_INSTRUMENTS.length} popular instruments into Neon DB...`);

  // Ensure exchanges exist
  await pool.query(`
    INSERT INTO exchanges (code, name, country, currency, timezone, open_time, close_time)
    VALUES 
      ('NSE', 'National Stock Exchange of India', 'IN', 'INR', 'Asia/Kolkata', '09:15:00', '15:30:00'),
      ('BSE', 'Bombay Stock Exchange', 'IN', 'INR', 'Asia/Kolkata', '09:15:00', '15:30:00'),
      ('NYSE', 'New York Stock Exchange', 'US', 'USD', 'America/New_York', '09:30:00', '16:00:00'),
      ('NASDAQ', 'NASDAQ Stock Market', 'US', 'USD', 'America/New_York', '09:30:00', '16:00:00'),
      ('COMEX', 'Commodity Exchange Inc (NYMEX/COMEX)', 'US', 'USD', 'America/New_York', '18:00:00', '17:00:00'),
      ('CRYPTO', 'Global Cryptocurrency Markets', 'US', 'USD', 'UTC', '00:00:00', '23:59:59')
    ON CONFLICT (code) DO NOTHING;
  `);

  let inserted = 0;
  for (const item of ALL_INSTRUMENTS) {
    const res = await pool.query(`
      INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency, is_active)
      VALUES (
        $1,
        $2,
        (SELECT id FROM exchanges WHERE code = $3),
        $4,
        $5,
        true
      )
      ON CONFLICT (symbol, exchange_id) DO UPDATE SET
        name = EXCLUDED.name,
        instrument_type = EXCLUDED.instrument_type,
        currency = EXCLUDED.currency,
        is_active = true
      RETURNING id, symbol;
    `, [item.symbol, item.name, item.exchange, item.type, item.currency]);

    if (res.rows.length) inserted++;
  }

  const countRes = await pool.query('SELECT count(*) as count FROM instruments WHERE is_active = true');
  console.log(`Successfully synced instruments! Total active in Neon DB: ${countRes.rows[0].count}`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
