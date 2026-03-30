import { create } from 'zustand';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePanelStore } from '@/store/panelStore';
import { useToastStore } from '@/store/toastStore';

export interface Post {
  id: string;
  panelId: string;
  type: 'text' | 'image' | 'link';
  content: string;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
  category?: string;
  visibleTo?: string[];
}

interface PostState {
  posts: Post[];
  loading: boolean;
  addPost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<void>;
  updatePost: (postId: string, updates: Partial<Omit<Post, 'id' | 'createdAt'>>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

export const usePostStore = create<PostState>((set, get) => ({
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
      // Fallback: add to local state
      const now = new Date();
      const newPost: Post = {
        ...postData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({ posts: [...state.posts, newPost] }));
    }
  },
  updatePost: async (postId: string, updates) => {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating post:', error);
      // Fallback: update local state
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, ...updates, updatedAt: new Date() } : p)),
      }));
    }
  },
  deletePost: async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      // Fallback: remove from local state
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
      }));
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
      const fontKey = `${change.doc.id}-${change.type}`;
      if (notified.has(fontKey)) return;
      notified.add(fontKey);
      setTimeout(() => notified.delete(fontKey), 1000);

      const author = data.author || '사용자';
      const panel = panels.find((p) => p.id === data.panelId);
      const panelName = panel?.name || data.panelId;
      let actionMessage = '';

      // createdAt/updatedAt Firestore Timestamp → Date 변환
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date());
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || createdAt);
      const now = new Date();

      if (change.type === 'added') {
        // 2초 이내에 생성된 경우만 신규 알림
        if (now.getTime() - createdAt.getTime() < 2000) {
          actionMessage = '올렸습니다';
        }
      } else if (change.type === 'modified') {
        // 수정 시 createdAt과 updatedAt이 다를 때만 알림
        if (createdAt.getTime() !== updatedAt.getTime()) {
          actionMessage = '수정했습니다';
        }
      } else if (change.type === 'removed') {
        actionMessage = '삭제했습니다';
      }

      if (actionMessage) {
        useToastStore.getState().addToast(`${author}님이 ${panelName}에 게시물을 ${actionMessage}`);
      }
    });

    const posts = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt || new Date()),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.updatedAt || d.createdAt || new Date()),
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

initPostListener();