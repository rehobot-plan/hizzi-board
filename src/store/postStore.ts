import { create } from 'zustand';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePanelStore } from '@/store/panelStore';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';

export interface PostAttachment {
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
}

export interface Post {
  id: string;
  panelId: string;
  content: string;
  title?: string;
  dueDate?: string;
  attachment?: PostAttachment;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
  category: string;
  visibleTo: string[];
  taskType?: 'work' | 'personal';
  starred?: boolean;
  starredAt?: Date | null;
  completed?: boolean;
  completedAt?: Date | null;
  pinned?: boolean;
  requestId?: string;
  requestFrom?: string;
  requestTitle?: string;
  requestContent?: string;
  requestDueDate?: string | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  archivedAt?: Date | null;
}

interface PostState {
  posts: Post[];
  loading: boolean;
  addPost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<void>;
  updatePost: (postId: string, updates: Partial<Omit<Post, 'id' | 'createdAt'>>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  restorePost: (postId: string) => Promise<boolean>;
  uncompletePost: (postId: string) => Promise<boolean>;
  archivePost: (postId: string) => Promise<boolean>;
  hardDeletePost: (postId: string) => Promise<void>;
}

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  loading: true,
  addPost: async (postData) => {
    const tempId = `temp_${Date.now()}`;
    const tempPost: Post = {
      ...postData,
      id: tempId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set(state => ({ posts: [tempPost, ...state.posts] }));

    try {
      await addDoc(collection(db, 'posts'), {
        ...postData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      set(state => ({ posts: state.posts.filter(p => p.id !== tempId) }));
      console.error('Error adding post:', error);
      useToastStore.getState().addToast({ message: '게시물 저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  },
  updatePost: async (postId, updates) => {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating post:', error);
    }
  },
  deletePost: async (postId) => {
    // soft delete — 낙관적 업데이트
    set(state => ({
      posts: state.posts.map(p =>
        p.id === postId ? { ...p, deleted: true, deletedAt: new Date() } : p
      ),
    }));
    try {
      await updateDoc(doc(db, 'posts', postId), {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
    } catch (error) {
      // 롤백
      set(state => ({
        posts: state.posts.map(p =>
          p.id === postId ? { ...p, deleted: false, deletedAt: null } : p
        ),
      }));
      console.error('Error deleting post:', error);
      useToastStore.getState().addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  },

  // soft delete 복구 — 1층 토스트 실행취소 / 2·3층 회수 공통 경로
  // 성공/실패 반환: 호출부(cascade 포함 경로)에서 체크 가능. void 컨텍스트 호출은 무시해도 안전.
  restorePost: async (postId) => {
    set(state => ({
      posts: state.posts.map(p =>
        p.id === postId ? { ...p, deleted: false, deletedAt: null } : p
      ),
    }));
    try {
      await updateDoc(doc(db, 'posts', postId), {
        deleted: false,
        deletedAt: null,
      });
      return true;
    } catch (error) {
      set(state => ({
        posts: state.posts.map(p =>
          p.id === postId ? { ...p, deleted: true, deletedAt: new Date() } : p
        ),
      }));
      console.error('Error restoring post:', error);
      useToastStore.getState().addToast({ message: '복구에 실패했습니다. 다시 시도해주세요.', type: 'error' });
      return false;
    }
  },

  // 완료 취소 — 1층 토스트 되돌리기 / RecordModal 복구 / 회색 영역 개별 복원 공통 경로.
  // archivedAt도 함께 클리어 — 영구 완료 처리된 항목을 다시 active로 돌릴 때 archived 잔존으로 selectRecentCompletedTop5에서 영구 제외되는 문제 회피 (Codex P2 #1).
  // 롤백 시 prev archivedAt까지 복구 — Firestore 실패 후 local만 archivedAt=null로 남으면 회색 영역에 잘못 노출 (Codex P2 #2).
  uncompletePost: async (postId) => {
    const prev = usePostStore.getState().posts.find(p => p.id === postId);
    const prevCompleted = prev?.completed ?? false;
    const prevCompletedAt = prev?.completedAt ?? null;
    const prevArchivedAt = prev?.archivedAt ?? null;
    set(state => ({
      posts: state.posts.map(p =>
        p.id === postId ? { ...p, completed: false, completedAt: null, archivedAt: null } : p
      ),
    }));
    try {
      await updateDoc(doc(db, 'posts', postId), {
        completed: false,
        completedAt: null,
        archivedAt: null,
      });
      return true;
    } catch (error) {
      set(state => ({
        posts: state.posts.map(p =>
          p.id === postId ? { ...p, completed: prevCompleted, completedAt: prevCompletedAt, archivedAt: prevArchivedAt } : p
        ),
      }));
      console.error('Error uncompleting post:', error);
      useToastStore.getState().addToast({ message: '되돌리기에 실패했습니다. 다시 시도해주세요.', type: 'error' });
      return false;
    }
  },

  // 영구 완료 처리 — main-ux.md 2.5 회색 영역 액션. archivedAt 세팅으로 selectRecentCompletedTop5에서 즉시 빠짐 → RecordModal 'all'에서만 노출.
  archivePost: async (postId) => {
    const now = new Date();
    set(state => ({
      posts: state.posts.map(p =>
        p.id === postId ? { ...p, archivedAt: now } : p
      ),
    }));
    try {
      await updateDoc(doc(db, 'posts', postId), {
        archivedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      set(state => ({
        posts: state.posts.map(p =>
          p.id === postId ? { ...p, archivedAt: null } : p
        ),
      }));
      console.error('Error archiving post:', error);
      useToastStore.getState().addToast({ message: '영구 완료 처리에 실패했습니다. 다시 시도해주세요.', type: 'error' });
      return false;
    }
  },

  // 실제 Firestore 삭제 (삭제된 메모 섹션에서 최종 삭제 시 사용)
  hardDeletePost: async (postId) => {
    set(state => ({ posts: state.posts.filter(p => p.id !== postId) }));
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error('Error hard deleting post:', error);
      useToastStore.getState().addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  },
}));

let postUnsubscribe: (() => void) | null = null;
const notified = new Set<string>();

export const initPostListener = () => {
  if (postUnsubscribe) {
    postUnsubscribe();
    postUnsubscribe = null;
  }

  postUnsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
    const panels = usePanelStore.getState().panels;

    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data() as any;
      const key = `${change.doc.id}-${change.type}`;
      if (notified.has(key)) return;
      notified.add(key);
      setTimeout(() => notified.delete(key), 1000);

      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date());
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || createdAt);
      const now = new Date();

      let actionMessage = '';
      if (change.type === 'added' && now.getTime() - createdAt.getTime() < 2000) {
        actionMessage = '올렸습니다';
      } else if (change.type === 'modified' && createdAt.getTime() !== updatedAt.getTime()) {
        actionMessage = '수정했습니다';
      } else if (change.type === 'removed') {
        actionMessage = '삭제했습니다';
      }

      if (actionMessage) {
        const currentUserEmail = useAuthStore.getState().user?.email;
        const currentUserIsAdmin = useAuthStore.getState().user?.role === 'admin';
        const isMyPost = data.author === currentUserEmail;
        const isVisibleToMe = !data.visibleTo || data.visibleTo.length === 0 || data.visibleTo.includes(currentUserEmail);
        const panel = panels.find((p) => p.id === data.panelId);
        const panelName = panel?.name || data.panelId;

        if (!isMyPost && isVisibleToMe && !currentUserIsAdmin) {
          useToastStore.getState().addToast(`${data.author?.split('@')[0]}님이 ${panelName}에 게시물을 ${actionMessage}`);
        }
      }
    });

    const posts = snapshot.docs
      .map((d): Post | null => {
        const data = d.data();
        if (!data.createdAt) return null;
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
        return {
          id: d.id,
          ...data,
          createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || createdAt),
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : (data.completedAt || null),
          starredAt: data.starredAt?.toDate ? data.starredAt.toDate() : (data.starredAt || null),
          deleted: data.deleted ?? false,
          deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : (data.deletedAt || null),
          archivedAt: data.archivedAt?.toDate ? data.archivedAt.toDate() : (data.archivedAt || null),
        } as Post;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    usePostStore.setState({ posts, loading: false });
  }, (error) => {
    console.error('Firestore error:', error);
    usePostStore.setState({ posts: [], loading: false });
  });

  return () => {
    if (postUnsubscribe) {
      postUnsubscribe();
      postUnsubscribe = null;
    }
  };
};

