import { Duration, Instant } from "@js-joda/core";
import admin from "firebase-admin";
import { Jsonify } from "type-fest";
import { appContext } from "./app-context.js";
import { MINIMUM_THROTTLING } from "./const.js";

export async function initializeApp(credential: ServiceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: credential.client_email,
      privateKey: credential.private_key,
      projectId: credential.project_id,
    }),
    databaseURL: "https://introvoice-v2.europe-west1.firebasedatabase.app",
    storageBucket: "introvoice-a10ef.appspot.com",
  });

  const db = admin.database();
  const storage = admin.storage();

  return { db, storage };
}

export interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface IntroSlotValue {
  path: string;
  name: string;
  createdAt: Instant;
}

export type IntroSlot = IntroSlotValue | null;

interface UserObject {
  username: string;
  slots: [IntroSlot, IntroSlot, IntroSlot];
  duration?: Duration;
  throttling?: number;
  isDisabled?: boolean;
  updatedAt?: Instant;
  playedAt?: Instant;
  createdAt: Instant;
}

interface SetUserObject {
  username: string;
  slots: [IntroSlot, IntroSlot, IntroSlot];
  duration?: Duration;
  throttling?: number;
  isDisabled?: boolean;
  updatedAt?: Instant;
  playedAt?: Instant;
  createdAt: Instant;
}

export async function updateUserObject(userId: string, data: Partial<SetUserObject>) {
  const jsonified = jsonify(data);

  await appContext.firebase.db.ref(`users/${userId}`).update(
    omitUndefinedProperties({
      username: jsonified.username,
      slots: jsonified.slots,
      duration: jsonified.duration,
      throttling: jsonified.throttling,
      isDisabled: jsonified.isDisabled,
      updatedAt: jsonified.updatedAt,
      playedAt: jsonified.playedAt,
      createdAt: jsonified.createdAt,
    })
  );
}

export async function setUserObject(userId: string, data: SetUserObject) {
  const jsonified = jsonify(data);

  await appContext.firebase.db.ref(`users/${userId}`).set(
    omitUndefinedProperties({
      username: jsonified.username,
      slots: jsonified.slots,
      duration: jsonified.duration,
      throttling: jsonified.throttling,
      isDisabled: jsonified.isDisabled,
      updatedAt: jsonified.updatedAt,
      playedAt: jsonified.playedAt,
      createdAt: jsonified.createdAt,
    })
  );
}

export async function removeUserObject(userId: string) {
  await appContext.firebase.db.ref(`users/${userId}`).remove();
}

export async function getUserObject(userId: string) {
  const userObject = await appContext.firebase.db.ref(`users/${userId}`).get();

  if (!userObject.exists()) {
    return null;
  }

  const object = userObject.val() as Jsonify<UserObject>;

  return {
    username: object.username,
    slots: parseSlots(object.slots),
    throttling: object.throttling ?? MINIMUM_THROTTLING,
    duration: fmap(object.duration, Duration.parse),
    isDisabled: object.isDisabled ?? false,
    updatedAt: fmap(object.updatedAt, Instant.parse),
    playedAt: fmap(object.playedAt, Instant.parse),
    createdAt: Instant.parse(object.createdAt),
  };
}

function parseSlots(
  slots: Jsonify<[IntroSlot, IntroSlot, IntroSlot]>
): [IntroSlot, IntroSlot, IntroSlot] {
  return slots.map((slot) => (slot === null ? null : parseSlot(slot))) as [
    IntroSlot,
    IntroSlot,
    IntroSlot
  ];
}

function parseSlot(slot: Jsonify<IntroSlotValue>): IntroSlotValue {
  return {
    path: slot.path,
    name: slot.name,
    createdAt: Instant.parse(slot.createdAt),
  };
}

function omitUndefinedProperties<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}

function fmap<T, U>(value: T | null | undefined, fn: (value: T) => U): U | null {
  return value === null || value === undefined ? null : fn(value);
}

function jsonify<T>(value: T): Jsonify<T> {
  return JSON.parse(JSON.stringify(value)) as Jsonify<T>;
}
