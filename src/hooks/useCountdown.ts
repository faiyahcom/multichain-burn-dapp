import { useEffect, useState } from "react";

/** Returns the remaining seconds until `targetTimestamp` (unix seconds), updating every second. */
export function useCountdown(targetTimestamp: number) {
    const [remaining, setRemaining] = useState(() =>
        Math.max(0, targetTimestamp - Math.floor(Date.now() / 1000)),
    );
    useEffect(() => {
        const id = setInterval(() => {
            setRemaining(
                Math.max(0, targetTimestamp - Math.floor(Date.now() / 1000)),
            );
        }, 1000);
        return () => clearInterval(id);
    }, [targetTimestamp]);
    return remaining;
}
