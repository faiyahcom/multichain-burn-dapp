import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ActivityItem } from "@/services/dashboardService";

// ─── Constants ────────────────────────────────────────────────────────────────

export const FEED_PAGE_SIZE = 4;
export const TXN_PAGE_SIZE = 6;
/** Milliseconds between page jumps. */
const TICK_INTERVAL_MS = 4_000;

// ─── State & reducer ─────────────────────────────────────────────────────────

interface FeedState {
    /**
     * All known items, latest-first (index 0 = newest).
     * This is the "frozen" snapshot being cycled through.
     */
    allItems: ActivityItem[];
    /**
     * New items from SSE / query refetch that are waiting for the next
     * cycle reset before being merged into allItems.
     */
    pendingBuffer: ActivityItem[];
    /**
     * Currently displayed page index.
     *   0            = the latest items (top of the timeline).
     *   totalPages-1 = the oldest items (bottom of the timeline).
     *
     * The cycle runs from (totalPages-1) down to 0 (bottom → top / older → newer),
     * then merges the pending buffer and restarts from the new bottom.
     */
    currentPage: number;
    totalPages: number;
    /** How many items to show per page. Set once at INIT. */
    pageSize: number;
    /**
     * Incremented each tick so the animated container can be re-keyed
     * to trigger a CSS enter animation on every page change.
     */
    animKey: number;
}

type FeedAction =
    | { type: "INIT"; items: ActivityItem[]; pageSize: number }
    | { type: "ADD_PENDING"; items: ActivityItem[] }
    | { type: "TICK" };

const INITIAL_STATE: FeedState = {
    allItems: [],
    pendingBuffer: [],
    currentPage: 0,
    totalPages: 1,
    pageSize: FEED_PAGE_SIZE,
    animKey: 0,
};

function calcTotalPages(items: ActivityItem[], pageSize: number): number {
    return Math.max(1, Math.ceil(items.length / pageSize));
}

function dedupeById(items: ActivityItem[]): ActivityItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
}

function feedReducer(state: FeedState, action: FeedAction): FeedState {
    switch (action.type) {
        case "INIT": {
            const tp = calcTotalPages(action.items, action.pageSize);
            return {
                allItems: action.items,
                pendingBuffer: [],
                currentPage: tp - 1, // start at oldest page
                totalPages: tp,
                pageSize: action.pageSize,
                animKey: 0,
            };
        }

        case "ADD_PENDING":
            return {
                ...state,
                pendingBuffer: [...action.items, ...state.pendingBuffer],
            };

        case "TICK": {
            // No-op before first INIT (allItems is empty)
            if (state.allItems.length === 0) return state;
            // No-op when all items fit on a single page — nothing to cycle through
            if (state.totalPages <= 1) return state;

            const next = state.currentPage - 1;

            if (next >= 0) {
                // Still cycling — advance one page toward the latest
                return { ...state, currentPage: next, animKey: state.animKey + 1 };
            }

            // Cycle complete (we just showed the latest page).
            // Merge the pending buffer (new items prepended → they become the new "top"),
            // then restart from the new bottom (oldest page).
            const merged = dedupeById([...state.pendingBuffer, ...state.allItems]);
            const tp = calcTotalPages(merged, state.pageSize);
            return {
                allItems: merged,
                pendingBuffer: [],
                currentPage: tp - 1,
                totalPages: tp,
                pageSize: state.pageSize,
                animKey: state.animKey + 1,
            };
        }

        default:
            return state;
    }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages a bottom-up, page-jumping activity feed with safe SSE / refetch handling.
 *
 * Lifecycle:
 *  1. `queryItems` first arrives → INIT (sets currentPage to last / oldest page).
 *  2. Timer ticks every 3 s → TICK (advances toward page 0 / latest).
 *  3. At page 0 (latest shown) → cycle boundary: pending items merged, restart.
 *  4. SSE items or query refetch items → ADD_PENDING (deduped, queued until boundary).
 *
 * @param queryItems  The raw items from the REST query (latest-first). Stable refs
 *                    from TanStack Query memoisation work best here; wrap in useMemo
 *                    if deriving from a larger response object.
 */
export function useScrollingFeed(queryItems: ActivityItem[], pageSize = FEED_PAGE_SIZE) {
    const [state, dispatch] = useReducer(feedReducer, INITIAL_STATE);

    // Used to deduplicate items across all sources (query initial, query refetch, SSE).
    const knownIds = useRef(new Set<string>());
    const initialized = useRef(false);

    // ── One-time initialisation when the first batch of query data arrives ──
    useEffect(() => {
        if (initialized.current || queryItems.length === 0) return;
        initialized.current = true;
        queryItems.forEach((item) => knownIds.current.add(item.id));
        dispatch({ type: "INIT", items: queryItems, pageSize });
    }, [queryItems]);

    // ── Subsequent query refetches: only new items enter the pending buffer ──
    // This fires when queryItems reference changes (TanStack Query refetch).
    // The knownIds guard ensures already-seen items are silently skipped, so a
    // stale-time based refetch won't reset the in-progress animation cycle.
    useEffect(() => {
        if (!initialized.current) return;
        const fresh = queryItems.filter((item) => !knownIds.current.has(item.id));
        if (fresh.length === 0) return;
        fresh.forEach((item) => knownIds.current.add(item.id));
        dispatch({ type: "ADD_PENDING", items: fresh });
    }, [queryItems]);

    // ── SSE items: stable callback, safe to pass as a prop ──────────────────
    const addItems = useCallback((items: ActivityItem[]) => {
        const fresh = items.filter((item) => !knownIds.current.has(item.id));
        if (fresh.length === 0) return;
        fresh.forEach((item) => knownIds.current.add(item.id));
        dispatch({ type: "ADD_PENDING", items: fresh });
    }, []);

    // ── Tick timer — always running; reducer no-ops until initialised ────────
    useEffect(() => {
        const id = setInterval(() => dispatch({ type: "TICK" }), TICK_INTERVAL_MS);
        return () => clearInterval(id);
    }, []);

    const start = state.currentPage * state.pageSize;
    const visibleItems = state.allItems.slice(start, start + state.pageSize);

    return {
        visibleItems,
        /** Bump on every page jump — use as `key` on the animated container. */
        animKey: state.animKey,
        /** Call with incoming SSE items (array of one or more ActivityItem). */
        addItems,
    };
}
