import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { adminStatsService } from "@/services/adminStatsService";
import { adminStatsQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import type { AdminHomeSummaryCardProps } from "./summary-card";
import {
  IconAdminHomeArrowLeftRight,
  IconAdminHomeFlame,
  IconAdminHomeLock,
  IconAdminHomeMultiUsers,
  IconAdminHomeSingleUser,
  IconAdminHomeStackLayers,
} from "@/assets/react";
import { shortenNumber } from "@/utils/helpers/numbers";
import AdminHomeSummaryCard from "./summary-card";

const AdminHome = () => {
  const { data: statsData, isPending: isStatsPending } = useQuery({
    queryKey: adminStatsQueryKeys.stats,
    queryFn: async () => {
      return adminStatsService.getStats();
    },
  });

  const cards: AdminHomeSummaryCardProps[] = [
    {
      title: "Total Users",
      value: shortenNumber({ number: statsData?.totalUsers ?? 0 }),
      icon: IconAdminHomeMultiUsers,
    },
    {
      title: "New Users Today",
      value: shortenNumber({ number: statsData?.newUsersToday ?? 0 }),
      icon: IconAdminHomeSingleUser,
    },
    {
      title: "Total Pairs",
      value: shortenNumber({ number: statsData?.totalPairs ?? 0 }),
      icon: IconAdminHomeStackLayers,
    },
    {
      title: "Total Burn Pools",
      value: shortenNumber({ number: statsData?.totalBurnPools ?? 0 }),
      icon: IconAdminHomeFlame,
    },
    {
      title: "Total Swap Pools",
      value: shortenNumber({ number: statsData?.totalSwapPools ?? 0 }),
      icon: IconAdminHomeArrowLeftRight,
    },
    {
      title: "Total Staking Pools",
      value: shortenNumber({ number: statsData?.totalStakingPools ?? 0 }),
      icon: IconAdminHomeLock,
    },
  ];

  return (
    <div className="space-y-5 pb-10 sm:space-y-11.5">
      <div className="px-7 pt-5 sm:px-14 sm:pt-11">
        <h1 className="flex items-center gap-1 text-3xl font-semibold">
          <span>Dashboard</span>
          <Spinner
            className={cn("opacity-0 transition-opacity duration-300", {
              "opacity-100": isStatsPending,
            })}
          />
        </h1>
        <p className="text-base text-mb-gray-69">
          Key metrics and statistics at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 px-4 sm:gap-4 sm:pr-18.25 sm:pl-10.5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <AdminHomeSummaryCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

export default AdminHome;
