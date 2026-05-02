import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export const getCurrentUserLocation = async () => {
  try {
    // If running inside Android/iOS app
    if (Capacitor.isNativePlatform()) {
      const permission = await Geolocation.requestPermissions();

      if (
        permission.location === "granted" ||
        permission.coarseLocation === "granted"
      ) {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        return {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
      }
    }

    // If running on desktop/web browser
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
      );
    });
  } catch (error) {
    console.log("Location Error:", error);
    return null;
  }
};
