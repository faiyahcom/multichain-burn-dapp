import { useState, useEffect, useRef, useCallback } from "react";
import {
    useMutation,
    useInfiniteQuery,
    useQueryClient,
    type InfiniteData,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/common/glow/button";
import {
    getVariantBorderClassName,
    getVariantShadowClassName,
} from "@/components/common/glow/container";
import CenterSpinner from "@/components/common/center-spinner";
import NoData from "@/components/common/no-data";
import { IconBell } from "@/assets/react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { notificationService } from "@/services/notificationService";
import { notificationQueryKeys } from "@/services/queries/queryKey";
import { toast } from "@/components/common/custom-toast";
import { formatRelativeTime, getPoolHref } from "@/utils/helpers/string";
import type { NotiItem, NotiMeta } from "@/types/notification";
import type { GetNotificationsResult } from "@/services/notificationService";

const PAGE_SIZE = 10;

// ─── Notification item row ────────────────────────────────────────────────────

function NotiItemRow({
    item,
    onNavigate,
    onMarkRead,
}: {
    item: NotiItem;
    onNavigate: () => void;
    onMarkRead: (id: string) => void;
}) {
    const navigate = useNavigate();
    const [, setTick] = useState(0);
    // Re-render relative timestamps every 60 s
    useEffect(() => {
        const id = setInterval(() => setTick((n) => n + 1), 1_000);
        return () => clearInterval(id);
    }, []);
    const text = item.content ?? item.title;
    const meta = item.meta as NotiMeta | null;
    const poolName = meta?.poolName || "Unknown Pool";
    const href = getPoolHref({
        address: meta?.poolAddress || "",
        kind: meta?.poolKind,
    });

    const handleClick = () => {
        if (!item.is_read) onMarkRead(item.id);
        if (!href) return;
        onNavigate();
        void navigate({ to: href });
    };

    return (
        <div
            role={href ? "button" : undefined}
            tabIndex={href ? 0 : undefined}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (href && (e.key === "Enter" || e.key === " ")) handleClick();
            }}
            className={cn(
                "flex flex-col gap-1.5 px-3 py-3 transition-colors sm:gap-2 sm:px-5 sm:py-4",
                href && "cursor-pointer hover:bg-pair-border/10",
                item.is_read && "opacity-50",
            )}
        >
            {text && (
                <p className="text-xs leading-snug font-semibold sm:text-sm">{text}</p>
            )}
            {poolName && (
                <span
                    className={cn(
                        "inline-flex w-fit items-center px-2 py-0.5 text-xs font-medium sm:px-3 sm:py-1 sm:text-sm",
                        getVariantBorderClassName({
                            variant: "pair",
                            custom: "rounded-md border",
                        }),
                    )}
                >
                    {poolName}
                </span>
            )}
            <p className="text-tiny text-mb-gray-b8 sm:text-xs">
                {formatRelativeTime((Number(item.timestamp) / 1000).toString())}
            </p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationBell() {
    const { user, accessToken } = useAuthStore();
    const [open, setOpen] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    const queryClient = useQueryClient();

    // ─── Infinite query ───────────────────────────────────────────────────────
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery({
        queryKey: notificationQueryKeys.list({ limit: PAGE_SIZE }),
        queryFn: ({ pageParam }) =>
            notificationService.getList({
                page: pageParam as number,
                limit: PAGE_SIZE,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const fetched = allPages.flatMap((p) => p.notis).length;
            return fetched < lastPage.total ? allPages.length + 1 : undefined;
        },
        enabled: !!user,
    });

    const items = data?.pages.flatMap((p) => p.notis) ?? [];
    const unread = data?.pages[0]?.unread ?? 0;

    // ─── Mark single item as read ─────────────────────────────────────────────
    const { mutate: markItemRead } = useMutation({
        mutationFn: (id: string) => notificationService.markRead({ ids: [id] }),
        onMutate: (id) => {
            queryClient.setQueryData<InfiniteData<GetNotificationsResult>>(
                notificationQueryKeys.list({ limit: PAGE_SIZE }),
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page, i) => {
                            const target = page.notis.find((n) => n.id === id);
                            if (!target || target.is_read) return page;
                            return {
                                ...page,
                                notis: page.notis.map((n) =>
                                    n.id === id ? { ...n, is_read: true } : n,
                                ),
                                unread: i === 0 ? Math.max(0, page.unread - 1) : page.unread,
                            };
                        }),
                    };
                },
            );
        },
        onError: () => toast.error("Failed to mark notification as read."),
        onSuccess: () => void refetch(),
    });

    // ─── Prepend SSE item into the query cache ────────────────────────────────
    const prependItem = useCallback(
        (item: NotiItem) => {
            queryClient.setQueryData<InfiniteData<GetNotificationsResult>>(
                notificationQueryKeys.list({ limit: PAGE_SIZE }),
                (old) => {
                    if (!old) return old;
                    const firstPage = old.pages[0];
                    if (!firstPage || firstPage.notis.some((n) => n.id === item.id))
                        return old;
                    return {
                        ...old,
                        pages: [
                            {
                                ...firstPage,
                                notis: [item, ...firstPage.notis],
                                unread: firstPage.unread + (item.is_read ? 0 : 1),
                            },
                            ...old.pages.slice(1),
                        ],
                    };
                },
            );
        },
        [queryClient],
    );

    // ─── Refresh on panel open ────────────────────────────────────────────────
    useEffect(() => {
        if (open && user) void refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // ─── Infinite scroll at 75% scroll height ───────────────────────────────
    const handleScroll = () => {
        const el = listRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        if (el.scrollTop / (el.scrollHeight - el.clientHeight) >= 0.75) {
            void fetchNextPage();
        }
    };

    // ─── SSE ─────────────────────────────────────────────────────────────────
    useNotificationStream(accessToken, { onNotification: prependItem });

    // ─── Mark all read ────────────────────────────────────────────────────────
    const { mutate: doMarkAllRead, isPending: isMarkingRead } = useMutation({
        mutationFn: () => notificationService.markRead({ markAll: true }),
        onError: () => toast.error("Failed to mark all notifications as read."),
        onSuccess: () => void refetch(),
    });

    if (!user) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="relative rounded-full bg-mb-dark-profile-btn p-2 sm:p-5">
                    <IconBell className="size-6 sm:size-7.25" />
                    {unread > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-red-500 p-1 font-inter text-[9px] leading-none font-bold sm:top-0 sm:right-0 2xl:text-13px">
                            {unread > 99 ? "99+" : unread}
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="center"
                alignOffset={12}
                sideOffset={12}
                className={cn(
                    "w-[calc(100vw-1rem)] bg-background pr-2 pl-2 font-inter thin-transparent-scrollbar sm:w-100 sm:pr-4 sm:pl-6 2xl:w-140",
                    getVariantBorderClassName({ variant: "pair", custom: "sm:border-3" }),
                    getVariantShadowClassName({ variant: "pair" }),
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
                    <h2 className="font-orbitron text-lg font-semibold sm:text-xl lg:text-3xl">
                        Notifications
                    </h2>
                </div>

                <div className="h-px" />

                {/* List */}
                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="max-h-[55dvh] divide-y divide-pair-border overflow-y-auto"
                >
                    <CenterSpinner isLoading={isLoading} />
                    {!isLoading &&
                        items.map((item) => (
                            <NotiItemRow
                                key={item.id}
                                item={item}
                                onNavigate={() => setOpen(false)}
                                onMarkRead={markItemRead}
                            />
                        ))}
                    <NoData data={items} isLoading={isLoading} text="No notifications" />

                    {isFetchingNextPage && <CenterSpinner isLoading />}
                </div>
                <div className="flex w-full justify-end bg-background pt-3 pr-3">
                    <Button
                        variant="pair-active"
                        hasHover
                        className="h-8 px-3 py-1 font-orbitron text-xs 2xl:px-5 2xl:py-2"
                        onClick={() => doMarkAllRead()}
                        isLoading={isMarkingRead}
                    >
                        Mark all read
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
