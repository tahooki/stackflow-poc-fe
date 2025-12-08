import { useEffect } from "react";

/**
 * Pushes a guard entry to the browser history and reroutes pop events to the back bridge handler.
 * This keeps the page from actually navigating away when the user presses the browser back button.
 */
export const useHistoryBackBridge = () => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const pushGuardState = () => {
      window.history.pushState({ __backBridge: true }, "", window.location.href);
    };

    pushGuardState();

    const handlePopState = () => {
      pushGuardState();
      window.onBackKeyClick?.();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
};
