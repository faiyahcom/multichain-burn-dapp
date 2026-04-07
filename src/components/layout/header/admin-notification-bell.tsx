import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/common/custom-toast";
import { useAuthStore } from "@/stores/authStore";
import { adminNotificationService } from "@/services/adminNotificationService";
import { adminNotificationQueryKeys } from "@/services/queries/queryKey";
import { useAdminNotificationStream } from "@/hooks/useAdminNotificationStream";
import { formatRelativeTime, getAdminPoolHref } from "@/utils/helpers/string";
import type { NotiItem, NotiMeta } from "@/types/notification";

const PAGE_LIMIT = 20;

// ---------------------------------------------------------------------------
// NotiItemRow
// ---------------------------------------------------------------------------

interface NotiItemRowProps {
  item: NotiItem;
  onNavigate: () => void;
  onMarkRead: (id: string) => void;
}

function NotiItemRow({ item, onNavigate, onMarkRead }: NotiItemRowProps) {
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  const text = item.content ?? item.title;
  const meta = item.meta as NotiMeta | null;
  const poolName = meta?.poolName ?? "Unknown Pool";
  const href = getAdminPoolHref({ address: meta?.poolAddress ?? "", kind: meta?.poolKind });

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
        "flex flex-col gap-1 px-3 py-3 transition-colors",
        href && "cursor-pointer hover:bg-foreground/5",
        item.is_read && "opacity-50",
      )}
    >
      {/* unread dot */}
      <div className="flex items-start justify-between gap-2">
        <span className="flex-1 text-sm leading-snug">{text}</span>
        {!item.is_read && (
          <span className="mt-1 size-2 shrink-0 rounded-full bg-red-500" />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="rounded border border-foreground/20 px-1.5 py-0.5 text-xs text-foreground/60">
          {poolName}
        </span>
        <span className="text-xs text-foreground/40">
          {formatRelativeTime(item.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminNotificationBell
// ---------------------------------------------------------------------------

export function AdminNotificationBell() {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    user?.role === "admin" || user?.role === "super_admin";

  // ------------------------------------------------------------------
  // Infinite query
  // ------------------------------------------------------------------
  const { data, isFetching, fetchNextPage, hasNextPage, refetch } =
    useInfiniteQuery({
      queryKey: adminNotificationQueryKeys.list({ limit: PAGE_LIMIT }),
      queryFn: ({ pageParam = 1 }) =>
        adminNotificationService.getList({
          page: pageParam as number,
          limit: PAGE_LIMIT,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        const loaded = allPages.flatMap((p) => p.notis).length;
        return loaded < lastPage.total ? allPages.length + 1 : undefined;
      },
      enabled: isAdmin && !!accessToken,
    });

  const allItems = data?.pages.flatMap((p) => p.notis) ?? [];
  const unread = data?.pages[0]?.unread ?? 0;

  // ------------------------------------------------------------------
  // SSE — prepend new items
  // ------------------------------------------------------------------
  const prependItem = useCallback(
    (item: NotiItem) => {
      queryClient.setQueryData(
        adminNotificationQueryKeys.list({ limit: PAGE_LIMIT }),
        (
          old: typeof data,
        ) => {
          if (!old) return old;
          const pages = old.pages.map((page, i) => {
            if (i !== 0) return page;
            return {
              ...page,
              notis: [item, ...page.notis],
              total: page.total + 1,
              unread: page.unread + 1,
            };
          });
          return { ...old, pages };
        },
      );
    },
    [queryClient],
  );

  useAdminNotificationStream(isAdmin ? accessToken : null, {
    onNotification: prependItem,
  });

  // ------------------------------------------------------------------
  // Mark single read
  // ------------------------------------------------------------------
  const { mutate: markItemRead } = useMutation({
    mutationFn: (id: string) =>
      adminNotificationService.markRead({ ids: [id] }),
    onMutate: (id) => {
      queryClient.setQueryData(
        adminNotificationQueryKeys.list({ limit: PAGE_LIMIT }),
        (old: typeof data) => {
          if (!old) return old;
          const pages = old.pages.map((page, i) => {
            const notis = page.notis.map((n) =>
              n.id === id ? { ...n, is_read: true } : n,
            );
            return {
              ...page,
              notis,
              unread: i === 0 ? Math.max(0, page.unread - 1) : page.unread,
            };
          });
          return { ...old, pages };
        },
      );
    },
    onError: () => toast.error("Failed to mark notification as read."),
    onSuccess: () => void refetch(),
  });

  // ------------------------------------------------------------------
  // Mark all read
  // ------------------------------------------------------------------
  const { mutate: doMarkAllRead, isPending: isMarkingRead } = useMutation({
    mutationFn: () => adminNotificationService.markRead({ markAll: true }),
    onError: () => toast.error("Failed to mark all notifications as read."),
    onSuccess: () => void refetch(),
  });

  // ------------------------------------------------------------------
  // Infinite scroll
  // ------------------------------------------------------------------
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || isFetching || !hasNextPage) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      void fetchNextPage();
    }
  }, [isFetching, hasNextPage, fetchNextPage]);

  if (!isAdmin) return null;

  const badgeLabel = unread > 99 ? "99+" : String(unread);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative bg-primary-foreground inline-flex items-center justify-center rounded-full p-2 transition-colors hover:bg-foreground/10"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-tiny font-bold leading-4.5 text-white">
              {badgeLabel}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[calc(100vw-1rem)] p-0 sm:w-120"
        align="end"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unread > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
              {badgeLabel}
            </span>
          )}
        </div>

        {/* List */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="max-h-[55dvh] divide-y overflow-y-auto"
        >
          {allItems.length === 0 && !isFetching && (
            <p className="px-4 py-8 text-center text-sm text-foreground/50">
              No notifications
            </p>
          )}

          {allItems.map((item) => (
            <NotiItemRow
              key={item.id}
              item={item}
              onNavigate={() => setOpen(false)}
              onMarkRead={markItemRead}
            />
          ))}

          {isFetching && (
            <div className="flex justify-center py-3">
              <Spinner />
            </div>
          )}
        </div>

        {/* Footer */}
        {allItems.length > 0 && (
          <div className="border-t px-4 py-3">
            <Button
              variant="mb-active"
              size="mb-btn"
              className="w-full"
              disabled={unread === 0 || isMarkingRead}
              onClick={() => doMarkAllRead()}
            >
              {isMarkingRead ? <Spinner /> : "Mark all read"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
