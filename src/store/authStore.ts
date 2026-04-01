import { create } from 'zustand';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';

const ADMIN_EMAIL = 'admin@company.com';

async function clearAdminPanelOwnership(): Promise<void> {
  try {
    const panelSnap = await getDocs(collection(db, 'panels'));
    const adminOwned = panelSnap.docs.filter((d) => (d.data() as any)?.ownerEmail === ADMIN_EMAIL);
    for (const panelDoc of adminOwned) {
      await updateDoc(doc(db, 'panels', panelDoc.id), { ownerEmail: null });
    }
  } catch (error) {
    console.error('Admin panel cleanup skipped:', error);
  }
}

interface CustomUser extends User {
  role?: string;
}

interface AuthState {
  user: CustomUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  recoveryOrphanAccount: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      // 관리자는 로그인 시마다 패널 배정을 강제로 해제
      if (email === ADMIN_EMAIL) {
        await clearAdminPanelOwnership();
      }
    } catch (error) {
      // Fallback to mock
      if (email === ADMIN_EMAIL && password === 'admin1234!') {
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

        const isAdminSignup = email === ADMIN_EMAIL;
        let assignedPanelId: string | null = null;

        // 빈 패널 자동 배정은 시도만 하고 실패해도 가입은 계속 진행
        // 관리자(role=admin)는 패널 배정 로직을 실행하지 않음
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
    } catch (error: any) {
      // auth/email-already-in-use 에러 처리: Firestore users에 없으면 복구 시도
      if (error?.code === 'auth/email-already-in-use') {
        try {
          // Firestore users 컬렉션에서 해당 이메일 검색
          const usersSnap = await getDocs(collection(db, 'users'));
          const userExists = usersSnap.docs.some((d) => (d.data() as any)?.email === email);

          if (!userExists) {
            // Firestore에 없으면 로그인 후 users 문서 생성
            const signInResult = await signInWithEmailAndPassword(auth, email, password);
            if (signInResult.user) {
              const isAdminSignup = email === ADMIN_EMAIL;
              let assignedPanelId: string | null = null;

              // 빈 패널 자동 배정
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

              // users 문서 생성
              try {
                await setDoc(doc(db, 'users', signInResult.user.uid), {
                  name,
                  email,
                  role: isAdminSignup ? 'admin' : 'user',
                  panelId: assignedPanelId,
                }, { merge: true });
              } catch (profileError) {
                console.error('User profile create skipped:', profileError);
              }
            }
          } else {
            // Firestore에 있으면 원래 에러 던지기
            throw error;
          }
        } catch (fallbackError) {
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  },
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      set({ user: null });
    }
  },
  recoveryOrphanAccount: async (email) => {
    try {
      // Firestore users에 해당 이메일 존재 여부 확인
      const usersSnap = await getDocs(collection(db, 'users'));
      const userExists = usersSnap.docs.some((d) => (d.data() as any)?.email === email);

      if (userExists) {
        throw new Error('이미 Firestore에 등록된 계정입니다.');
      }

      // Firebase Auth에 해당 이메일이 있는지 확인하기 위해 fetchSignInMethodsForEmail 사용
      // 그냥 users 문서를 생성하고 패널 할당
      const isAdminEmail = email === ADMIN_EMAIL;
      let assignedPanelId: string | null = null;

      // 빈 패널 자동 배정 (관리자 제외)
      if (!isAdminEmail) {
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

      // 이메일에서 이름 추출 (@ 앞부분)
      const nameFromEmail = email.split('@')[0];

      // users 문서 생성 (uid는 email의 해시값 사용)
      const docId = 'orphan_' + email.replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'users', docId), {
        name: nameFromEmail,
        email,
        role: isAdminEmail ? 'admin' : 'user',
        panelId: assignedPanelId,
      }, { merge: true });
    } catch (error) {
      throw error;
    }
  },
}));

// Listen to auth state changes
try {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (user.email === ADMIN_EMAIL) {
        void clearAdminPanelOwnership();
      }

      // Add role based on email
      const customUser: CustomUser = {
        ...user,
        role: user.email === ADMIN_EMAIL ? 'admin' : undefined,
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