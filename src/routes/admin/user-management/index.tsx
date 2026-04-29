import { FContainer } from "@/components/common/fcontainer";
import AdminUserManagementSearch from "@/views/admin/user-management/search";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/user-management/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col justify-between gap-2.5 sm:gap-5">
      <div className="space-y-2.5 sm:space-y-10">
        <div className="px-7 pt-5 sm:px-14 sm:pt-11">
          <h1 className="text-3xl font-semibold">User Management</h1>
          <p className="text-base text-mb-gray-69">
            View and manage all registered users.
          </p>
        </div>

        <FContainer className="pt-1 sm:pt-2 mx-4 sm:ml-9.75 sm:mr-13.5">
            <AdminUserManagementSearch />
        </FContainer>
      </div>
    </div>
  );
}
