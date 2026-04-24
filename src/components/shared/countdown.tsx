import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";

export const useCountdown = (targetUnixSec: string, onExpire?: () => void) => {
    const calcRemaining = () => {
        const diff = Number(targetUnixSec) * 1000 - Date.now();
        if (diff <= 0) return null;
        const days = Math.floor(diff / 86_400_000);
        const hours = Math.floor((diff % 86_400_000) / 3_600_000);
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        const seconds = Math.floor((diff % 60_000) / 1_000);
        return { days, hours, minutes, seconds };
    };

    const [remaining, setRemaining] = useState(calcRemaining);
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const id = setInterval(() => {
            const r = calcRemaining();
            setRemaining(r);
            if (r === null) {
                clearInterval(id);
                delayRef.current = setTimeout(() => {
                    onExpireRef.current?.();
                    pollRef.current = setInterval(() => onExpireRef.current?.(), 2_000);
                }, 1_000);
            }
        }, 1_000);
        return () => {
            clearInterval(id);
            if (delayRef.current) clearTimeout(delayRef.current);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [targetUnixSec]);

    return remaining;
};

const pad = (n: number) => String(n).padStart(2, "0");

export const formatCountdown = (r: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}) => {
    const parts: string[] = [];
    if (r.days > 0) parts.push(`${r.days}d`);
    parts.push(`${pad(r.hours)}h`, `${pad(r.minutes)}m`, `${pad(r.seconds)}s`);
    return parts.join(" ");
};

export const StartsInCountdown = ({
    startTime,
    poolAddress,
    className = "text-sm",
}: {
    startTime: string;
    poolAddress: string;
    className?: string;
}) => {
    const queryClient = useQueryClient();
    const remaining = useCountdown(startTime, () => {
        queryClient.invalidateQueries({ queryKey: poolQueryKeys.detail(poolAddress), exact: false });
    });
    if (!remaining) return null;
    return (
        <p className={className}>
            <span className="font-medium">Starts in: </span>
            <span>{formatCountdown(remaining)}</span>
        </p>
    );
};

export const EndsInCountdown = ({
    endTime,
    poolAddress,
    className = "text-sm",
}: {
    endTime: string;
    poolAddress: string;
    className?: string;
}) => {
    const queryClient = useQueryClient();
    const remaining = useCountdown(endTime, () => {
        queryClient.invalidateQueries({ queryKey: poolQueryKeys.detail(poolAddress), exact: false });
    });
    if (!remaining) return null;
    return (
        <p className={className}>
            <span className="font-medium">Ends in: </span>
            <span>{formatCountdown(remaining)}</span>
        </p>
    );
};
