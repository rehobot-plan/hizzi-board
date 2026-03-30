import { create } from 'zustand';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Panel {
  id: string;
  name: string;
  ownerEmail?: string | null;
  position?: number;
  categories?: string[];
  color?: string;
}

interface PanelState {
  panels: Panel[];
  loading: boolean;
  updatePanel: (panelId: string, updates: Partial<Omit<Panel, 'id'>>) => Promise<void>;
  swapPanels: (panelAId: string, panelBId: string) => Promise<void>;
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
}));

// Real-time listener for panels
try {
  const unsubscribe = onSnapshot(collection(db, 'panels'), (snapshot) => {
    const panels = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
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