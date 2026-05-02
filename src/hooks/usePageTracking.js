import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (!analytics) return; // ✅ Prevent crash

    logEvent(analytics, "page_view", {
      page_path: location.pathname,
    });
  }, [location]);
};

export default usePageTracking;
