import { useSystemStore } from "@/stores/systemStore";
import { useAppKitEvents, useAppKitNetwork } from "@reown/appkit/react";
import { useEffect, useRef } from "react";

/**
 * Subscribes **once** to appKit modal events at the root level so the listener
 * is never torn down by component unmounts.
 *
 * When a cross-namespace connect flow is in progress (pendingNetworkSwitch is
 * set in the system store by NetworkSelect or SwitchNetworkModal), this hook
 * handles the MODAL_CLOSE event to finalise the network switch.
 */
export function useAppKitEventHandler() {
  const { switchNetwork } = useAppKitNetwork();
  const pendingNetworkSwitch = useSystemStore((s) => s.pendingNetworkSwitch);
  const setPendingNetworkSwitch = useSystemStore((s) => s.setPendingNetworkSwitch);
  const closeSwitchNetworkModal = useSystemStore((s) => s.closeSwitchNetworkModal);

  // Refs keep the stable subscriber callback up to date without re-subscribing.
  const pendingRef = useRef(pendingNetworkSwitch);
  const switchNetworkRef = useRef(switchNetwork);
  const closeSwitchNetworkModalRef = useRef(closeSwitchNetworkModal);
  const setPendingRef = useRef(setPendingNetworkSwitch);

  useEffect(() => { pendingRef.current = pendingNetworkSwitch; }, [pendingNetworkSwitch]);
  useEffect(() => { switchNetworkRef.current = switchNetwork; }, [switchNetwork]);
  useEffect(() => { closeSwitchNetworkModalRef.current = closeSwitchNetworkModal; }, [closeSwitchNetworkModal]);
  useEffect(() => { setPendingRef.current = setPendingNetworkSwitch; }, [setPendingNetworkSwitch]);

  const appKitEvent = useAppKitEvents();

  useEffect(() => {
    if (appKitEvent?.data?.event !== "MODAL_CLOSE") return;

    const pending = pendingRef.current;
    if (!pending) return;

    if (appKitEvent.data.properties.connected) {
      switchNetworkRef.current(pending.network).catch(() => {});
    }

    setPendingRef.current(null);

    if (pending.closeModalOnDone) {
      closeSwitchNetworkModalRef.current();
    }
  }, [appKitEvent]);
}
