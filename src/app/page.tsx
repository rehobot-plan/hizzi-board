'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usePanelStore } from '@/store/panelStore';
import { useUserStore } from '@/store/userStore';
import { useToastStore } from '@/store/toastStore';
import { initPostListener } from '@/store/postStore';
import Panel from '@/components/Panel';
import Calendar from '@/components/Calendar';
import NoticeArea from '@/components/NoticeArea';
import LeaveManager from '@/components/LeaveManager';

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuthStore();
  const { panels, loading: panelLoading, updatePanel, addPanel } = usePanelStore();
  const { users, loading: userLoading, deleteUser, updateUserPanel } = useUserStore();
  const { toasts } = useToastStore();
  const [adminMode, setAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'users' | 'leave'>('users');
  const [deleteError, setDeleteError] = useState('');
  const [showAddPanelModal, setShowAddPanelModal] = useState(false);
  const [newPanelName, setNewPanelName] = useState('');
  const [draggedPanelId, setDraggedPanelId] = useState<string | null>(null);
  const router = useRouter();

  const getUserPanel = (email: string) => panels.find((p) => p.ownerEmail === email);

  const isUnassignedUser = (u: { role?: string; email: string; panelId?: string }) => {
    if (u.role === 'admin') return false;
    const linkedByOwner = !!getUserPanel(u.email);
    const linkedByPanelId = !!u.panelId;
    return !linkedByOwner && !linkedByPanelId;
  };

  const sortedUsers = users
    .slice()
    .sort((a, b) => {
      const aUnassigned = isUnassignedUser(a);
      const bUnassigned = isUnassignedUser(b);
      if (aUnassigned !== bUnassigned) return aUnassigned ? -1 : 1;
      return a.name.localeCompare(b.name, 'ko');
    });

  const unassignedCount = users.filter((u) => isUnassignedUser(u)).length;

  useEffect(() => {
    const cleanup = initPostListener();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleAssignPanel = async (targetUserId: string, targetEmail: string, nextPanelId: string) => {
    try {
      const targetUser = users.find((u) => u.id === targetUserId);
      if (!targetUser) return;

      const prevPanel = panels.find((p) => p.ownerEmail === targetEmail);

      if (nextPanelId === '') {
        if (prevPanel) {
          await updatePanel(prevPanel.id, { ownerEmail: null });
        }
        await updateUserPanel(targetUserId, null);
        return;
      }

      const nextPanel = panels.find((p) => p.id === nextPanelId);
      if (!nextPanel) return;

      const occupiedByRealUser = !!(nextPanel.ownerEmail && users.some((u) => u.email === nextPanel.ownerEmail));

      // 이미 다른 사용자가 배정된 패널은 선택 불가
      if (occupiedByRealUser && nextPanel.ownerEmail !== targetEmail) {
        return;
      }

      if (prevPanel && prevPanel.id !== nextPanel.id) {
        await updatePanel(prevPanel.id, { ownerEmail: null });
      }

      await updatePanel(nextPanel.id, { ownerEmail: targetEmail });
      await updateUserPanel(targetUserId, nextPanel.id);
    } catch (err) {
      console.error(err);
      setDeleteError('패널 배정 저장 중 오류가 발생했습니다.');
    }
  };

  const handlePanelDragStart = (e: React.DragEvent<HTMLDivElement>, panelId: string) => {
    setDraggedPanelId(panelId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', panelId);
  };
  const handlePanelDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handlePanelDrop = async (e: React.DragEvent<HTMLDivElement>, targetPanelId: string) => {
    e.preventDefault();
    if (!draggedPanelId || draggedPanelId === targetPanelId) return;
    const draggedPanel = panels.find(p => p.id === draggedPanelId);
    const targetPanel = panels.find(p => p.id === targetPanelId);
    if (!draggedPanel || !targetPanel) return;
    await updatePanel(draggedPanel.id, { position: targetPanel.position });
    await updatePanel(targetPanel.id, { position: draggedPanel.position });
    setDraggedPanelId(null);
  };

  const handleAddPanel = async () => {
    const trimmed = newPanelName.trim();
    if (!trimmed) return;
    await addPanel(trimmed);
    setNewPanelName('');
    setShowAddPanelModal(false);
  };

  // 사이드바 메뉴
  // 사이드바 메뉴 제거, 브랜드명/사용자 정보만 유지

  // 모바일 패널 오버레이 상태
  const [mobilePanelId, setMobilePanelId] = useState<string | null>(null);

  if (authLoading || panelLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDF8F4]">Loading...</div>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#FDF8F4]">
      {/* 사이드바: 모바일에서 숨김 */}
      <aside
        className="flex-col justify-between min-h-screen w-[200px] bg-[#5C1F1F] py-8 px-6 hidden md:flex"
      >
        <div>
          <div className="mb-12 select-none">
            <span className="block text-white text-2xl font-extrabold tracking-[0.15em] uppercase text-center" style={{ letterSpacing: '0.15em' }}>HIZZI BOARD</span>
          </div>
        </div>
        {/* 아바타+이름 */}
        <div className="flex items-center gap-3 mt-8 px-2">
          <div className="w-9 h-9 rounded-full bg-[#C17B6B] flex items-center justify-center text-white font-bold text-lg uppercase">
            {user?.displayName?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div className="text-white text-xs font-medium truncate max-w-[100px]">
            {user?.displayName || user?.email}
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* 헤더 */}
        <header className="flex items-center px-8 border-b border-[#EDE5DC] bg-transparent py-6 min-h-[72px]">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <button
                onClick={() => setAdminMode((prev) => !prev)}
                className="px-3 py-1 border border-[#C17B6B] text-[#C17B6B] bg-white rounded outline-none hover:bg-[#FDF8F4] text-xs uppercase tracking-widest transition"
              >
                {adminMode ? '관리 모드 종료' : '관리 모드'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 border border-[#C17B6B] text-[#C17B6B] bg-white rounded outline-none hover:bg-[#FDF8F4] text-xs uppercase tracking-widest transition"
            >
              로그아웃
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-2 md:px-8 py-8">
          {adminMode && (
            <div className="border border-[#EDE5DC] bg-white rounded p-4 mb-4">
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setAdminTab('users')}
                  className="px-3 py-1 text-xs border"
                  style={{
                    borderColor: adminTab === 'users' ? '#2C1810' : '#EDE5DC',
                    color: adminTab === 'users' ? '#2C1810' : '#9E8880',
                    background: adminTab === 'users' ? '#FDF8F4' : '#fff',
                  }}
                >
                  사용자 관리
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('leave')}
                  className="px-3 py-1 text-xs border"
                  style={{
                    borderColor: adminTab === 'leave' ? '#2C1810' : '#EDE5DC',
                    color: adminTab === 'leave' ? '#2C1810' : '#9E8880',
                    background: adminTab === 'leave' ? '#FDF8F4' : '#fff',
                  }}
                >
                  연차 관리
                </button>
              </div>

              {adminTab === 'users' ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-[#2C1810]">관리자 - 사용자 관리</h2>
                      <span className="text-xs text-[#C17B6B]">미배정 {unassignedCount}명</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddPanelModal(true)}
                      className="px-3 py-1 text-xs border border-[#2C1810] text-[#2C1810] bg-[#FDF8F4]"
                    >
                      + 패널 추가
                    </button>
                  </div>
                  {deleteError && <p className="text-sm text-red-600 mb-2">{deleteError}</p>}
                  {userLoading ? (
                    <p>로딩 중...</p>
                  ) : (
                    <div className="space-y-2">
                      {sortedUsers.map((u) => {
                        const userPanel = getUserPanel(u.email);
                        const isCurrentAdmin = user?.email === u.email && user?.role === 'admin';
                        const isUnassigned = isUnassignedUser(u);
                        return (
                          <div key={u.id} className="flex justify-between items-center bg-white p-2 border rounded gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium flex items-center gap-2">
                                <span>{u.name} ({u.email})</span>
                                {isUnassigned && (
                                  <span className="text-[10px] px-2 py-0.5 border" style={{ color: '#C17B6B', borderColor: '#C17B6B', background: '#FFF5F2' }}>
                                    패널 미배정
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">담당 패널: {userPanel?.name || '없음'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {u.role === 'admin' ? (
                                <span className="text-xs text-[#9E8880] px-2">관리자 계정</span>
                              ) : (
                                <select
                                  value={userPanel?.id || ''}
                                  onChange={(e) => handleAssignPanel(u.id, u.email, e.target.value)}
                                  className="border border-[#EDE5DC] px-2 py-1 text-xs bg-white min-w-[140px]"
                                >
                                  <option value="">패널 없음</option>
                                  {panels
                                    .slice()
                                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                                    .map((p) => {
                                      const hasRealOwner = !!(p.ownerEmail && users.some((us) => us.email === p.ownerEmail));
                                      const occupiedByOther = hasRealOwner && p.ownerEmail !== u.email;
                                      return (
                                        <option key={p.id} value={p.id} disabled={occupiedByOther}>
                                          {p.name}{occupiedByOther ? ' (배정됨)' : ''}
                                        </option>
                                      );
                                    })}
                                </select>
                              )}
                              <button
                                disabled={isCurrentAdmin}
                                onClick={async () => {
                                  if (isCurrentAdmin) return;
                                  try {
                                    const panel = panels.find((p) => p.ownerEmail === u.email);
                                    if (panel) await updatePanel(panel.id, { ownerEmail: null });
                                    await updateUserPanel(u.id, null);
                                    await deleteUser(u.id);
                                  } catch (err: any) {
                                    console.error(err);
                                    setDeleteError('삭제 중 오류가 발생했습니다.');
                                  }
                                }}
                                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <LeaveManager />
              )}
            </div>
          )}

          {/* 데스크탑: 3x2 그리드, 모바일: 3열 미니카드 */}
          <div>
            {/* 데스크탑 */}
            <div className="hidden md:grid grid-cols-3 gap-6 auto-rows-fr">
              {panels
                .slice()
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((panel) => (
                  <div
                    key={panel.id}
                    draggable
                    onDragStart={e => handlePanelDragStart(e, panel.id)}
                    onDragOver={handlePanelDragOver}
                    onDrop={e => handlePanelDrop(e, panel.id)}
                    className="h-full"
                  >
                    <Panel id={panel.id} name={panel.name} ownerEmail={panel.ownerEmail} position={panel.position} />
                  </div>
                ))}
            </div>
            {/* 모바일: 3열 미니카드 */}
            <div className="grid grid-cols-3 gap-2 md:hidden">
              {panels
                .slice()
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((panel) => (
                  <button
                    key={panel.id}
                    className="h-20 bg-white border border-[#EDE5DC] rounded flex items-center justify-center text-xs font-bold text-[#2C1810] overflow-hidden"
                    onClick={() => setMobilePanelId(panel.id)}
                  >
                    {panel.name}
                  </button>
                ))}
            </div>
            {/* 모바일 오버레이 */}
            {mobilePanelId && (() => {
              const activePanel = panels.find(p => p.id === mobilePanelId);
              if (!activePanel) return null;
              return (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center md:hidden" onClick={() => setMobilePanelId(null)}>
                  <div className="bg-white rounded-lg shadow-lg w-full h-full max-w-md mx-auto p-4 relative flex flex-col" onClick={e => e.stopPropagation()}>
                    <button className="absolute top-4 right-4 text-2xl text-[#2C1810]" onClick={() => setMobilePanelId(null)}>&times;</button>
                    <Panel {...activePanel} />
                  </div>
                </div>
              );
            })()}
          </div>

          <NoticeArea />
          <div className="flex justify-center mt-8">
            <div className="w-full">
              <Calendar />
            </div>
          </div>
        </div>

        <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id} className="px-4 py-2 bg-gray-800 text-white rounded shadow-lg text-sm flex items-center gap-2 min-w-[200px]">
              <span className="flex-1">{toast.message}</span>
              <button
                className="ml-2 text-white text-lg hover:text-red-300 focus:outline-none"
                aria-label="알림 닫기"
                onClick={() => useToastStore.getState().removeToast(toast.id)}
                tabIndex={0}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </main>

      {showAddPanelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAddPanelModal(false)}>
          <div className="bg-white border border-[#EDE5DC] w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xs font-semibold text-[#2C1810] uppercase tracking-widest mb-3">패널 추가</h3>
            <input
              value={newPanelName}
              onChange={(e) => setNewPanelName(e.target.value)}
              placeholder="패널 이름"
              className="w-full border-b border-[#EDE5DC] bg-transparent outline-none text-sm text-[#2C1810] mb-4"
              autoFocus
            />
            <div className="flex justify-between">
              <button type="button" onClick={() => setShowAddPanelModal(false)} className="text-xs text-[#9E8880]">취소</button>
              <button type="button" onClick={handleAddPanel} className="px-3 py-1 text-xs bg-[#2C1810] text-[#FDF8F4]">추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
