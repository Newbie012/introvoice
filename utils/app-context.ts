import { Client, GatewayIntentBits } from "discord.js";
import { config } from "../config.js";
import { ServiceAccount, initializeApp } from "./firebase.js";

export const appContext = {
  discord: new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
    ],
  }),
  firebase: await initializeApp(
    JSON.parse(Buffer.from(config.FIREBASE_CREDENTIAL, "base64").toString()) as ServiceAccount
  ),
};

export type AppContext = typeof appContext;
