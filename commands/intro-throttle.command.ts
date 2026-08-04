import { CacheType, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { AppContext } from "../utils/app-context.js";
import { MAXIUM_THROTTLING, MINIMUM_THROTTLING } from "../utils/const.js";
import { getUserObject, updateUserObject } from "../utils/firebase.js";

export async function handleIntroThrottleCommand(
  _context: AppContext,
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const userObject = await getUserObject(interaction.user.id);

  if (userObject === null) {
    return interaction.reply({
      content: `❌ You don't have an intro to turn on. Set one up with \`/intro\``,
      flags: MessageFlags.Ephemeral,
    });
  }

  const throttling = interaction.options.getInteger("throttling");

  if (throttling === null) {
    return interaction.reply({
      content: `❌ Please provide a valid number for throttling`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (throttling < MINIMUM_THROTTLING || throttling > MAXIUM_THROTTLING) {
    return interaction.reply({
      content: `❌ Throttling must be between ${MINIMUM_THROTTLING} and ${MAXIUM_THROTTLING}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.reply({
    content: "🔃 Throttling your intro...",
    flags: MessageFlags.Ephemeral,
  });

  await updateUserObject(interaction.user.id, { throttling });

  await interaction.editReply(`✅ Your intro throttle has been changed to ${throttling} minutes.`);
}
