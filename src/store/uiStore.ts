import { create } from 'zustand';

export interface MenuAction {
  label: string;
  onClick: () => void;
  color?: string;
  hoverBg?: string;
}

export interface MenuGroup {
  groupLabel?: string;
  actions: MenuAction[];
}

interface UIState {
  menu: {
    open: boolean;
    x: number;
    y: number;
    groups: MenuGroup[];
  };
  openMenu: (x: number, y: number, groups: MenuGroup[]) => void;
  closeMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  menu: { open: false, x: 0, y: 0, groups: [] },
  openMenu: (x, y, groups) => set({ menu: { open: true, x, y, groups } }),
  closeMenu: () => set((s) => ({ menu: { ...s.menu, open: false } })),
}));