import AdminTransferHistoryHeader from "@/views/admin/transfer-history/detail/header";
import AdminTransferHistoryTable from "@/views/admin/transfer-history/table";

const AdminTransferHistory = () => {
  return (
    <div className="space-y-5.5">
      <AdminTransferHistoryHeader />
      <AdminTransferHistoryTable />
    </div>
  );
};

export default AdminTransferHistory;
