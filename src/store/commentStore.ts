'use client';

import { create } from 'zustand';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToastStore } from '@/store/toastStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';

export interface GlobalComment {
  id: string;
  requestId: string;
  author: string;
  authorName: string;
  content: string;
  createdAt: Date;
  type: 'user' | 'system';
}

interface CommentState {
  comments: GlobalComment[];
}

export const useCommentStore = create<CommentState>(() => ({
  comments: [],
}));

let commentUnsubscribe: (() => void) | null = null;

function truncate(s: string, len: number) {
  return s.length > len ? s.slice(0, len) + '...' : s;
}

export const initCommentListener = (userEmail: string) => {
  if (commentUnsubscribe) {
    commentUnsubscribe();
    commentUnsubscribe = null;
  }

  let isInitialSnapshot = true;
  const prevCommentIds = new Set<string>();

  commentUnsubscribe = onSnapshot(collection(db, 'comments'), (snapshot) => {
    // 내 관련 requestId 목록
    const { requests } = useTodoRequestStore.getState();
    const myRequestIds = new Set(
      requests
        .filter(r => r.fromEmail === userEmail || r.toEmail === userEmail)
        .map(r => r.id)
    );

    const allComments = snapshot.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          requestId: data.requestId as string,
          author: data.author as string,
          authorName: data.authorName as string,
          content: data.content as string,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          type: (data.type || 'user') as 'user' | 'system',
        };
      })
      .filter(c => myRequestIds.has(c.requestId));

    // 토스트: 초기 스냅샷 제외, user 타입만, 본인 제외, 내 관련 요청만
    if (!isInitialSnapshot) {
      for (const c of allComments) {
        if (
          !prevCommentIds.has(c.id) &&
          c.type === 'user' &&
          c.author !== userEmail
        ) {
          const req = requests.find(r => r.id === c.requestId);
          const title = req ? truncate(req.title, 20) : '';
          useToastStore.getState().addToast({
            message: `${c.authorName}님이 댓글: ${title}`,
            type: 'info',
          });
        }
      }
    }

    // prevCommentIds 갱신
    prevCommentIds.clear();
    for (const c of allComments) {
      prevCommentIds.add(c.id);
    }
    isInitialSnapshot = false;

    useCommentStore.setState({ comments: allComments });
  });

  return () => {
    if (commentUnsubscribe) {
      commentUnsubscribe();
      commentUnsubscribe = null;
    }
  };
};
