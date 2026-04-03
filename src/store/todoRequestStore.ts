'use client';

import { create } from 'zustand';
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp, query, where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface TodoRequest {
  id: string;
  fromEmail: string;
  fromPanelId: string;
  toEmail: string;
  toPanelId: string;
  content: string;
  memo?: string;
  visibleTo: string[];
  status: 'pending' | 'accepted' | 'rejected';
  rejectReason?: string;
  createdAt: Date;
  resolvedAt?: Date | null;
}

interface TodoRequestState {
  requests: TodoRequest[];
  loading: boolean;
  addRequest: (data: Omit<TodoRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  acceptRequest: (requestId: string, addPostFn: (postData: any) => Promise<void>) => Promise<void>;
  rejectRequest: (requestId: string, reason: string) => Promise<void>;
}

export const useTodoRequestStore = create<TodoRequestState>((set) => ({
  requests: [],
  loading: true,
  addRequest: async (data) => {
    try {
      await addDoc(collection(db, 'todoRequests'), {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Error adding request:', e);
    }
  },
  acceptRequest: async (requestId, addPostFn) => {
    try {
      const req = useTodoRequestStore.getState().requests.find(r => r.id === requestId);
      if (!req) return;
      await addPostFn({
        panelId: req.toPanelId,
        content: req.content,
        author: req.toEmail,
        category: '할일',
        visibleTo: req.visibleTo,
        taskType: 'work',
        requestId,
        requestFrom: req.fromEmail,
      });
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
}));

let requestUnsubscribe: (() => void) | null = null;

export const initRequestListener = (userEmail: string) => {
  if (requestUnsubscribe) {
    requestUnsubscribe();
    requestUnsubscribe = null;
  }

  const q = collection(db, 'todoRequests');
  requestUnsubscribe = onSnapshot(q, (snapshot) => {
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
      .filter(r =>
        r.fromEmail === userEmail ||
        r.toEmail === userEmail ||
        !r.visibleTo || r.visibleTo.length === 0 ||
        r.visibleTo.includes(userEmail)
      );
    useTodoRequestStore.setState({ requests, loading: false });
  });

  return () => {
    if (requestUnsubscribe) {
      requestUnsubscribe();
      requestUnsubscribe = null;
    }
  };
};
