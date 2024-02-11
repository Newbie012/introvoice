import * as Sentry from "@sentry/node";
import { config } from "../config.js";

export function initSentry(sentryDsn: string) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 1.0,
    environment: config.ENV,
    enabled: config.ENV === "production",
  });
}

export function captureException(e: unknown) {
  switch (config.ENV) {
    case "development":
      console.error(e);
      break;
    case "production":
      Sentry.captureException(e);
      break;
    default:
      throw new Error(`config.env is not set`);
  }
}
