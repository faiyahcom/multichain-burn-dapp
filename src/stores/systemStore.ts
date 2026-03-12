import type { NetworkConfig } from "@/config/networks";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type SystemState = {
  selectedNetworkId: NetworkConfig["id"];
  setSelectedNetworkId: (id: NetworkConfig["id"]) => void;
};

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      selectedNetworkId: "ethereumTestnet",
      setSelectedNetworkId: (id) => set({ selectedNetworkId: id }),
    }),
    {
      name: "mb-system-store",
      partialize: (state) => ({ selectedNetworkId: state.selectedNetworkId }),
    },
  ),
);
