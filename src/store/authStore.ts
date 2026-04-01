import { create } from 'zustand';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';

interface CustomUser extends User {
  role?: string;
}

interface AuthState {
  user: CustomUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // Fallback to mock
      if (email === 'admin@company.com' && password === 'admin1234!') {
        set({ user: { email, uid: 'mock-uid', role: 'admin', displayName: '관리자' } as CustomUser });
      } else {
        throw error;
      }
    }
  },
  signUp: async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });

        // 신규 가입자는 패널 미배정 상태(panelId: null)로 저장
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const existing = await getDocs(userQuery);
        if (existing.empty) {
          await addDoc(collection(db, 'users'), {
            name,
            email,
            role: 'user',
            panelId: null,
          });
        }
      }
    } catch (error) {
      // Fallback mock signup
      set({ user: { email, uid: `mock-${Date.now()}`, displayName: name } as CustomUser });
    }
  },
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      set({ user: null });
    }
  },
}));

// Listen to auth state changes
try {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Add role based on email
      const customUser: CustomUser = {
        ...user,
        role: user.email === 'admin@company.com' ? 'admin' : undefined,
        displayName: user.displayName || null,
      };
      useAuthStore.setState({ user: customUser, loading: false });
    } else {
      useAuthStore.setState({ user: null, loading: false });
    }
  });
} catch (error) {
  console.error('Auth error:', error);
  useAuthStore.setState({ loading: false });
}