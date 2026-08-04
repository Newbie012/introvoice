import { CacheType, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { AppContext } from "../utils/app-context.js";
import { getUserObject, removeUserObject } from "../utils/firebase.js";

export async function handleIntroRemoveCommand(
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

  await removeUserObject(interaction.user.id);

  const message = await interaction.reply({
    content: `👎👎👎👎 @everyone ${interaction.user.username} has removed his intro 👎👎👎👎`,
    embeds: [
      {
        title: "SHAME! SHAME! SHAME!",
        image: { url: "https://c.tenor.com/rwZNrZ2V2MoAAAAC/tenor.gif" },
      },
    ],
    fetchReply: true,
  });

  message.react("👎");
}
