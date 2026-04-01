import { create } from 'zustand';
import { addDoc, collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Panel {
  id: string;
  name: string;
  ownerEmail?: string | null;
  position?: number;
  categories?: string[];
  // color 필드 제거
}

interface PanelState {
  panels: Panel[];
  loading: boolean;
  updatePanel: (panelId: string, updates: Partial<Omit<Panel, 'id'>>) => Promise<void>;
  swapPanels: (panelAId: string, panelBId: string) => Promise<void>;
  addPanel: (name: string) => Promise<void>;
}

export const usePanelStore = create<PanelState>((set) => ({
  panels: [],
  loading: true,
  updatePanel: async (panelId, updates) => {
    try {
      await updateDoc(doc(db, 'panels', panelId), updates);
    } catch (error) {
      console.error('Error updating panel:', error);
      set((state) => ({
        panels: state.panels.map((panel) => (panel.id === panelId ? { ...panel, ...updates } : panel)),
      }));
    }
  },
  swapPanels: async (panelAId, panelBId) => {
    const state = usePanelStore.getState();
    const panelA = state.panels.find((p) => p.id === panelAId);
    const panelB = state.panels.find((p) => p.id === panelBId);
    if (!panelA || !panelB) return;
    const posA = panelA.position ?? 0;
    const posB = panelB.position ?? 0;

    try {
      await updateDoc(doc(db, 'panels', panelAId), { position: posB });
      await updateDoc(doc(db, 'panels', panelBId), { position: posA });
      set((state) => ({
        panels: state.panels.map((panel) => {
          if (panel.id === panelAId) return { ...panel, position: posB };
          if (panel.id === panelBId) return { ...panel, position: posA };
          return panel;
        }),
      }));
    } catch (error) {
      console.error('Error swapping panels:', error);
      set((state) => ({
        panels: state.panels.map((panel) => {
          if (panel.id === panelAId) return { ...panel, position: posB };
          if (panel.id === panelBId) return { ...panel, position: posA };
          return panel;
        }),
      }));
    }
  },
  addPanel: async (name) => {
    const state = usePanelStore.getState();
    const nextPosition = state.panels.reduce((max, panel) => Math.max(max, panel.position ?? 0), -1) + 1;

    try {
      await addDoc(collection(db, 'panels'), {
        name,
        ownerEmail: null,
        position: nextPosition,
        categories: DEFAULT_CATEGORIES,
      });
    } catch (error) {
      console.error('Error adding panel:', error);
    }
  },
}));

// Real-time listener for panels + categories 마이그레이션
const DEFAULT_CATEGORIES = ['공지', '메모', '첨부파일'];
let migratedPanels: Set<string> = new Set();
try {
  const unsubscribe = onSnapshot(collection(db, 'panels'), async (snapshot) => {
    const panels = await Promise.all(snapshot.docs.map(async docSnap => {
      const data = docSnap.data();
      // color 필드 무시
      const { color, ...rest } = data;
      // categories 마이그레이션: 구버전이거나 '결재' 포함 시 업데이트
      const needsMigration =
        !rest.categories ||
        !Array.isArray(rest.categories) ||
        rest.categories.length < 3 ||
        (Array.isArray(rest.categories) && rest.categories.includes('결재'));
      if (needsMigration && !migratedPanels.has(docSnap.id)) {
        try {
          await updateDoc(doc(db, 'panels', docSnap.id), { categories: DEFAULT_CATEGORIES });
          migratedPanels.add(docSnap.id);
          rest.categories = DEFAULT_CATEGORIES;
        } catch (e) {
          // 무시
        }
      }
      return { id: docSnap.id, ...rest };
    })) as Panel[];
    panels.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    usePanelStore.setState({ panels, loading: false });
  }, (error) => {
    console.error('Firestore error:', error);
    // Fallback to local data
    usePanelStore.setState({
      panels: [
        { id: 'panel-1', name: 'Panel 1' },
        { id: 'panel-2', name: 'Panel 2' },
        { id: 'panel-3', name: 'Panel 3' },
        { id: 'panel-4', name: 'Panel 4' },
        { id: 'panel-5', name: 'Panel 5' },
        { id: 'panel-6', name: 'Panel 6' }
      ],
      loading: false
    });
  });
} catch (error) {
  console.error('Panel store error:', error);
  usePanelStore.setState({
    panels: [
      { id: 'panel-1', name: 'Panel 1' },
      { id: 'panel-2', name: 'Panel 2' },
      { id: 'panel-3', name: 'Panel 3' },
      { id: 'panel-4', name: 'Panel 4' },
      { id: 'panel-5', name: 'Panel 5' },
      { id: 'panel-6', name: 'Panel 6' }
    ],
    loading: false
  });
}