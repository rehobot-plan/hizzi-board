'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUserStore, initUserListener } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { useTodoRequestStore, initRequestListener, TodoRequest } from '@/store/todoRequestStore';
import { usePostStore } from '@/store/postStore';
import { useToastStore } from '@/store/toastStore';
import RequestList from './RequestList';
import RequestSegment, { RequestSegmentType } from './RequestSegment';
import RequestFilterBar, { DoneStatusFilter } from './RequestFilterBar';
import RequestSortDropdown, { RequestSortKey, getDefaultRequestSort } from './RequestSortDropdown';
import RequestBulkBar from './RequestBulkBar';
import RequestDetailPopup from './RequestDetailPopup';

const ALL_DONE_STATUS: DoneStatusFilter[] = ['completed', 'rejected', 'cancelled'];

function classify(req: TodoRequest, myEmail: string, showAll: boolean): RequestSegmentType | null {
  // 4 평면 정의 (1-2 보정):
  //   받은 = toEmail=나 + pending  (admin showAll 시 모든 pending)
  //   보낸 = fromEmail=나 + pending  (admin showAll 시 발신자 시점 분리 의미 약함 → 비활성, pending은 received로 단일 흡수)
  //   진행 = (양쪽 OR admin) AND (accepted OR cancel_requested)
  //   완료 = (양쪽 OR admin) AND status ∈ {completed, rejected, cancelled}
  // 자연 규칙: pending은 본인 시점 분리(액션 주체 명확), accepted·cancel_requested·completed는 양쪽 합산(모니터링 시점).
  // cancel_requested는 accepted 위 중간 상태로 진행에 흡수 — approve/deny/withdraw 워크플로우 진입 보존.
  // admin showAll: 본인 시점 필터 우회. pending → received 단일 매핑 (sent는 자연 0건).
  if (showAll) {
    if (req.status === 'pending') return 'received';
    if (req.status === 'accepted' || req.status === 'cancel_requested') return 'in_progress';
    if (req.status === 'completed' || req.status === 'rejected' || req.status === 'cancelled') return 'done';
    return null;
  }
  const isTo = req.toEmail === myEmail;
  const isFrom = req.fromEmail === myEmail;
  if (req.status === 'pending') {
    if (isTo) return 'received';
    if (isFrom) return 'sent';
  }
  if ((req.status === 'accepted' || req.status === 'cancel_requested') && (isTo || isFrom)) {
    return 'in_progress';
  }
  if ((req.status === 'completed' || req.status === 'rejected' || req.status === 'cancelled') && (isTo || isFrom)) {
    return 'done';
  }
  return null;
}

function counterpartEmailFor(req: TodoRequest, myEmail: string, segment: RequestSegmentType, showAll: boolean): string {
  // admin showAll 모니터링 — 요청자(fromEmail) 시점이 자연. RequestList의 → To Y 추가 표시로 수신자 보강.
  if (showAll) return req.fromEmail;
  if (segment === 'sent') return req.toEmail;
  if (segment === 'received') return req.fromEmail;
  // in_progress·done — 양쪽 합산이라 viewer 기준 상대측 분기
  return req.toEmail === myEmail ? req.fromEmail : req.toEmail;
}

function compareBySort(a: TodoRequest, b: TodoRequest, key: RequestSortKey): number {
  const aDue = a.dueDate ? new Date(a.dueDate).getTime() : null;
  const bDue = b.dueDate ? new Date(b.dueDate).getTime() : null;
  switch (key) {
    case 'due-asc':
      if (aDue && bDue) return aDue - bDue;
      if (aDue) return -1;
      if (bDue) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    case 'newest':
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    case 'oldest':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case 'resolved-desc': {
      const aR = a.resolvedAt ? new Date(a.resolvedAt).getTime() : 0;
      const bR = b.resolvedAt ? new Date(b.resolvedAt).getTime() : 0;
      return bR - aR;
    }
    case 'resolved-asc': {
      const aR = a.resolvedAt ? new Date(a.resolvedAt).getTime() : 0;
      const bR = b.resolvedAt ? new Date(b.resolvedAt).getTime() : 0;
      return aR - bR;
    }
  }
}

export default function RequestView() {
  const { user } = useAuthStore();
  const { loading: userLoading, users } = useUserStore();
  const { requests, acceptRequest, rejectRequest, cancelRequest, completeRequest } = useTodoRequestStore();
  const { addPost } = usePostStore();

  const [segment, setSegment] = useState<RequestSegmentType>('received');
  const [sortKey, setSortKey] = useState<RequestSortKey>(getDefaultRequestSort('received'));
  const [counterpartFilter, setCounterpartFilter] = useState<Set<string>>(new Set());
  const [doneStatusFilter, setDoneStatusFilter] = useState<Set<DoneStatusFilter>>(new Set(ALL_DONE_STATUS));
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user?.email) {
      const cleanupUsers = initUserListener();
      const cleanupRequests = initRequestListener(user.email);
      return () => {
        cleanupUsers();
        cleanupRequests();
      };
    }
  }, [user?.email]);

  const myEmail = user?.email || '';
  const myName = user?.displayName || myEmail.split('@')[0] || '';
  const actor = { email: myEmail, name: myName };
  const isAdmin = user?.role === 'admin';
  const effectiveShowAll = isAdmin && showAll;

  const nameOf = (e: string) => users.find(u => u.email === e)?.name || e;

  // 세그먼트별 분류
  const bySegment = useMemo(() => {
    const buckets: Record<RequestSegmentType, TodoRequest[]> = {
      received: [], sent: [], in_progress: [], done: [],
    };
    for (const r of requests) {
      const seg = classify(r, myEmail, effectiveShowAll);
      if (seg) buckets[seg].push(r);
    }
    return buckets;
  }, [requests, myEmail, effectiveShowAll]);

  const counts: Record<RequestSegmentType, number> = {
    received: bySegment.received.length,
    sent: bySegment.sent.length,
    in_progress: bySegment.in_progress.length,
    done: bySegment.done.length,
  };

  // counterpart 옵션 — 현재 세그먼트 안에서 등장한 인원만
  const counterpartOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of bySegment[segment]) {
      set.add(counterpartEmailFor(r, myEmail, segment, effectiveShowAll));
    }
    return Array.from(set).sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bySegment, segment, myEmail, users, effectiveShowAll]);

  // 필터·정렬 적용된 표시 리스트
  const visible = useMemo(() => {
    let list = bySegment[segment];
    if (counterpartFilter.size > 0) {
      list = list.filter(r => counterpartFilter.has(counterpartEmailFor(r, myEmail, segment, effectiveShowAll)));
    }
    if (segment === 'done' && doneStatusFilter.size > 0 && doneStatusFilter.size < ALL_DONE_STATUS.length) {
      list = list.filter(r => doneStatusFilter.has(r.status as DoneStatusFilter));
    }
    return [...list].sort((a, b) => compareBySort(a, b, sortKey));
  }, [bySegment, segment, counterpartFilter, doneStatusFilter, sortKey, myEmail, effectiveShowAll]);

  // segment-aware selectable predicate — RequestList prop + auto-prune 공유.
  // admin showAll: 모니터링 전용, 일괄 액션 차단. in_progress: 일괄 완료 가능 항목(accepted+담당자)만. done: bulk 액션 없음. 그 외(received/sent): 전체 selectable.
  const selectablePredicate = useMemo(() => {
    if (effectiveShowAll) return () => false;
    if (segment === 'in_progress') return (r: TodoRequest) => r.status === 'accepted' && r.toEmail === myEmail;
    if (segment === 'done') return () => false;
    return undefined;
  }, [segment, myEmail, effectiveShowAll]);

  // counterpartFilter auto-prune — counterpartOptions에서 사라진 stale 필터 자동 해제 (Codex P2 8-1).
  // realtime status 전환으로 마지막 매칭 항목이 빠지면 옵션 0건이 되고 RequestFilterBar 미렌더 → 사용자가 필터 클리어 못하는 상황 회피.
  useEffect(() => {
    setCounterpartFilter(prev => {
      if (prev.size === 0) return prev;
      const optionsSet = new Set(counterpartOptions);
      const next = new Set<string>();
      prev.forEach(email => { if (optionsSet.has(email)) next.add(email); });
      return next.size === prev.size ? prev : next;
    });
  }, [counterpartOptions]);

  // visible·selectable 변화 시 selection auto-prune — BulkBar count와 실제 처리 카운트 일관.
  // realtime status 전환(예: accepted → cancel_requested)으로 selectable false가 된 항목도 자동 해제 (Codex P2 4·5차).
  useEffect(() => {
    setSelectedIds(prev => {
      if (prev.size === 0) return prev;
      const visibleSet = new Set(visible.map(r => r.id));
      const reqMap = new Map(requests.map(r => [r.id, r]));
      const next = new Set<string>();
      prev.forEach(id => {
        if (!visibleSet.has(id)) return;
        const req = reqMap.get(id);
        if (!req) return;
        if (selectablePredicate && !selectablePredicate(req)) return;
        next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [visible, requests, selectablePredicate]);

  const onChangeSegment = (s: RequestSegmentType) => {
    setSegment(s);
    setSortKey(getDefaultRequestSort(s));
    setCounterpartFilter(new Set());
    if (s === 'done') setDoneStatusFilter(new Set(ALL_DONE_STATUS));
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const onToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onItemClick = (id: string) => setDetailId(id);

  const cancelBulk = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  // 필터·실시간 업데이트로 visible 밖에 있는 selectedIds는 mutate 금지 (Codex P1 재리뷰).
  // 각 핸들러는 도메인 status·party 가드도 함께 적용 — 잘못된 status 전환 차단.
  const eligibleSelected = (predicate: (req: TodoRequest) => boolean): TodoRequest[] => {
    const visibleSet = new Set(visible.map(r => r.id));
    return Array.from(selectedIds)
      .filter(id => visibleSet.has(id))
      .map(id => requests.find(r => r.id === id))
      .filter((r): r is TodoRequest => !!r && predicate(r));
  };

  const onAcceptAll = async () => {
    const targets = eligibleSelected(r => r.status === 'pending' && r.toEmail === myEmail);
    for (const r of targets) {
      await acceptRequest(r.id, addPost, myName);
    }
    cancelBulk();
  };

  const onRejectAll = async () => {
    const targets = eligibleSelected(r => r.status === 'pending' && r.toEmail === myEmail);
    if (targets.length === 0) {
      cancelBulk();
      return;
    }
    const reason = window.prompt('일괄 반려 사유를 입력하세요 (모두 동일 사유로 처리됩니다)');
    if (reason === null) return;
    for (const r of targets) {
      await rejectRequest(r.id, reason, actor);
    }
    cancelBulk();
  };

  const onCancelAll = async () => {
    const targets = eligibleSelected(r => r.status === 'pending' && r.fromEmail === myEmail);
    for (const r of targets) {
      await cancelRequest(r.id, actor);
    }
    cancelBulk();
  };

  const onCompleteAll = async () => {
    // in_progress 양쪽 합산 + cancel_requested 흡수라 status·party 가드 필수.
    // completeRequest 도메인은 담당자(toEmail) + status=accepted 단일 전환.
    const targets = eligibleSelected(r => r.status === 'accepted' && r.toEmail === myEmail);
    if (targets.length === 0) {
      // 일괄 완료 가능 항목 0건 — silent no-op 회피 (Codex P2 재리뷰).
      useToastStore.getState().addToast({ message: '완료 처리할 수 있는 항목이 없습니다 (담당자만 accepted 상태에서 가능)', type: 'info' });
      cancelBulk();
      return;
    }
    for (const r of targets) {
      await completeRequest(r.id, actor);
    }
    cancelBulk();
  };

  const selectedRequest = detailId ? requests.find(r => r.id === detailId) || null : null;

  if (userLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#2C1810]">요청 관리</h1>
        <button
          onClick={() => {
            setBulkMode(v => !v);
            setSelectedIds(new Set());
          }}
          data-testid="request-bulk-toggle"
          className="text-xs px-3 py-1 rounded border transition-all"
          style={{
            background: bulkMode ? '#5C1F1F' : 'transparent',
            color: bulkMode ? '#F5E6E0' : '#9E8880',
            borderColor: bulkMode ? '#5C1F1F' : '#EDE5DC',
          }}
        >
          {bulkMode ? '선택 해제' : '선택 모드'}
        </button>
      </div>

      <RequestSegment
        segment={segment}
        onChange={onChangeSegment}
        counts={counts}
        isAdmin={isAdmin}
        showAll={showAll}
        onShowAllChange={(v) => {
          setShowAll(v);
          // counterpart 의미(상대측 vs fromEmail) 전환되므로 stale 필터 리셋 (Codex P2 8-2).
          setCounterpartFilter(new Set());
          setSelectedIds(new Set());
          setBulkMode(false);
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <RequestFilterBar
          segment={segment}
          counterpartOptions={counterpartOptions}
          counterpartActive={counterpartFilter}
          onCounterpartChange={setCounterpartFilter}
          doneStatus={doneStatusFilter}
          onDoneStatusChange={setDoneStatusFilter}
          nameOf={nameOf}
        />
        <RequestSortDropdown segment={segment} sortKey={sortKey} onChange={setSortKey} />
      </div>

      <RequestList
        segment={segment}
        requests={visible}
        bulkMode={bulkMode}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        onItemClick={onItemClick}
        nameOf={nameOf}
        myEmail={myEmail}
        isSelectable={selectablePredicate}
        showAdminTarget={effectiveShowAll}
      />

      {bulkMode && (
        <RequestBulkBar
          segment={segment}
          count={selectedIds.size}
          onAcceptAll={segment === 'received' ? onAcceptAll : undefined}
          onRejectAll={segment === 'received' ? onRejectAll : undefined}
          onCancelAll={segment === 'sent' ? onCancelAll : undefined}
          onCompleteAll={segment === 'in_progress' ? onCompleteAll : undefined}
          onCancel={cancelBulk}
        />
      )}

      <RequestDetailPopup
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
