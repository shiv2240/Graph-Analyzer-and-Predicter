const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://stockintel:changeme_strong_password@localhost:5432/stockintel'
});

async function main() {
  await pool.query(`
    INSERT INTO exchanges (code, name, country, currency, timezone, open_time, close_time)
    VALUES 
      ('COMEX', 'Commodity Exchange Inc (NYMEX/COMEX)', 'US', 'USD', 'America/New_York', '18:00:00', '17:00:00'),
      ('CRYPTO', 'Global Cryptocurrency Markets', 'US', 'USD', 'UTC', '00:00:00', '23:59:59')
    ON CONFLICT (code) DO NOTHING;
  `);

  await pool.query(`
    INSERT INTO instruments (symbol, name, exchange_id, instrument_type, currency)
    VALUES
      ('GC=F', 'Gold Futures (COMEX / USA)', (SELECT id FROM exchanges WHERE code = 'COMEX'), 'COMMODITY', 'USD'),
      ('GLD', 'SPDR Gold Shares ETF (USA)', (SELECT id FROM exchanges WHERE code = 'NYSE'), 'ETF', 'USD'),
      ('SI=F', 'Silver Futures (COMEX / USA)', (SELECT id FROM exchanges WHERE code = 'COMEX'), 'COMMODITY', 'USD'),
      ('BTC-USD', 'Bitcoin / USD', (SELECT id FROM exchanges WHERE code = 'CRYPTO'), 'CRYPTO', 'USD')
    ON CONFLICT (symbol, exchange_id) DO NOTHING;
  `);

  const res = await pool.query('SELECT id, symbol, name FROM instruments ORDER BY id');
  console.log('Instruments now in DB:', res.rows);
  await pool.end();
}

main().catch(console.error);
