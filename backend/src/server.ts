import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";
import { closePool } from "./db/client";

const httpServer = createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.VITE_BACKEND_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "WebSocket client connected");

  socket.on("subscribe_quotes", (data: { symbols: string[] }) => {
    const { symbols } = data;
    if (!Array.isArray(symbols)) return;
    symbols.forEach((symbol) => socket.join(`quotes:${symbol}`));
    logger.info({ socketId: socket.id, symbols }, "Client subscribed to quotes");
  });

  socket.on("unsubscribe_quotes", (data: { symbols: string[] }) => {
    const { symbols } = data;
    if (!Array.isArray(symbols)) return;
    symbols.forEach((symbol) => socket.leave(`quotes:${symbol}`));
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "WebSocket client disconnected");
  });
});

// Heartbeat every 30 seconds
setInterval(() => {
  io.emit("heartbeat", { ts: new Date().toISOString() });
}, 30_000);

// ─── Start ────────────────────────────────────────────────────────────────
httpServer.listen(config.BACKEND_PORT, config.BACKEND_HOST, () => {
  logger.info(
    { port: config.BACKEND_PORT, host: config.BACKEND_HOST, env: config.NODE_ENV },
    "Stock Intelligence API server started"
  );
});

// ─── Graceful shutdown ────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Received shutdown signal");
  httpServer.close(async () => {
    logger.info("HTTP server closed");
    await closePool();
    logger.info("Database pool closed. Exiting.");
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
  process.exit(1);
});

export { io };
