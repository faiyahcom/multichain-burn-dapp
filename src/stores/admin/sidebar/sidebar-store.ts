import { create } from "zustand";

type SidebarState = {
  isOpen: boolean;
};

type SidebarStateStore = {
  state: SidebarState;
  setState: (state: Partial<SidebarState>) => void;
};

export const useSidebarStateStore = create<SidebarStateStore>((set) => ({
  state: {
    isOpen: false,
  },
  setState: (newState) =>
    set((oldState) => ({
      ...oldState,
      state: { ...oldState.state, ...newState },
    })),
}));
