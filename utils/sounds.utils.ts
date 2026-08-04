import {
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { StageChannel, VoiceChannel } from "discord.js";

/** Extra time allowed past `maxDuration` before playback is abandoned outright. */
const PLAYBACK_GRACE_PERIOD = 2_000;

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

  connection.on("stateChange", (oldState, newState) => {
    console.log(`[voice] state: ${oldState.status} -> ${newState.status}`);
  });
  connection.on("error", (error) => {
    console.error("[voice] connection error:", error);
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

/**
 * Tears down the ffmpeg pipeline behind an audio resource.
 *
 * @discordjs/voice only destroys `playStream` from the audio player's state setter, so a resource
 * that never reached a player — e.g. when joining the channel times out — leaks its ffmpeg child
 * process for the lifetime of the bot.
 */
export function destroyAudioResource(audioResource: AudioResource) {
  const { playStream } = audioResource;

  if (playStream.destroyed) {
    return;
  }

  // Destroying mid-stream surfaces as an 'error' event, which would be unhandled and crash us.
  playStream.on("error", () => {});
  playStream.destroy();
}

export async function playSound(
  channel: VoiceChannel | StageChannel,
  audioResource: AudioResource,
  maxDuration: number,
) {
  let connection: VoiceConnection | undefined;

  try {
    connection = await connectToChannel(channel);
    await entersState(connection, VoiceConnectionStatus.Ready, 5e3);

    const audioPlayer = createAudioPlayer();
    audioPlayer.on("error", (error) => console.error("[voice] player error:", error));

    // Attached before play() so we can't miss the transition back to idle.
    const finished = new Promise<void>((resolve) => {
      audioPlayer.on("stateChange", (_, newState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
          resolve();
        }
      });
    });

    const subscription = connection.subscribe(audioPlayer);
    audioPlayer.play(audioResource);

    const stopTimeout = setTimeout(() => audioPlayer.stop(true), maxDuration);
    let abandonTimeout: NodeJS.Timeout | undefined;

    try {
      // Hard cap: a player that never reaches idle must not pin the connection open forever.
      await Promise.race([
        finished,
        new Promise<void>((resolve) => {
          abandonTimeout = setTimeout(resolve, maxDuration + PLAYBACK_GRACE_PERIOD);
        }),
      ]);
    } finally {
      clearTimeout(stopTimeout);
      clearTimeout(abandonTimeout);
      subscription?.unsubscribe();
    }
  } finally {
    if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
      connection.destroy();
    }

    destroyAudioResource(audioResource);
  }
}
