import type { NetworkConfig } from "@/config/networks";
import { create } from "zustand";

type SystemState = {
  selectedNetworkId: NetworkConfig["id"];
  setSelectedNetworkId: (id: NetworkConfig["id"]) => void;
};

export const useSystemStore = create<SystemState>((set) => ({
  selectedNetworkId: "ethereumTestnet",
  setSelectedNetworkId: (id) => set({ selectedNetworkId: id }),
}));
