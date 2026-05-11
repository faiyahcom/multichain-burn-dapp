import { create } from "zustand";

type SidebarOpenedChildState = {
  openedChild: string[];
  setOpenedChild: (openedChild: string) => void;
};

export const useSidebarOpenedChildStore = create<SidebarOpenedChildState>()(
  (set) => ({
    openedChild: [],
    setOpenedChild: (openedChild: string) => {
      set((state) => ({
        openedChild: Array.from(new Set([...state.openedChild, openedChild])),
      }));
    },
  }),
);
