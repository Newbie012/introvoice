/**
 * Previously, the slots were stored as strings.
 * This script migrates them to objects ({ path, name, createdAt }).
 */

import { Instant } from "@js-joda/core";
import { appContext } from "../utils/app-context.js";
import { IntroSlot } from "../utils/firebase.js";

appContext.firebase.db.ref("users").once("value", (snapshot) => {
  snapshot.forEach((userSnapshot) => {
    const userObject = userSnapshot.val();
    if (!userObject) return;

    const slots = userObject.slots as [IntroSlot, IntroSlot, IntroSlot] | undefined;

    if (!slots) return;

    const updatedSlots = slots.map((slot) => {
      if (typeof slot === "string") {
        return slot === ""
          ? null
          : { path: slot, name: "Unknown", createdAt: Instant.now().toString() };
      } else {
        return slot;
      }
    });

    appContext.firebase.db.ref(`users/${userSnapshot.key}/slots`).set(updatedSlots);
  });
});
