import type { NetworkConfig, NetworkId } from "@/config/networks";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SwitchNetworkRequest = {
  /** Currently connected network — null if not connected / unknown. */
  fromId: NetworkId | null;
  /** Network required by the pool being interacted with. */
  toId: NetworkId;
};

type SystemState = {
  selectedNetworkId: NetworkConfig["id"];
  setSelectedNetworkId: (id: NetworkConfig["id"]) => void;

  /** Non-null while the Switch-Network modal should be open. */
  switchNetworkRequest: SwitchNetworkRequest | null;
  openSwitchNetworkModal: (fromId: NetworkId | null, toId: NetworkId) => void;
  closeSwitchNetworkModal: () => void;
};

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      selectedNetworkId: "ethereumTestnet",
      setSelectedNetworkId: (id) => set({ selectedNetworkId: id }),

      switchNetworkRequest: null,
      openSwitchNetworkModal: (fromId, toId) =>
        set({ switchNetworkRequest: { fromId, toId } }),
      closeSwitchNetworkModal: () => set({ switchNetworkRequest: null }),
    }),
    {
      name: "mb-system-store",
      partialize: (state) => ({ selectedNetworkId: state.selectedNetworkId }),
    },
  ),
);
