import { create } from 'zustand';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  panelId?: string;
}

interface UserState {
  users: AppUser[];
  loading: boolean;
  addUser: (user: Omit<AppUser, 'id'>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserPanel: (id: string, panelId: string | null) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: true,
  addUser: async (userData) => {
    try {
      const ref = await addDoc(collection(db, 'users'), {
        name: userData.name,
        email: userData.email,
        role: userData.role || 'user',
        panelId: userData.panelId || null,
      });
      set((state) => ({ users: [...state.users, { id: ref.id, ...userData }] }));
    } catch (error) {
      console.error('Error adding user:', error);
    }
  },
  deleteUser: async (id) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      set((state) => ({ users: state.users.filter((user) => user.id !== id) }));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  },
  updateUserPanel: async (id, panelId) => {
    try {
      await updateDoc(doc(db, 'users', id), { panelId: panelId || null });
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, panelId: panelId || undefined } : u)),
      }));
    } catch (error) {
      console.error('Error updating user panel:', error);
    }
  },
}));

// Real-time listener for users
try {
  onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map((docRef) => ({
      id: docRef.id,
      ...(docRef.data() as Omit<AppUser, 'id'>),
    })) as AppUser[];
    useUserStore.setState({ users, loading: false });
  }, (error) => {
    console.error('Firestore user listener error:', error);
    useUserStore.setState({ users: [], loading: false });
  });
} catch (error) {
  console.error('User store error:', error);
  useUserStore.setState({ loading: false });
}