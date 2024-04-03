import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { AppContext } from "../utils/app-context.js";
import { getUserObject } from "../utils/firebase.js";

export async function handleIntroListCommands(
  _context: AppContext,
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const userObject = await getUserObject(interaction.user.id);

  if (userObject === null) {
    return interaction.reply({
      content: `You currently don't have any slots`,
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: [
      `You currently have the following slots:`,
      userObject.slots
        .map((slot, index) => {
          const bullet = getBullet(index);
          const slotName = slot === null ? "Empty" : slot.name.replaceAll("_", " ");

          return `${bullet} ${slotName}`;
        })
        .join("\n"),
    ].join("\n"),
    ephemeral: true,
  });
}

function getBullet(index: number) {
  switch (index) {
    case 0:
      return "1️⃣";
    case 1:
      return "2️⃣";
    case 2:
      return "3️⃣";
    default:
      return String(index);
  }
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== undefined;
}
