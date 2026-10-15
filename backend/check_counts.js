require('dotenv').config({ path: __dirname + '/.env' });
require('dotenv').config({ path: __dirname + '/../.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://stockintel:changeme_strong_password@localhost:5432/stockintel'
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('--- NEON DATABASE TABLES & ROW COUNTS ---');
  for (const r of res.rows) {
    try {
      const c = await client.query(`SELECT count(*) FROM "${r.table_name}"`);
      console.log(`${r.table_name}: ${c.rows[0].count} rows`);
    } catch (e) {
      console.log(`${r.table_name}: error ${e.message}`);
    }
  }
  await client.end();
}

main().catch(console.error);
