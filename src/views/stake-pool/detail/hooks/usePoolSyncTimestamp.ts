import { useEffect, useRef, useCallback } from "react";

const SYNC_INTERVAL_MS = 2_500;

/**
 * Drives a synchronized 2.5 s polling cycle for pool-detail queries.
 *
 * - Uses a ref instead of state → zero extra re-renders.
 * - Calls `onTick` on every interval so the caller can trigger
 *   `queryClient.refetchQueries` for both APIs at the same tick.
 * - Returns a stable `getTimestamp()` function that always reads the
 *   latest timestamp value; safe to capture in `queryFn` closures.
 */
export function usePoolSync(onTick: () => void): () => number {
    const currentRef = useRef(Date.now());
    // Keep the latest onTick without restarting the interval
    const onTickRef = useRef(onTick);
    onTickRef.current = onTick;

    const getTimestamp = useCallback(() => currentRef.current, []);

    useEffect(() => {
        const id = setInterval(() => {
            currentRef.current = Date.now();
            onTickRef.current();
        }, SYNC_INTERVAL_MS);
        return () => clearInterval(id);
    }, []);

    return getTimestamp;
}
