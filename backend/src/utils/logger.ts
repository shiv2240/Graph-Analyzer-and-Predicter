import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: [
      "*.api_key",
      "*.token",
      "*.secret",
      "*.password",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  ...(config.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});
