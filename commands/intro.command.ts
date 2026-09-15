import { Instant } from "@js-joda/core";
import { Attachment, CacheType, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { AppContext } from "../utils/app-context.js";
import {
  IntroSlot,
  IntroSlotValue,
  deleteIntroFiles,
  getUserObject,
  setUserObject,
  updateUserObject,
} from "../utils/firebase.js";

export async function handleIntroCommand(
  context: AppContext,
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const slot = interaction.options.getInteger("slot") ?? 1;
  const attachment = interaction.options.getAttachment("attachment");

  // Validate slot number
  if (slot < 1 || slot > 3) {
    await interaction.reply({
      content: "❌ Slot must be between 1 and 3",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    content: `🔃 Setting intro to slot ${slot}...`,
    flags: MessageFlags.Ephemeral,
  });

  const userId = interaction.user.id;
  const username = interaction.user.username;

  // Validate attachment
  if (!attachment) {
    console.log(`[intro] ${username} rejected: no attachment`);
    await interaction.editReply("❌ Please provide an audio file");
    return;
  }

  const format = getAudioFormat(attachment);

  if (format === null) {
    console.log(
      `[intro] ${username} rejected: unsupported format (${attachment.name}, ${attachment.contentType})`
    );
    await interaction.editReply("❌ Please provide an mp3 or ogg file");
    return;
  }

  const introStoragePath = `intros/${userId}/${slot}.${format.extension}`;

  const attachmentBlob = await fetch(attachment.url).then((res) => res.blob());
  const attachmentBuffer = await attachmentBlob.arrayBuffer();
  const bufferSizeInKb = attachmentBuffer.byteLength / 1024;

  if (bufferSizeInKb > 1024) {
    console.log(`[intro] ${username} rejected: ${Math.round(bufferSizeInKb)}KB exceeds 1MB`);
    return interaction.editReply("❌ File size must be less than 1MB");
  }

  await context.firebase.storage
    .bucket()
    .file(introStoragePath)
    .save(Buffer.from(attachmentBuffer), {
      contentType: format.contentType,
      metadata: { userId, username },
    });

  console.log(
    `[intro] ${username} uploaded ${attachment.name} (${Math.round(bufferSizeInKb)}KB) to ${introStoragePath}`
  );

  await interaction.editReply("🔃 Intro file uploaded. Saving slot...");

  const userObject = await getUserObject(userId);
  const previousSlot = userObject?.slots[slot - 1] ?? null;

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

  console.log(`[intro] ${username} set slot ${slot} to ${attachment.name}`);

  // A different format means a different path, so the old file is no longer referenced.
  if (previousSlot !== null && previousSlot.path !== introStoragePath) {
    await deleteIntroFiles([previousSlot.path]);
  }

  await interaction.editReply("✅ Intro set!");
}

interface AudioFormat {
  extension: string;
  contentType: string;
}

/** Discord's reported contentType is unreliable for ogg, so the file name is checked too. */
function getAudioFormat(attachment: Attachment): AudioFormat | null {
  const name = attachment.name.toLowerCase();
  const contentType = attachment.contentType?.split(";")[0]?.trim() ?? "";

  if (name.endsWith(".mp3") || contentType === "audio/mpeg" || contentType === "audio/mp3") {
    return { extension: "mp3", contentType: "audio/mpeg" };
  }

  if (
    name.endsWith(".ogg") ||
    name.endsWith(".oga") ||
    contentType === "audio/ogg" ||
    contentType === "application/ogg"
  ) {
    return { extension: "ogg", contentType: "audio/ogg" };
  }

  return null;
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
