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
import { useMediaQuery } from "usehooks-ts";

type Props = {};

const ProfileMenu = ({}: Props) => {
  const { logout, user } = useAuthStore();
  const { disconnect } = useDisconnect();
  const { walletInfo } = useWalletInfo();
  const isMobile = useMediaQuery("(max-width: 640px)");

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
  const name = userApiData?.name ?? walletInfo?.name ?? "Profile";


  return (
    <DropdownMenu>
      <div className="flex items-center justify-between gap-3 rounded-18px bg-mb-dark-profile-btn px-3 py-2 sm:pr-6">
        <div className="flex w-max items-center gap-3 text-left">
          <DropdownMenuTrigger className="shrink-0">
            <TokenImage
              src={avatar}
              alt={name}
              classNames={{
                common: "size-12",
              }}
              isLoading={isGetCurrentUserPending}
              key={userApiDataUpdatedAt}
            />
          </DropdownMenuTrigger>
          {!isMobile && (
            <div className="w-26.25 space-y-1">
              <DropdownMenuTrigger className="block w-full">
                <p
                  className="w-full min-w-0 truncate text-left text-15px font-semibold text-[#EB8C41]"
                  title={name}
                >
                  {name}
                </p>
              </DropdownMenuTrigger>
              <CopyableText
                content={user?.address}
                displayText={truncateString({ str: user?.address ?? "--" })}
                classNames={{
                  container: "justify-start gap-1.75 h-5",
                  displayText:
                    "font-instrument-sans text-xs text-mb-gray-profile",
                  icon: "text-mb-gray-profile",
                }}
              />
            </div>
          )}
        </div>

        <DropdownMenuContent
          align="center"
          side="bottom"
          sideOffset={isMobile ? 20 : 40}
          className="min-w-44 rounded-lg border-transparent bg-mb-dark-profile-btn p-3"
        >
          <div className="px-2 py-1.5 sm:hidden">
            <p
              className="min-w-0 truncate text-13px font-extrabold"
              title={name}
            >
              {name}
            </p>
          </div>
          <div className="px-2 py-1.5 sm:hidden">
            <CopyableText
              content={user?.address}
              displayText={truncateString({ str: user?.address ?? "--" })}
              classNames={{
                container: "justify-start",
              }}
            />
          </div>
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer bg-mb-dark-profile-btn"
          >
            <LogOutIcon className="size-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
};

export default ProfileMenu;
