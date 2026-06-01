// src/utils/admob.js

import { AdMob } from "@capacitor-community/admob";

export const initializeAdMob = async () => {
  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [],
      initializeForTesting: true,
    });

    console.log("AdMob Initialized");
  } catch (err) {
    console.error(err);
  }
};
