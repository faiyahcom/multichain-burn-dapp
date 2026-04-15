import { NETWORK_CONFIGS, type NetworkConfig, type NetworkId } from "@/config/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SwitchNetworkRequest = {
  /** Currently connected network — null if not connected / unknown. */
  fromId: NetworkId | null;
  /** Network required by the pool being interacted with. */
  toId: NetworkId;
};

export type PendingNetworkSwitch = {
  /** The AppKit network to switch to once MODAL_CLOSE fires with connected: true. */
  network: AppKitNetwork;
  /** Whether to close the SwitchNetworkModal once done (true when triggered from that modal). */
  closeModalOnDone: boolean;
};

type SystemState = {
  selectedNetworkId: NetworkConfig["id"];
  setSelectedNetworkId: (id: NetworkConfig["id"]) => void;

  /** Non-null while the Switch-Network modal should be open. */
  switchNetworkRequest: SwitchNetworkRequest | null;
  openSwitchNetworkModal: (fromId: NetworkId | null, toId: NetworkId) => void;
  closeSwitchNetworkModal: () => void;

  /**
   * Set by NetworkSelect / SwitchNetworkModal when a cross-namespace connect is in flight.
   * Consumed by the root-level useAppKitEventHandler to finalise the switch on MODAL_CLOSE.
   */
  pendingNetworkSwitch: PendingNetworkSwitch | null;
  setPendingNetworkSwitch: (v: PendingNetworkSwitch | null) => void;
};

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      selectedNetworkId: NETWORK_CONFIGS[0].id,
      setSelectedNetworkId: (id) => set({ selectedNetworkId: id }),

      switchNetworkRequest: null,
      openSwitchNetworkModal: (fromId, toId) =>
        set({ switchNetworkRequest: { fromId, toId } }),
      closeSwitchNetworkModal: () => set({ switchNetworkRequest: null }),

      pendingNetworkSwitch: null,
      setPendingNetworkSwitch: (v) => set({ pendingNetworkSwitch: v }),
    }),
    {
      name: "mb-system-store",
      partialize: (state) => ({ selectedNetworkId: state.selectedNetworkId }),
    },
  ),
);
