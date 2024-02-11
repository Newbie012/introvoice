import {
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  StreamType,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { StageChannel, VoiceChannel } from "discord.js";

export function delay(duration: number) {
  return new Promise((resolve) => setTimeout(() => resolve(null), duration));
}

export async function connectToChannel(channel: VoiceChannel | StageChannel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
    debug: true,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
    return connection;
  } catch (error) {
    connection.destroy();
    throw error;
  }
}

export function createAudioResourceFromUrl(url: string) {
  const resource = createAudioResource(url, {
    inlineVolume: true,
    inputType: StreamType.Arbitrary,
  });

  resource.volume?.setVolume(0.5);

  return resource;
}

export async function playSound(
  channel: VoiceChannel | StageChannel,
  audioResource: AudioResource,
  maxDuration: number,
) {
  const connection = await connectToChannel(channel);
  const audioPlayer = createAudioPlayer();
  await entersState(connection, VoiceConnectionStatus.Ready, 5e3);
  const subscription = connection.subscribe(audioPlayer);

  audioPlayer.on("error", console.error);

  audioPlayer.play(audioResource);

  return new Promise((resolve) => {
    const fallbackTimeout = setTimeout(() => audioPlayer.stop(true), maxDuration);

    audioPlayer.on("stateChange", (_, newState) => {
      if (newState.status === "idle") {
        if (subscription) {
          connection.destroy();
          subscription.unsubscribe();
        }

        clearTimeout(fallbackTimeout);
        return resolve(null);
      }
    });
  });
}
