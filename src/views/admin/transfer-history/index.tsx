import AdminTransferHistoryTable from "@/views/admin/transfer-history/table";
import AdminTransferHistorySummary from "./summary";
import AdminTransferHistorySearch from "./search";

const AdminTransferHistory = () => {
  return (
    <div className="space-y-5.5">
      <AdminTransferHistorySummary />
      <AdminTransferHistorySearch />
      <AdminTransferHistoryTable />
    </div>
  );
};

export default AdminTransferHistory;
