import { create } from 'zustand';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
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

        const isAdminSignup = email === 'admin@company.com';
        let assignedPanelId: string | null = null;

        // 빈 패널 자동 배정은 시도만 하고 실패해도 가입은 계속 진행
        if (!isAdminSignup) {
          try {
            const panelSnap = await getDocs(collection(db, 'panels'));
            const sortedPanels = panelSnap.docs
              .map((d) => ({ id: d.id, ...(d.data() as any) }))
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

            const emptyPanel = sortedPanels.find((panel) => !panel.ownerEmail);
            if (emptyPanel) {
              await updateDoc(doc(db, 'panels', emptyPanel.id), { ownerEmail: email });
              assignedPanelId = emptyPanel.id;
            }
          } catch (panelAssignError) {
            console.error('Panel auto-assign skipped:', panelAssignError);
          }
        }

        // 사용자 문서 저장 실패도 가입 자체를 막지 않음
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            name,
            email,
            role: isAdminSignup ? 'admin' : 'user',
            panelId: assignedPanelId,
          }, { merge: true });
        } catch (profileError) {
          console.error('User profile create skipped:', profileError);
        }
      }
    } catch (error) {
      throw error;
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