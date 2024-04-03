import { generateDependencyReport } from "@discordjs/voice";
import * as Sentry from "@sentry/node";
import { ActivityType, OAuth2Scopes } from "discord.js";
import { handleIntroListCommands } from "./commands/intro-list.command.js";
import { handleIntroOffCommand } from "./commands/intro-off.command.js";
import { handleIntroOnCommand } from "./commands/intro-on.command.js";
import { handleIntroRemoveCommand } from "./commands/intro-remove.command.js";
import { handleIntroThrottleCommand } from "./commands/intro-throttle.command.js";
import { handleIntroCommand } from "./commands/intro.command.js";
import { config } from "./config.js";
import { handleVoiceStateUpdate } from "./event-handlers/voice-state-update.js";
import { appContext } from "./utils/app-context.js";
import { refreshApplicationCommands } from "./utils/refresh-application-commands.js";
import { initSentry } from "./utils/sentry.js";

initSentry(config.SENTRY_DSN);

await refreshApplicationCommands();

appContext.discord.on("ready", () => {
  appContext.discord.user?.setActivity("www.introvoice.chat", {
    type: ActivityType.Playing,
    url: "https://introvoice.chat/",
  });

  console.log(generateDependencyReport());
  console.log(`Logged in as ${appContext.discord.user?.tag}!`);
  console.log(
    "Invite link: ",
    appContext.discord.generateInvite({
      scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
      permissions: [
        "SendMessages",
        "Speak",
        "Connect",
        "UseVAD",
        "UseEmbeddedActivities",
        "AddReactions",
      ],
    })
  );
});

appContext.discord.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case "intro":
      await handleIntroCommand(appContext, interaction);
      break;
    case "intro-on":
      await handleIntroOnCommand(appContext, interaction);
      break;
    case "intro-off":
      await handleIntroOffCommand(appContext, interaction);
      break;
    case "intro-throttle":
      await handleIntroThrottleCommand(appContext, interaction);
      break;
    case "intro-list":
      await handleIntroListCommands(appContext, interaction);
      break;
    case "intro-remove":
      await handleIntroRemoveCommand(appContext, interaction);
      break;
  }
});

appContext.discord.on("voiceStateUpdate", async (prevState, nextState) => {
  await Sentry.startSpan({ name: "voiceStateUpdate" }, async () => {
    handleVoiceStateUpdate(prevState, nextState);
  });
});

appContext.discord.login(config.DISCORD_TOKEN);
