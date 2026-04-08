import { create } from "zustand";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToastStore } from "@/store/toastStore";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role?: "admin" | "user";
  panelId?: string;
  leaveViewPermission?: "none" | "me" | "self" | "all";
}

interface UserState {
  users: AppUser[];
  loading: boolean;
  addUser: (user: Omit<AppUser, "id">) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserPanel: (id: string, panelId: string | null) => Promise<void>;
  updateUserName: (id: string, name: string) => Promise<void>;
  updateLeaveViewPermission: (
    id: string,
    permission: AppUser["leaveViewPermission"]
  ) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: true,

  addUser: async (userData) => {
    try {
      // leaveViewPermission은 관리자가 별도 설정 — 신규 생성 시 제외 (기본값 없음)
      const ref = await addDoc(collection(db, "users"), {
        name: userData.name,
        email: userData.email,
        role: userData.role || "user",
        panelId: userData.panelId || null,
      });
      set((state) => ({
        users: [...state.users, { id: ref.id, ...userData }],
      }));
    } catch (error) {
      console.error("Error adding user:", error);
      useToastStore.getState().addToast({ message: "사용자 추가에 실패했습니다. 다시 시도해주세요.", type: "error" });
    }
  },

  deleteUser: async (id) => {
    const deletedUser = useUserStore.getState().users.find((u) => u.id === id);
    // 1. 낙관적 업데이트
    set((state) => ({ users: state.users.filter((user) => user.id !== id) }));
    try {
      // 2. Firestore 반영
      await deleteDoc(doc(db, "users", id));
    } catch (error) {
      console.error("Error deleting user:", error);
      useToastStore.getState().addToast({ message: "사용자 삭제에 실패했습니다. 다시 시도해주세요.", type: "error" });
      // 3. 롤백
      if (deletedUser) {
        set((state) => ({ users: [...state.users, deletedUser] }));
      }
    }
  },

  updateUserPanel: async (id, panelId) => {
    try {
      await updateDoc(doc(db, "users", id), { panelId: panelId || null });
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, panelId: panelId || undefined } : u
        ),
      }));
    } catch (error) {
      console.error("Error updating user panel:", error);
      useToastStore.getState().addToast({ message: "패널 배정에 실패했습니다. 다시 시도해주세요.", type: "error" });
    }
  },

  updateUserName: async (id, name) => {
    try {
      await updateDoc(doc(db, "users", id), { name });
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, name } : u)),
      }));
    } catch (error) {
      console.error("Error updating user name:", error);
      useToastStore.getState().addToast({ message: "이름 변경에 실패했습니다. 다시 시도해주세요.", type: "error" });
    }
  },

  updateLeaveViewPermission: async (id, permission) => {
    try {
      await updateDoc(doc(db, "users", id), { leaveViewPermission: permission });
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, leaveViewPermission: permission } : u
        ),
      }));
    } catch (error) {
      console.error("Error updating leave view permission:", error);
      useToastStore.getState().addToast({ message: "권한 변경에 실패했습니다. 다시 시도해주세요.", type: "error" });
    }
  },
}));

let userUnsubscribe: (() => void) | null = null;

export const initUserListener = () => {
  if (userUnsubscribe) {
    userUnsubscribe();
    userUnsubscribe = null;
  }

  userUnsubscribe = onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      const users = snapshot.docs.map((docRef) => ({
        id: docRef.id,
        ...(docRef.data() as Omit<AppUser, "id">),
      })) as AppUser[];
      useUserStore.setState({ users, loading: false });
    },
    (error) => {
      console.error("User listener error:", error);
      useToastStore.getState().addToast({ message: "사용자 데이터를 불러오지 못했습니다.", type: "error" });
      useUserStore.setState({ loading: false });
    }
  );

  return () => {
    if (userUnsubscribe) {
      userUnsubscribe();
      userUnsubscribe = null;
    }
  };
};
