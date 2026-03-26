import { useEffect, useRef } from "react";
import { API_BASE_URL } from "@/config/constant";
import { API_ROUTES } from "@/services/apiRoutes";
import type { ActivityItem } from "@/services/dashboardService";

// ─── SSE payload shapes ───────────────────────────────────────────────────────

/** burn_activity / swap_activity events carry a camelCase-enriched ActivityItem. */
interface ActivityPayload {
    event: "burn_activity" | "swap_activity";
    activity: ActivityItem;
}

/**
 * transaction events carry an ActivityItem-shaped object directly.
 * Numeric fields (id, timestamp, chainId, amountIn, amountOut) are coerced
 * to string to match the ActivityItem interface.
 */
interface TransactionPayload {
    event: "transaction";
    txn: Omit<ActivityItem, "id" | "timestamp" | "chainId" | "amountIn" | "amountOut"> & {
        id: number;
        timestamp: number;
        chainId: number;
        amountIn: number;
        amountOut: number;
    };
}

function normalizeTransaction(txn: TransactionPayload["txn"]): ActivityItem {
    return {
        ...txn,
        id: String(txn.id),
        timestamp: String(txn.timestamp),
        chainId: String(txn.chainId),
        amountIn: String(txn.amountIn),
        amountOut: String(txn.amountOut),
    };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface ActivityStreamCallbacks {
    /** Called for `burn_activity` events. */
    onBurnActivity?: (item: ActivityItem) => void;
    /** Called for `swap_activity` events. */
    onSwapActivity?: (item: ActivityItem) => void;
    /** Called for `transaction` events. */
    onTransaction?: (item: ActivityItem) => void;
}

/**
 * Opens a single SSE connection to /general/activity-stream and routes
 * incoming payloads to the appropriate callbacks.
 *
 * Server event shapes:
 *   burn_activity  → { event: "burn_activity",  activity: ActivityItem }
 *   swap_activity  → { event: "swap_activity",  activity: ActivityItem }
 *   transaction    → { event: "transaction",    txn: RawTransaction    }
 *
 * Callbacks are stored in a ref so they are always up-to-date without
 * needing to reconnect. The connection auto-retries after 5 s on error.
 */
export function useActivityStream(callbacks: ActivityStreamCallbacks) {
    const cbRef = useRef<ActivityStreamCallbacks>(callbacks);
    cbRef.current = callbacks;

    useEffect(() => {
        if (typeof EventSource === "undefined") return;

        const url = `${API_BASE_URL}${API_ROUTES.GENERAL.ACTIVITY_STREAM}`;

        let es: EventSource | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        let destroyed = false;

        const handleActivity = (payload: ActivityPayload) => {
            const item = payload.activity;
            if (payload.event === "burn_activity") {
                cbRef.current.onBurnActivity?.(item);
            } else {
                cbRef.current.onSwapActivity?.(item);
            }
        };

        const handleTransaction = (payload: TransactionPayload) => {
            cbRef.current.onTransaction?.(normalizeTransaction(payload.txn));
        };

        /**
         * Null out handlers BEFORE closing so the browser cannot fire onerror
         * on the same instance after close() is called (behaviour varies by browser).
         */
        const disconnect = () => {
            if (!es) return;
            es.onmessage = null;
            es.onerror = null;
            es.close();
            es = null;
        };

        const connect = () => {
            if (destroyed) return;
            disconnect();

            es = new EventSource(url);

            // Named SSE events — the server sets `event: burn_activity` etc. in the stream.
            es.addEventListener("burn_activity", (e: Event) => {
                try { handleActivity(JSON.parse((e as MessageEvent).data) as ActivityPayload); } catch { /* ignore */ }
            });
            es.addEventListener("swap_activity", (e: Event) => {
                try { handleActivity(JSON.parse((e as MessageEvent).data) as ActivityPayload); } catch { /* ignore */ }
            });
            es.addEventListener("transaction", (e: Event) => {
                try { handleTransaction(JSON.parse((e as MessageEvent).data) as TransactionPayload); } catch { /* ignore */ }
            });

            // Fallback: generic `message` event — dispatch by the `event` field inside the JSON.
            es.onmessage = (e: MessageEvent) => {
                try {
                    const payload = JSON.parse(e.data) as ActivityPayload | TransactionPayload;
                    if (payload.event === "transaction") {
                        handleTransaction(payload as TransactionPayload);
                    } else {
                        handleActivity(payload as ActivityPayload);
                    }
                } catch { /* ignore */ }
            };

            es.onerror = () => {
                if (destroyed) return;
                console.log("Activity stream connection error; retrying in 5 s...");
                disconnect();
                if (retryTimer !== null) clearTimeout(retryTimer);
                retryTimer = setTimeout(connect, 5_000);
            };
        };

        connect();

        return () => {
            destroyed = true;
            if (retryTimer !== null) clearTimeout(retryTimer);
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — callbacks are accessed via ref
}
