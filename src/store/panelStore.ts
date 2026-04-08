import { create } from "zustand";
import { addDoc, collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToastStore } from "@/store/toastStore";

interface Panel {
  id: string;
  name: string;
  ownerEmail?: string | null;
  position?: number;
  categories?: string[];
}

interface PanelState {
  panels: Panel[];
  loading: boolean;
  updatePanel: (panelId: string, updates: Partial<Omit<Panel, "id">>) => Promise<void>;
  swapPanels: (panelAId: string, panelBId: string) => Promise<void>;
  addPanel: (name: string) => Promise<void>;
}

const DEFAULT_CATEGORIES = ["공지", "메모", "첨부파일"];
const migratedPanels = new Set<string>();

export const usePanelStore = create<PanelState>((set) => ({
  panels: [],
  loading: true,

  updatePanel: async (panelId, updates) => {
    try {
      await updateDoc(doc(db, "panels", panelId), updates);
    } catch (error) {
      console.error("Error updating panel:", error);
      useToastStore.getState().addToast({ message: "패널 업데이트에 실패했습니다. 다시 시도해주세요.", type: "error" });
    }
  },

  swapPanels: async (panelAId, panelBId) => {
    const state = usePanelStore.getState();
    const panelA = state.panels.find((p) => p.id === panelAId);
    const panelB = state.panels.find((p) => p.id === panelBId);
    if (!panelA || !panelB) return;
    const posA = panelA.position ?? 0;
    const posB = panelB.position ?? 0;

    // 1. 낙관적 업데이트
    set((state) => ({
      panels: state.panels.map((panel) => {
        if (panel.id === panelAId) return { ...panel, position: posB };
        if (panel.id === panelBId) return { ...panel, position: posA };
        return panel;
      }),
    }));

    try {
      // 2. Firestore 반영
      await updateDoc(doc(db, "panels", panelAId), { position: posB });
      await updateDoc(doc(db, "panels", panelBId), { position: posA });
    } catch (error) {
      console.error("Error swapping panels:", error);
      useToastStore.getState().addToast({ message: "패널 순서 변경에 실패했습니다. 다시 시도해주세요.", type: "error" });
      // 3. 롤백
      set((state) => ({
        panels: state.panels.map((panel) => {
          if (panel.id === panelAId) return { ...panel, position: posA };
          if (panel.id === panelBId) return { ...panel, position: posB };
          return panel;
        }),
      }));
    }
  },

  addPanel: async (name) => {
    const state = usePanelStore.getState();
    const nextPosition =
      state.panels.reduce((max, panel) => Math.max(max, panel.position ?? 0), -1) + 1;
    try {
      const newPanel: Omit<Panel, "id"> = {
        name,
        ownerEmail: null, // null은 의도적 저장 (ownerEmail 미배정 표시)
        position: nextPosition,
        categories: DEFAULT_CATEGORIES,
      };
      await addDoc(collection(db, "panels"), newPanel);
    } catch (error) {
      console.error("Error adding panel:", error);
      useToastStore.getState().addToast({ message: "패널 추가에 실패했습니다. 다시 시도해주세요.", type: "error" });
    }
  },
}));

let panelUnsubscribe: (() => void) | null = null;

export const initPanelListener = () => {
  if (panelUnsubscribe) {
    panelUnsubscribe();
    panelUnsubscribe = null;
  }

  panelUnsubscribe = onSnapshot(
    collection(db, "panels"),
    async (snapshot) => {
      const panels = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          // Firestore DocumentData는 any 반환 — 구조 분해를 위해 Record 캐스팅 (SDK 타입 한계)
          const { color, ...rest } = data as Record<string, unknown>;
          void color;
          const categories = Array.isArray(rest.categories) ? (rest.categories as string[]) : [];
          const needsMigration = categories.length < 3 || categories.includes("결재");
          if (needsMigration && !migratedPanels.has(docSnap.id)) {
            try {
              await updateDoc(doc(db, "panels", docSnap.id), {
                categories: DEFAULT_CATEGORIES,
              });
              migratedPanels.add(docSnap.id);
              rest.categories = DEFAULT_CATEGORIES;
            } catch {
              // 마이그레이션 실패 시 무시 — 다음 스냅샷에서 재시도
            }
          }
          return { id: docSnap.id, ...rest } as Panel;
        })
      );
      panels.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      usePanelStore.setState({ panels, loading: false });
    },
    (error) => {
      console.error("Panel listener error:", error);
      useToastStore.getState().addToast({ message: "패널 데이터를 불러오지 못했습니다.", type: "error" });
      usePanelStore.setState({ loading: false });
    }
  );

  return () => {
    if (panelUnsubscribe) {
      panelUnsubscribe();
      panelUnsubscribe = null;
    }
  };
};
