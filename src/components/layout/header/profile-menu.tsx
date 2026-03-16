import { ArrowIcon } from "@/components/common/arrow-icon";
import CopyableText from "@/components/common/copyable-text";
import TokenImage from "@/components/common/token-image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authService } from "@/services/authService";
import { authQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { truncateString } from "@/utils/helpers/string";
import { useDisconnect, useWalletInfo } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";

type Props = {};

const ProfileMenu = ({}: Props) => {
  const { logout, user } = useAuthStore();
  const { disconnect } = useDisconnect();
  const { walletInfo } = useWalletInfo();

  const {
    data: userApiData,
    isPending: isGetCurrentUserPending,
    dataUpdatedAt: userApiDataUpdatedAt,
  } = useQuery({
    queryKey: authQueryKeys.me({
      address: user?.address,
    }),
    queryFn: async () => {
      return authService.getCurrentUser();
    },
    enabled: !!user?.address,
    staleTime: Infinity,
  });

  const handleLogout = async () => {
    await disconnect();
    logout();
  };

  const avatar = userApiData?.avatar ?? walletInfo?.icon;
  const name = userApiData?.name ?? walletInfo?.name;

  return (
    <div className="flex min-w-76.25 items-center justify-between gap-5.5 rounded-md-plus bg-primary-foreground pt-0.5 pr-4.25 pb-0.75 pl-1.75">
      <div className="flex items-center gap-5.5 text-left">
        <TokenImage
          src={avatar}
          alt={name}
          classNames={{
            common: "size-11.75",
          }}
          isLoading={isGetCurrentUserPending}
          key={userApiDataUpdatedAt}
        />
        <div>
          <p className="text-13px font-extrabold">{name ?? "Profile"}</p>
          <CopyableText
            content={user?.address}
            displayText={truncateString({ str: user?.address ?? "--" })}
          />
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-6.25 w-7.5 items-center justify-center rounded-5px bg-background">
            <ArrowIcon direction="down" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44 rounded-lg p-1">
          <DropdownMenuItem onClick={handleLogout}>
            <LogOutIcon className="size-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProfileMenu;
