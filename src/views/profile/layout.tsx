import PageTab from "@/components/common/glow/page-tab";
import { PROFILE_NAV_ITEMS } from "@/components/layout/header/glow/header-nav/const";
import { useLocation } from "@tanstack/react-router";

interface Props {
  children?: React.ReactNode;
}

const ProfileLayout: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const pageTitle =
    PROFILE_NAV_ITEMS.find(
      (item) =>
        item.activeRegexMatch && currentPath.match(item.activeRegexMatch),
    )?.title ?? "Profile";

  return (
    <>
      <PageTab navItems={PROFILE_NAV_ITEMS} />
      <div className="w-full rounded-md bg-[#111113] px-5.5 py-6.25 sm:rounded-24px sm:px-11 sm:py-12.75">
        <div className="w-full space-y-2.5 rounded-md bg-[#0F0F11] sm:space-y-4.75 sm:rounded-24px">
          <h1 className="text-2xl font-semibold sm:text-4xl">{pageTitle}</h1>
          {children}
        </div>
      </div>
    </>
  );
};

export default ProfileLayout;
