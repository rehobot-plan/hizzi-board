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
}

interface PostState {
  posts: Post[];
  loading: boolean;
  addPost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<void>;
  updatePost: (postId: string, updates: Partial<Omit<Post, 'id' | 'createdAt'>>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  loading: true,
  addPost: async (postData) => {
    try {
      await addDoc(collection(db, 'posts'), {
        ...postData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding post:', error);
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
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
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

    const posts = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || data.createdAt || new Date()),
        completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : (data.completedAt || null),
        starredAt: data.starredAt?.toDate ? data.starredAt.toDate() : (data.starredAt || null),
      };
    }) as Post[];

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

