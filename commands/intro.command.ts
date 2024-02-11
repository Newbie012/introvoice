import { Instant } from "@js-joda/core";
import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { AppContext } from "../utils/app-context.js";
import { IntroSlot, getUserObject, setUserObject, updateUserObject } from "../utils/firebase.js";

export async function handleIntroCommand(
  context: AppContext,
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const slot = interaction.options.getInteger("slot") ?? 1;

  await interaction.reply({
    content: `🔃 Setting intro to slot ${slot}...`,
    ephemeral: true,
  });

  const userId = interaction.user.id;
  const username = interaction.user.username;
  const attachment = interaction.options.getAttachment("attachment");
  const introStoragePath = `intros/${userId}/${slot}.mp3`;

  if (attachment?.contentType !== "audio/mpeg") {
    return interaction.editReply("❌ Please provide an mp3 file");
  }

  const attachmentBlob = await fetch(attachment.url).then((res) => res.blob());
  const attachmentBuffer = await attachmentBlob.arrayBuffer();
  const bufferSizeInKb = attachmentBuffer.byteLength / 1024;

  if (bufferSizeInKb > 1024) {
    return interaction.editReply("❌ File size must be less than 1MB");
  }

  await context.firebase.storage
    .bucket()
    .file(introStoragePath)
    .save(Buffer.from(attachmentBuffer), {
      contentType: "audio/mpeg",
      metadata: { userId, username },
    });

  await interaction.editReply("🔃 Intro file uploaded. Saving slot...");

  const userObject = await getUserObject(userId);

  if (userObject !== null) {
    await updateUserObject(userId, {
      slots: getUpdatedSlots(userObject.slots, slot, introStoragePath),
      updatedAt: Instant.now(),
    });
  } else {
    await setUserObject(userId, {
      username: username,
      slots: [introStoragePath, null, null],
      createdAt: Instant.now(),
    });
  }

  await interaction.editReply("✅ Intro set!");
}

function getUpdatedSlots(
  slots: [IntroSlot, IntroSlot, IntroSlot],
  slot: number,
  introStoragePath: string
) {
  const newSlots = slots.slice() as [IntroSlot, IntroSlot, IntroSlot];
  newSlots[slot - 1] = introStoragePath;
  return newSlots;
}
