import { CacheType, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { AppContext } from "../utils/app-context.js";
import { getUserObject, updateUserObject } from "../utils/firebase.js";

export async function handleIntroOnCommand(
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

  await interaction.reply({
    content: `🔃 Turning your intro back on...`,
    flags: MessageFlags.Ephemeral,
  });

  await updateUserObject(interaction.user.id, { isDisabled: false });

  await interaction.editReply("✅ Your intro is back on! 🚀");
}
