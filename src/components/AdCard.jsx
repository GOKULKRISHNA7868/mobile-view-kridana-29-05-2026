// components/AdCard.jsx

import React, { useEffect } from "react";
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
} from "@capacitor-community/admob";

export default function AdCard() {
  useEffect(() => {
    const loadBanner = async () => {
      try {
        await AdMob.showBanner({
          adId: "ca-app-pub-3940256099942544/6300978111",
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          isTesting: true,
        });
      } catch (e) {
        console.log(e);
      }
    };

    loadBanner();

    return () => {
      AdMob.hideBanner().catch(() => {});
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-4 py-2 border-b bg-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase">Sponsored</p>
      </div>

      <div className="h-[80px]" />
    </div>
  );
}
