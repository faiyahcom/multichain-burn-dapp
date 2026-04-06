import { useEffect, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { API_BASE_URL } from "@/config/constant";
import { API_ROUTES } from "@/services/apiRoutes";
import type { NotiItem } from "@/types/notification";

interface UseAdminNotificationStreamOptions {
  onNotification: (item: NotiItem) => void;
}

export function useAdminNotificationStream(
  accessToken: string | null,
  options: UseAdminNotificationStreamOptions,
) {
  const onNotificationRef = useRef(options.onNotification);
  onNotificationRef.current = options.onNotification;

  useEffect(() => {
    if (!accessToken) return;

    const controller = new AbortController();
    const url = `${API_BASE_URL}${API_ROUTES.ADMINS.NOTIFICATIONS.STREAM}`;

    void fetchEventSource(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "text/event-stream",
      },
      signal: controller.signal,
      onmessage(ev) {
        try {
          const item = JSON.parse(ev.data) as NotiItem;
          if(item == "ping" || item == "Connected") return;
          onNotificationRef.current(item);
        } catch {
          // ignore malformed messages
        }
      },
      onerror(err) {
        throw err; // rethrow to stop retrying on persistent errors
      },
    });

    return () => {
      controller.abort();
    };
  }, [accessToken]);
}
