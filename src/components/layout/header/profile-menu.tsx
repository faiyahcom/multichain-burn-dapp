import { ArrowIcon } from "@/components/common/arrow-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useDisconnect } from "@reown/appkit/react";
import { LogOutIcon, UserIcon } from "lucide-react";

type Props = {};

const ProfileMenu = ({ }: Props) => {
  const { logout } = useAuthStore();
  const { disconnect } = useDisconnect();

  const handleLogout = async () => {
    console.log("abc");
    await disconnect();
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-lg border-progress-bg/40 bg-sub-bg text-sm font-medium text-foreground hover:bg-inactive/40"
        >
          <UserIcon className="size-4" />
          <span>Profile</span>
          <ArrowIcon direction="down" className="text-secondary-text" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 rounded-lg p-1">
        <DropdownMenuItem onClick={handleLogout}>
          <LogOutIcon className="size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
