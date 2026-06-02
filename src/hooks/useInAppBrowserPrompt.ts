import { useState, useEffect } from "react";
import { shouldShowInAppBrowserPrompt } from "@/utils/helpers/mobile-browser";

const SESSION_KEY = "inapp-browser-prompt-dismissed";

/**
 * Controls the visibility of the in-app browser redirect prompt.
 *
 * - Shows automatically when the user is on a mobile external browser.
 * - Once dismissed, stores a flag in sessionStorage so the prompt does not
 *   re-appear for the remainder of the browser session.
 */
export function useInAppBrowserPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      shouldShowInAppBrowserPrompt() &&
      !sessionStorage.getItem(SESSION_KEY)
    ) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  };

  return { open, dismiss };
}
