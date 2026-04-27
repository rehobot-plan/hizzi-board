'use client';

import { create } from 'zustand';
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp, writeBatch, deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToastStore } from '@/store/toastStore';
import { mapRequestVisibilityToCalendarEvent } from '@/lib/calendar-helpers';

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
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'cancel_requested';
  rejectReason?: string;
  cancelRequestedAt?: Date | null;
  cancelRequestedBy?: string;
  seenAt?: { [userEmail: string]: Date };
  createdAt: Date;
  teamLabel?: string;
  teamRequestId?: string;
  resolvedAt?: Date | null;
}

interface NewTodoRequestDoc {
  fromEmail: string;
  fromPanelId: string;
  toEmail: string;
  toPanelId: string;
  title: string;
  content: string;
  visibleTo: string[];
  status: 'pending';
  createdAt: ReturnType<typeof serverTimestamp>;
  dueDate?: string;
  teamLabel?: string;
  teamRequestId?: string;
}

interface AddPostData {
  panelId: string;
  content: string;
  author: string;
  category: string;
  visibleTo: string[];
  taskType: 'work' | 'personal';
  requestId: string;
  requestFrom: string;
  requestTitle: string;
  requestContent: string;
  requestDueDate: string | null;
}

export interface ActorInfo {
  email: string;
  name: string;
}

interface TodoRequestState {
  requests: TodoRequest[];
  loading: boolean;
  addRequest: (data: Omit<TodoRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  acceptRequest: (
    requestId: string,
    addPostFn: (postData: AddPostData) => Promise<void>,
    authorName: string,
  ) => Promise<void>;
  rejectRequest: (requestId: string, reason: string, actor: ActorInfo) => Promise<void>;
  cancelRequest: (requestId: string, actor: ActorInfo) => Promise<void>;
  completeRequest: (requestId: string, actor: ActorInfo) => Promise<void>;
  reactivateRequest: (requestId: string, actor: ActorInfo) => Promise<void>;
  requestCancel: (requestId: string, actor: ActorInfo) => Promise<void>;
  approveCancellation: (requestId: string, actor: ActorInfo) => Promise<void>;
  denyCancellation: (requestId: string, actor: ActorInfo) => Promise<void>;
  withdrawCancelRequest: (requestId: string, actor: ActorInfo) => Promise<void>;
  updateRequest: (requestId: string, data: { title?: string; content?: string; dueDate?: string; visibleTo?: string[] }) => Promise<void>;
}

const requestErrorMessage = '요청 처리에 실패했습니다. 다시 시도해주세요.';

function systemComment(requestId: string, actor: ActorInfo, event: string, reason?: string) {
  return {
    requestId,
    author: actor.email,
    authorName: actor.name,
    content: '',
    type: 'system',
    event,
    ...(reason ? { eventMeta: { reason } } : {}),
    createdAt: serverTimestamp(),
  };
}

export const useTodoRequestStore = create<TodoRequestState>((set) => ({
  requests: [],
  loading: true,

  addRequest: async (data) => {
    try {
      const docData: NewTodoRequestDoc = {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      const mutableDocData = docData as Partial<NewTodoRequestDoc>;
      (Object.keys(mutableDocData) as Array<keyof NewTodoRequestDoc>).forEach((key) => {
        if (mutableDocData[key] === undefined) delete mutableDocData[key];
      });
      await addDoc(collection(db, 'todoRequests'), mutableDocData);
    } catch (e) {
      console.error('Error adding request:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  acceptRequest: async (requestId, addPostFn, authorName) => {
    try {
      const req = useTodoRequestStore.getState().requests.find((r) => r.id === requestId);
      if (!req) return;

      await addPostFn({
        panelId: req.toPanelId,
        content: req.title,
        author: req.toEmail,
        category: '할일',
        visibleTo: req.visibleTo,
        taskType: 'work',
        requestId,
        requestFrom: req.fromEmail,
        requestTitle: req.title,
        requestContent: req.content,
        requestDueDate: req.dueDate || null,
      });

      if (req.dueDate) {
        let shouldAddCalendar = true;
        if (req.teamRequestId) {
          const { getDocs, query, collection: col, where } = await import('firebase/firestore');
          const existing = await getDocs(
            query(col(db, 'calendarEvents'), where('teamRequestId', '==', req.teamRequestId))
          );
          if (!existing.empty) shouldAddCalendar = false;
        }
        if (shouldAddCalendar) {
          const assigneeNames = req.teamLabel || authorName;
          const { visibility, visibleTo } = mapRequestVisibilityToCalendarEvent(
            req.visibleTo,
            req.toEmail,
            req.fromEmail,
          );
          // #18 2단계 — 담당자(req.toEmail)를 이벤트 소유자로 기록. authorId(uid)는 fallback으로 생략(3단계 마이그레이션에서 채움).
          await addDoc(collection(db, 'calendarEvents'), {
            title: req.teamLabel ? `[Team] ${req.title}` : `[요청] ${req.title}`,
            startDate: req.dueDate,
            endDate: req.dueDate,
            authorEmail: req.toEmail,
            authorName: req.teamLabel ? `담당: ${assigneeNames}` : authorName,
            color: '#993556',
            createdAt: new Date(),
            updatedAt: new Date(),
            repeat: { type: 'none' },
            taskType: 'work',
            visibility,
            visibleTo,
            requestId,
            requestFrom: req.fromEmail,
            requestTitle: req.title,
            teamRequestId: req.teamRequestId || null,
          });
        }
      }

      const batch = writeBatch(db);
      batch.update(doc(db, 'todoRequests', requestId), {
        status: 'accepted',
        resolvedAt: serverTimestamp(),
      });
      const commentRef = doc(collection(db, 'comments'));
      batch.set(commentRef, systemComment(requestId, { email: req.toEmail, name: authorName }, 'accepted'));
      await batch.commit();
    } catch (e) {
      console.error('Error accepting request:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  rejectRequest: async (requestId, reason, actor) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'todoRequests', requestId), {
        status: 'rejected',
        rejectReason: reason,
        resolvedAt: serverTimestamp(),
      });
      const commentRef = doc(collection(db, 'comments'));
      batch.set(commentRef, systemComment(requestId, actor, 'rejected', reason));
      await batch.commit();
    } catch (e) {
      console.error('Error rejecting request:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  cancelRequest: async (requestId, actor) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'todoRequests', requestId), {
        status: 'cancelled',
        resolvedAt: serverTimestamp(),
      });
      const commentRef = doc(collection(db, 'comments'));
      batch.set(commentRef, systemComment(requestId, actor, 'cancelled'));
      await batch.commit();
    } catch (e) {
      console.error('Error cancelling request:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  completeRequest: async (requestId, actor) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'todoRequests', requestId), {
        status: 'completed',
        resolvedAt: serverTimestamp(),
      });
      const commentRef = doc(collection(db, 'comments'));
      batch.set(commentRef, systemComment(requestId, actor, 'completed'));
      await batch.commit();
    } catch (e) {
      console.error('Error completing request:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  reactivateRequest: async (requestId, actor) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'todoRequests', requestId), {
        status: 'accepted',
        resolvedAt: null,
      });
      const commentRef = doc(collection(db, 'comments'));
      batch.set(commentRef, systemComment(requestId, actor, 'reactivated'));
      await batch.commit();
    } catch (e) {
      console.error('Error reactivating request:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  requestCancel: async (requestId, actor) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'todoRequests', requestId), {
        status: 'cancel_requested',
        cancelRequestedAt: serverTimestamp(),
        cancelRequestedBy: actor.email,
      });
      const commentRef = doc(collection(db, 'comments'));
      batch.set(commentRef, systemComment(requestId, actor, 'cancel_requested'));
      await batch.commit();
    } catch (e) {
      console.error('Error requesting cancellation:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  approveCancellation: async (requestId, actor) => {
    try {
      const req = useTodoRequestStore.getState().requests.find((r) => r.id === requestId);
      const batch = writeBatch(db);
      batch.update(doc(db, 'todoRequests', requestId), {
        status: 'cancelled',
        resolvedAt: serverTimestamp(),
      });
      const commentRef = doc(collection(db, 'comments'));
      batch.set(commentRef, systemComment(requestId, actor, 'cancel_approved'));

      // flows.md 연쇄: 관련 posts 존재 시 soft delete
      if (req) {
        const { getDocs, query, collection: col, where } = await import('firebase/firestore');
        const postsSnap = await getDocs(
          query(col(db, 'posts'), where('requestId', '==', requestId))
        );
        postsSnap.docs.forEach(d => {
          batch.update(d.ref, { deleted: true, deletedAt: new Date() });
        });
      }

      await batch.commit();
    } catch (e) {
      console.error('Error approving cancellation:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  denyCancellation: async (requestId, actor) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'todoRequests', requestId), {
        status: 'accepted',
        cancelRequestedAt: deleteField(),
        cancelRequestedBy: deleteField(),
      });
      const commentRef = doc(collection(db, 'comments'));
      batch.set(commentRef, systemComment(requestId, actor, 'cancel_denied'));
      await batch.commit();
    } catch (e) {
      console.error('Error denying cancellation:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  withdrawCancelRequest: async (requestId, actor) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'todoRequests', requestId), {
        status: 'accepted',
        cancelRequestedAt: deleteField(),
        cancelRequestedBy: deleteField(),
      });
      const commentRef = doc(collection(db, 'comments'));
      batch.set(commentRef, systemComment(requestId, actor, 'cancel_withdrawn'));
      await batch.commit();
    } catch (e) {
      console.error('Error withdrawing cancel request:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
    }
  },

  updateRequest: async (requestId, data) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.visibleTo !== undefined) updateData.visibleTo = data.visibleTo;
      await updateDoc(doc(db, 'todoRequests', requestId), updateData);
    } catch (e) {
      console.error('Error updating request:', e);
      useToastStore.getState().addToast({ message: requestErrorMessage, type: 'error' });
      throw e;
    }
  },
}));

let requestUnsubscribe: (() => void) | null = null;

const STATUS_TOAST: Record<string, { message: (name: string) => string; type: 'info' | 'success' }> = {
  accepted: { message: (n) => `${n}님이 수락했습니다`, type: 'info' },
  rejected: { message: (n) => `${n}님이 반려했습니다`, type: 'info' },
  completed: { message: (n) => `${n}님이 완료 처리했습니다`, type: 'success' },
  cancelled: { message: (n) => `${n}님이 취소를 승인했습니다`, type: 'info' },
  cancel_requested: { message: (n) => `${n}님이 취소를 요청했습니다`, type: 'info' },
};

function truncate(s: string, len: number) {
  return s.length > len ? s.slice(0, len) + '...' : s;
}

export const initRequestListener = (userEmail: string) => {
  if (requestUnsubscribe) {
    requestUnsubscribe();
    requestUnsubscribe = null;
  }

  let isInitialSnapshot = true;
  const prevStatuses = new Map<string, string>();

  requestUnsubscribe = onSnapshot(collection(db, 'todoRequests'), (snapshot) => {
    const requests = snapshot.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : null,
          cancelRequestedAt: data.cancelRequestedAt?.toDate ? data.cancelRequestedAt.toDate() : null,
          cancelRequestedBy: data.cancelRequestedBy || undefined,
          seenAt: data.seenAt || undefined,
        } as TodoRequest;
      })
      // admin 이메일은 본인 시점 필터 우회 — 개발 감독·전체 관리 도구 (master.md 7).
      .filter((r) => userEmail === 'admin@company.com' || r.fromEmail === userEmail || r.toEmail === userEmail);

    // 상태 변화 토스트 (초기 스냅샷 제외).
    // admin@company.com은 모든 요청 적재(monitoring)지만 토스트는 본인 관련만 — noisy global notifications 회피 (Codex P2 7-2).
    if (!isInitialSnapshot) {
      for (const req of requests) {
        const isMine = req.fromEmail === userEmail || req.toEmail === userEmail;
        if (!isMine) continue;
        const prev = prevStatuses.get(req.id);
        if (prev && prev !== req.status) {
          // 본인 액션 제외: cancel_requested는 cancelRequestedBy, 그 외는 toEmail(수락/반려/완료 = 담당자 액션)
          let actorEmail: string | undefined;
          let actorLabel = '';
          if (req.status === 'cancel_requested') {
            actorEmail = req.cancelRequestedBy || req.fromEmail;
            actorLabel = req.fromEmail === userEmail ? '' : actorEmail;
          } else if (req.status === 'accepted' && prev === 'cancel_requested') {
            // cancel_denied 또는 cancel_withdrawn
            actorEmail = req.toEmail === userEmail ? undefined : req.toEmail;
            actorLabel = actorEmail || '';
          } else {
            actorEmail = req.toEmail === userEmail ? req.fromEmail : req.toEmail;
            actorLabel = actorEmail;
          }

          if (actorEmail && actorEmail !== userEmail) {
            const toast = STATUS_TOAST[req.status];
            if (toast) {
              const name = actorLabel.split('@')[0] || actorLabel;
              useToastStore.getState().addToast({
                message: `${toast.message(name)}: ${truncate(req.title, 20)}`,
                type: toast.type,
              });
            }
          }
        }
      }
    }

    // prevStatuses 갱신
    prevStatuses.clear();
    for (const req of requests) {
      prevStatuses.set(req.id, req.status);
    }
    isInitialSnapshot = false;

    useTodoRequestStore.setState({ requests, loading: false });
  });

  return () => {
    if (requestUnsubscribe) {
      requestUnsubscribe();
      requestUnsubscribe = null;
    }
  };
};
