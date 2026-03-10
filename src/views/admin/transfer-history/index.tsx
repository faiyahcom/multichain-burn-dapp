import AdminTransferHistoryTable from "@/views/admin/transfer-history/table";
import AdminTransferHistorySummary from "./summary";

const AdminTransferHistory = () => {
  return (
    <div className="space-y-5.5">
      <AdminTransferHistorySummary />
      <AdminTransferHistoryTable />
    </div>
  );
};

export default AdminTransferHistory;
