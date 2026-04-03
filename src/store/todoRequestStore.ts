'use client';

import { create } from 'zustand';
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface TodoRequest {
  id: string;
  fromEmail: string;
  fromPanelId: string;
  toEmail: string;
  toPanelId: string;
  title: string;
  content: string;
  dueDate?: string;
  visibleTo: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  rejectReason?: string;
  createdAt: Date;
  teamLabel?: string;
  resolvedAt?: Date | null;
}

interface TodoRequestState {
  requests: TodoRequest[];
  loading: boolean;
  addRequest: (data: Omit<TodoRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  acceptRequest: (
    requestId: string,
    addPostFn: (postData: any) => Promise<void>,
    authorName: string,
  ) => Promise<void>;
  rejectRequest: (requestId: string, reason: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
}

export const useTodoRequestStore = create<TodoRequestState>((set) => ({
  requests: [],
  loading: true,

  addRequest: async (data) => {
    try {
      const docData: any = {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      // undefined 필드 제거 (Firestore 저장 불가)
      Object.keys(docData).forEach(key => {
        if (docData[key] === undefined) delete docData[key];
      });
      await addDoc(collection(db, 'todoRequests'), docData);
    } catch (e) {
      console.error('Error adding request:', e);
    }
  },

  acceptRequest: async (requestId, addPostFn, authorName) => {
    try {
      const req = useTodoRequestStore.getState().requests.find(r => r.id === requestId);
      if (!req) return;

      // 할일 추가
      await addPostFn({
        panelId: req.toPanelId,
        content: req.title,
        author: req.toEmail,
        category: '할일',
        visibleTo: req.visibleTo,
        taskType: 'work' as const,
        requestId,
        requestFrom: req.fromEmail,
        requestTitle: req.title,
        requestContent: req.content,
        requestDueDate: req.dueDate || null,
      });

      // 기한 있으면 달력에 자동 등록
      if (req.dueDate) {
        await addDoc(collection(db, 'calendarEvents'), {
          title: req.teamLabel ? `[Team] ${req.title} — ${req.teamLabel}` : `[요청] ${req.title}`,
          startDate: req.dueDate,
          endDate: req.dueDate,
          authorId: req.toEmail,
          authorName,
          color: '#C17B6B',
          createdAt: new Date(),
          repeat: { type: 'none' },
        });
      }

      await updateDoc(doc(db, 'todoRequests', requestId), {
        status: 'accepted',
        resolvedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Error accepting request:', e);
    }
  },

  rejectRequest: async (requestId, reason) => {
    try {
      await updateDoc(doc(db, 'todoRequests', requestId), {
        status: 'rejected',
        rejectReason: reason,
        resolvedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Error rejecting request:', e);
    }
  },

  cancelRequest: async (requestId) => {
    try {
      await updateDoc(doc(db, 'todoRequests', requestId), {
        status: 'cancelled',
        resolvedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Error cancelling request:', e);
    }
  },
}));

let requestUnsubscribe: (() => void) | null = null;

export const initRequestListener = (userEmail: string) => {
  if (requestUnsubscribe) {
    requestUnsubscribe();
    requestUnsubscribe = null;
  }

  requestUnsubscribe = onSnapshot(collection(db, 'todoRequests'), (snapshot) => {
    const requests = snapshot.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : null,
        } as TodoRequest;
      })
      .filter(r => {
        // 보낸 사람이거나 받는 사람이면 항상 표시
        if (r.fromEmail === userEmail || r.toEmail === userEmail) return true;
        // visibleTo에 포함된 경우만 표시
        if (r.visibleTo && r.visibleTo.length > 0 && r.visibleTo.includes(userEmail)) return true;
        return false;
      });
    useTodoRequestStore.setState({ requests, loading: false });
  });

  return () => {
    if (requestUnsubscribe) {
      requestUnsubscribe();
      requestUnsubscribe = null;
    }
  };
};
