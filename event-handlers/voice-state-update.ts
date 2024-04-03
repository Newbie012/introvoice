import { Duration, Instant } from "@js-joda/core";
import * as Sentry from "@sentry/node";
import { VoiceState } from "discord.js";
import { appContext } from "../utils/app-context.js";
import { INTRO_MAX_DURATION } from "../utils/const.js";
import { IntroSlotValue, getUserObject, updateUserObject } from "../utils/firebase.js";
import { createAudioResourceFromUrl, playSound } from "../utils/sounds.utils.js";

export async function handleVoiceStateUpdate(prevState: VoiceState, nextState: VoiceState) {
  const userId = nextState.member?.user.id;
  const now = Instant.now();

  if (appContext.discord.voice.adapters.size === 1) {
    return;
  }

  Sentry.setTag("on", "voiceStateUpdate");
  Sentry.setTag("userId", nextState.member?.id);

  if (prevState.channel?.members.size === nextState.channel?.members.size) {
    return;
  }

  if (nextState.channel === null || userId === undefined) {
    // do nothing, someone has disconnected
    return;
  }

  const userObject = await getUserObject(userId);

  if (userObject === null || userObject.isDisabled) {
    return;
  }

  if (userObject.playedAt !== null) {
    const playableAgainAt = userObject.playedAt.plus(Duration.ofMinutes(userObject.throttling));
    const isThrottled = playableAgainAt.isAfter(now);

    if (isThrottled) {
      return;
    }
  }

  const introFile = randomValueInArray(
    userObject.slots.filter((x): x is IntroSlotValue => x !== null)
  );

  const introUrl = await appContext.firebase.storage
    .bucket()
    .file(introFile.path)
    .getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 })
    .then((x) => x[0]);

  console.log({
    userId,
    channelId: nextState.channelId,
    introFile: introFile,
    url: introUrl,
    throttling: userObject.throttling,
    playedAt: userObject.playedAt?.toString(),
  });

  const audioResource = createAudioResourceFromUrl(introUrl);

  const duration = (userObject.duration ?? INTRO_MAX_DURATION).toMillis();

  await Promise.all([
    playSound(nextState.channel, audioResource, duration),
    updateUserObject(userId, { playedAt: now, updatedAt: now }),
  ]);
}

function randomValueInArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
