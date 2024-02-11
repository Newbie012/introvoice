import fs from "fs";

const config = {
  ENV: process.env.NODE_ENV || "development",
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
  FIREBASE_CREDENTIAL: process.env.FIREBASE_CREDENTIAL,
  SENTRY_DSN: process.env.SENTRY_DSN,
};

fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
