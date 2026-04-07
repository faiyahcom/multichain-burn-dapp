import { useEffect, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { API_BASE_URL } from "@/config/constant";
import { API_ROUTES } from "@/services/apiRoutes";
import type { NotiItem } from "@/types/notification";

export interface NotificationStreamCallbacks {
    onNotification: (item: NotiItem) => void;
}

/**
 * Opens an authenticated SSE connection to /users/notifications-stream.
 * Uses @microsoft/fetch-event-source so the Authorization header can be sent.
 * Auto-reconnects on network errors with a 5 s back-off.
 */
export function useNotificationStream(
    accessToken: string | null,
    callbacks: NotificationStreamCallbacks,
) {
    const cbRef = useRef<NotificationStreamCallbacks>(callbacks);
    cbRef.current = callbacks;

    useEffect(() => {
        if (!accessToken) return;

        const url = `${API_BASE_URL}${API_ROUTES.NOTIFICATIONS.STREAM}`;
        const ctrl = new AbortController();
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        let destroyed = false;

        const connect = () => {
            if (destroyed) return;

            fetchEventSource(url, {
                signal: ctrl.signal,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "text/event-stream",
                },
                onopen: async (response) => {
                    if (!response.ok) {
                        // Non-retriable HTTP error — stop reconnecting.
                        throw new Error(`SSE open failed: ${response.status}`);
                    }
                },
                onmessage: (ev) => {
                    try {
                        const item = JSON.parse(ev.data) as NotiItem;
                        if (item == "ping" || item == "Connected") return;
                        console.log("Received notification via SSE:", item);
                        cbRef.current.onNotification(item);
                    } catch {
                        // Ignore malformed messages.
                    }
                },
                onclose: () => {
                    if (destroyed) return;
                    scheduleRetry();
                },
                onerror: (err) => {
                    if (destroyed) throw err; // stop fetch-event-source internal retry
                    scheduleRetry();
                    throw err; // prevent built-in retry; we handle it ourselves
                },
            }).catch(() => {
                /* swallow — error already handled in onerror */
            });
        };

        const scheduleRetry = () => {
            if (destroyed) return;
            if (retryTimer !== null) clearTimeout(retryTimer);
            retryTimer = setTimeout(connect, 5_000);
        };

        connect();

        return () => {
            destroyed = true;
            if (retryTimer !== null) clearTimeout(retryTimer);
            ctrl.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]); // reconnect if token changes
}
