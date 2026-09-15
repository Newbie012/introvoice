import { Instant } from "@js-joda/core";
import { CacheType, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { AppContext } from "../utils/app-context.js";
import {
  IntroSlot,
  IntroSlotValue,
  deleteIntroFiles,
  getUserObject,
  removeUserObject,
  updateUserObject,
} from "../utils/firebase.js";

export async function handleIntroRemoveCommand(
  _context: AppContext,
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const slot = interaction.options.getInteger("slot");
  const userObject = await getUserObject(interaction.user.id);

  if (userObject === null || userObject.slots.every((value) => value === null)) {
    return interaction.reply({
      content: `❌ You don't have an intro to remove. Set one up with \`/intro\``,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (slot !== null) {
    if (slot < 1 || slot > 3) {
      return interaction.reply({
        content: "❌ Slot must be between 1 and 3",
        flags: MessageFlags.Ephemeral,
      });
    }

    const removedSlot = userObject.slots[slot - 1];

    if (removedSlot === null || removedSlot === undefined) {
      return interaction.reply({
        content: `❌ Slot ${slot} is already empty`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const slots = userObject.slots.slice() as [IntroSlot, IntroSlot, IntroSlot];
    slots[slot - 1] = null;

    // Only shame when the last intro is gone; otherwise just clear the slot.
    if (slots.some((value) => value !== null)) {
      await updateUserObject(interaction.user.id, { slots, updatedAt: Instant.now() });
      await deleteIntroFiles([removedSlot.path]);

      return interaction.reply({
        content: `✅ Slot ${slot} removed.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  await removeUserObject(interaction.user.id);
  await deleteIntroFiles(
    userObject.slots.filter((value): value is IntroSlotValue => value !== null).map((x) => x.path)
  );

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
