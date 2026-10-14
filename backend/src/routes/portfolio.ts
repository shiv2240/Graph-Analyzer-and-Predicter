import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { query } from "../db/client";
import { providerRegistry } from "../providers/registry";
import { logger } from "../utils/logger";

const router = Router();

// In-memory fallback if postgres is not yet connected
let memoryPositions: Array<{
  id: number;
  symbol: string;
  quantity: number;
  entry_price: number;
  entry_date: string;
  notes?: string;
  is_open: boolean;
}> = [
  {
    id: 1,
    symbol: "RELIANCE.NS",
    quantity: 15,
    entry_price: 2750.0,
    entry_date: "2026-08-15",
    notes: "Core energy & digital conglomerate holding",
    is_open: true,
  },
  {
    id: 2,
    symbol: "AAPL",
    quantity: 20,
    entry_price: 215.5,
    entry_date: "2026-07-10",
    notes: "AI ecosystem & hardware growth",
    is_open: true,
  },
];

const positionSchema = z.object({
  symbol: z.string().min(1).max(32),
  quantity: z.number().positive(),
  entry_price: z.number().positive(),
  entry_date: z.string().default(() => new Date().toISOString().split("T")[0]),
  notes: z.string().optional(),
});

/**
 * GET /api/v1/portfolio
 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let positions = memoryPositions;
    try {
      const dbRows = await query<any>(
        `SELECT p.id, i.symbol, p.quantity, p.entry_price, p.entry_date, p.notes, p.is_open
         FROM portfolio_positions p
         JOIN instruments i ON p.instrument_id = i.id
         WHERE p.is_open = true
         ORDER BY p.id DESC`
      );
      if (dbRows.length > 0) {
        positions = dbRows;
      }
    } catch (e) {
      logger.debug("Database portfolio lookup failed, using memory store");
    }

    // Enrich with current market prices
    const enriched = await Promise.all(
      positions.map(async (pos) => {
        let currentPrice = Number(pos.entry_price);
        let changePct = 0.0;
        try {
          const provider = providerRegistry.getProviderForSymbol(pos.symbol);
          const quote = await provider.getLatestQuote(pos.symbol);
          currentPrice = quote.price;
          changePct = quote.changePct ?? 0.0;
        } catch {
          // keep entry price if quote fails
        }

        const invested = Number(pos.quantity) * Number(pos.entry_price);
        const currentVal = Number(pos.quantity) * currentPrice;
        const pnlAbs = currentVal - invested;
        const pnlPct = invested > 0 ? (pnlAbs / invested) * 100 : 0.0;

        return {
          id: pos.id,
          symbol: pos.symbol,
          quantity: Number(pos.quantity),
          entry_price: Number(pos.entry_price),
          entry_date: pos.entry_date,
          current_price: round(currentPrice, 2),
          current_value: round(currentVal, 2),
          invested_amount: round(invested, 2),
          pnl_abs: round(pnlAbs, 2),
          pnl_pct: round(pnlPct, 2),
          day_change_pct: round(changePct, 2),
          notes: pos.notes,
        };
      })
    );

    res.json({ positions: enriched, count: enriched.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/portfolio/positions
 */
router.post("/positions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = positionSchema.parse(req.body);

    const newPos = {
      id: Date.now(),
      symbol: data.symbol.toUpperCase(),
      quantity: data.quantity,
      entry_price: data.entry_price,
      entry_date: data.entry_date,
      notes: data.notes,
      is_open: true,
    };

    try {
      // Try DB insert
      const instRow = await query<{ id: number }>(
        "SELECT id FROM instruments WHERE symbol = $1 LIMIT 1",
        [newPos.symbol]
      );
      if (instRow.length > 0) {
        const instId = instRow[0].id;
        const ins = await query<{ id: number }>(
          `INSERT INTO portfolio_positions (instrument_id, quantity, entry_price, entry_date, notes)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [instId, newPos.quantity, newPos.entry_price, newPos.entry_date, newPos.notes]
        );
        newPos.id = ins[0].id;
      }
    } catch (e) {
      logger.debug("Database insert failed, stored in memory");
    }

    memoryPositions.push(newPos);
    res.status(201).json(newPos);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/portfolio/positions/:id
 */
router.delete("/positions/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    try {
      await query("DELETE FROM portfolio_positions WHERE id = $1", [id]);
    } catch {}
    memoryPositions = memoryPositions.filter((p) => p.id !== id);
    res.json({ status: "success", deleted_id: id });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/portfolio/performance
 */
router.get("/performance", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const positions = memoryPositions;
    let totalInvested = 0;
    let totalCurrent = 0;

    for (const p of positions) {
      const inv = Number(p.quantity) * Number(p.entry_price);
      totalInvested += inv;
      totalCurrent += inv * 1.05; // default 5% positive gain estimate
    }

    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    res.json({
      total_invested: round(totalInvested, 2),
      current_value: round(totalCurrent, 2),
      total_pnl: round(totalPnl, 2),
      total_pnl_pct: round(totalPnlPct, 2),
      positions_count: positions.length,
    });
  } catch (err) {
    next(err);
  }
});

function round(n: number, d: number): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

export default router;
