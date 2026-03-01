import CopyableText from "@/components/common/copyable-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TokenStatus } from "@/types/admin/whitelist-token";
import { truncateString } from "@/utils/helpers/string";

// TODO: might need to change the type
type AdminWhitelistTokenTableItem = {
  id: string;
  name: string;
  symbol: string;
  imgSrc: string;
  address: string;
  networkId: string;
  description: string;
  homepage: string;
  doc: string;
  status: TokenStatus;
};

// TODO: replace with real data
const demoData: AdminWhitelistTokenTableItem[] = [
  {
    id: "1",
    name: "Ethereum",
    symbol: "ETH",
    imgSrc: "/network/ethereum.png",
    address: "0x0000000000000000000000000000000000000000",
    networkId: "ethereumTestnet",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sollicitudin tempus convallis. Mauris ultricies sagittis interdum. Etiam ante lorem, auctor non sollicitudin id, molestie quis est.",
    homepage: "https://example.org/",
    doc: "https://example.org/",
    status: "enabled",
  },
  {
    id: "2",
    name: "Binance",
    symbol: "BNB",
    imgSrc: "/network/binance.png",
    address: "0x0000000000000000000000000000000000000000",
    networkId: "binanceTestnet",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sollicitudin tempus convallis. Mauris ultricies sagittis interdum. Etiam ante lorem, auctor non sollicitudin id, molestie quis est.",
    homepage: "https://example.org/",
    doc: "https://example.org/",
    status: "enabled",
  },
  {
    id: "3",
    name: "Xphere",
    symbol: "XPH",
    imgSrc: "/network/xphere.png",
    address: "0x0000000000000000000000000000000000000000",
    networkId: "xphereTestnet",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sollicitudin tempus convallis. Mauris ultricies sagittis interdum. Etiam ante lorem, auctor non sollicitudin id, molestie quis est.",
    homepage: "https://example.org/",
    doc: "https://example.org/",
    status: "disabled",
  },
  {
    id: "4",
    name: "Solana",
    symbol: "SOL",
    imgSrc: "/network/solana.png",
    address: "0x0000000000000000000000000000000000000000",
    networkId: "solanaDevnet",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sollicitudin tempus convallis. Mauris ultricies sagittis interdum. Etiam ante lorem, auctor non sollicitudin id, molestie quis est.",
    homepage: "https://example.org/",
    doc: "https://example.org/",
    status: "enabled",
  },
];

interface Props {
  data?: AdminWhitelistTokenTableItem[];
}

const AdminWhitelistTokenTable: React.FC<Props> = ({ data = demoData }) => {
  return (
    <div className="pb-10 pl-3.75">
      <Table className="table-auto">
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Network</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Toggle</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item, index) => {
            return (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-1.75 pl-3.25">
                    <img
                      src={item.imgSrc}
                      alt={item.name}
                      className="size-8 shrink-0 rounded-full"
                    />
                    <div className="text-left">
                      <p className="text-base">{item.name}</p>
                      <p className="text-11px font-normal text-foreground">
                        {item.symbol}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <CopyableText
                    content={item.address}
                    displayText={truncateString({
                      str: item.address,
                    })}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminWhitelistTokenTable;
