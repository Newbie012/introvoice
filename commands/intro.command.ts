import { Instant } from "@js-joda/core";
import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { AppContext } from "../utils/app-context.js";
import {
  IntroSlot,
  IntroSlotValue,
  getUserObject,
  setUserObject,
  updateUserObject,
} from "../utils/firebase.js";

export async function handleIntroCommand(
  context: AppContext,
  interaction: ChatInputCommandInteraction<CacheType>
): Promise<void> {
  const slot = interaction.options.getInteger("slot") ?? 1;
  const attachment = interaction.options.getAttachment("attachment");

  // Validate slot number
  if (slot < 1 || slot > 3) {
    await interaction.reply({
      content: "❌ Slot must be between 1 and 3",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: `🔃 Setting intro to slot ${slot}...`,
    ephemeral: true,
  });

  const userId = interaction.user.id;
  const username = interaction.user.username;
  const introStoragePath = `intros/${userId}/${slot}.mp3`;

  // Validate attachment
  if (!attachment) {
    await interaction.editReply("❌ Please provide an audio file");
    return;
  }

  if (attachment.contentType !== "audio/mpeg") {
    await interaction.editReply("❌ Please provide an mp3 file");
    return;
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

  const slotValue: IntroSlotValue = {
    path: introStoragePath,
    name: attachment.name,
    createdAt: Instant.now(),
  };

  if (userObject !== null) {
    await updateUserObject(userId, {
      slots: getUpdatedSlots(userObject.slots, slot, slotValue),
      updatedAt: Instant.now(),
    });
  } else {
    await setUserObject(userId, {
      username: username,
      slots: [slotValue, null, null],
      createdAt: Instant.now(),
    });
  }

  await interaction.editReply("✅ Intro set!");
}

function getUpdatedSlots(
  slots: [IntroSlot, IntroSlot, IntroSlot],
  slotNumber: number,
  value: IntroSlotValue
) {
  const newSlots = slots.slice() as [IntroSlot, IntroSlot, IntroSlot];
  newSlots[slotNumber - 1] = value;
  return newSlots;
}
