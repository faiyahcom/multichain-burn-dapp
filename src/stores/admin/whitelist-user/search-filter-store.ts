import type { UserStatus } from "@/types/admin/whitelist-user";
import { create } from "zustand";

type AdminWhitelistUserSearchFilterType = {
    status: UserStatus;
    tokens: string[];
    network: string[];
    text: string;
    page: number;
};

type AdminWhitelistUserSearchFilterState = {
    filter: AdminWhitelistUserSearchFilterType;
    setFilter: (filter: Partial<AdminWhitelistUserSearchFilterType>) => void;
};

export const useAdminWhitelistUserSearchFilterStore =
    create<AdminWhitelistUserSearchFilterState>((set) => ({
        filter: {
            status: "all",
            tokens: [],
            network: [],
            text: "",
            page: 1,
        },
        setFilter: (filter) =>
            set((state) => ({
                filter: {
                    ...state.filter,
                    ...filter,
                },
            })),
    }));
