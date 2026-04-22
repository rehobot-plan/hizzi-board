import { create } from "zustand";

interface AdminModeState {
  adminMode: boolean;
  toggle: () => void;
  setAdminMode: (value: boolean) => void;
}

export const useAdminModeStore = create<AdminModeState>((set) => ({
  adminMode: false,
  toggle: () => set((s) => ({ adminMode: !s.adminMode })),
  setAdminMode: (value) => set({ adminMode: value }),
}));
