import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "../config.js";
import { MAXIUM_THROTTLING, MINIMUM_THROTTLING } from "./const.js";

const commands = [
  new SlashCommandBuilder()
    .setName("intro")
    .setDescription("set your intro")
    .addAttachmentOption((option) =>
      option.setName("attachment").setDescription("mp3 file").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("slot").setDescription("between 1 and 3").setMinValue(1).setMaxValue(3)
    ),

  new SlashCommandBuilder().setName("intro-off").setDescription("turn off your intro"),

  new SlashCommandBuilder().setName("intro-on").setDescription("turn on your intro"),

  new SlashCommandBuilder()
    .setName("intro-throttle")
    .setDescription("set your intro throttle")
    .addIntegerOption((option) =>
      option
        .setName("throttling")
        .setDescription(`between ${MINIMUM_THROTTLING} and ${MAXIUM_THROTTLING}`)
    ),

  new SlashCommandBuilder().setName("intro-remove").setDescription("remove your intro"),
];

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

export async function refreshApplicationCommands() {
  console.log("Started refreshing application (/) commands.");
  await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), { body: commands });
  console.log("Successfully reloaded application (/) commands.");
}
