import { configDotenv } from "dotenv";
import { z } from "zod";

const zConfig = z.object({
  ENV: z.string(),
  DISCORD_TOKEN: z.string(),
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_GUILD_ID: z.string(),
  FIREBASE_CREDENTIAL: z.string(),
  SENTRY_DSN: z.string(),
});

export type Config = z.infer<typeof zConfig>;

configDotenv();

export const config = zConfig.parse({
  ENV: process.env.NODE_ENV || "development",
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
  FIREBASE_CREDENTIAL: process.env.FIREBASE_CREDENTIAL,
  SENTRY_DSN: process.env.SENTRY_DSN,
});
