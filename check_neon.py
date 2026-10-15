import os
import psycopg2

db_url = os.environ.get("DATABASE_URL", "postgresql://stockintel:changeme_strong_password@localhost:5432/stockintel")
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
tables = [r[0] for r in cur.fetchall()]
print(f"Total tables: {len(tables)}")
for t in sorted(tables):
    try:
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        count = cur.fetchone()[0]
        print(f"  {t}: {count} rows")
    except Exception as e:
        print(f"  {t}: error {e}")
conn.close()
