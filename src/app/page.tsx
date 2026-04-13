'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usePanelStore, initPanelListener } from '@/store/panelStore';
import { useUserStore, initUserListener, type AppUser } from '@/store/userStore';
import { useToastStore } from '@/store/toastStore';
import { initPostListener } from '@/store/postStore';
import { initRequestListener } from '@/store/todoRequestStore';
import { useLeaveStore, initLeaveListener } from '@/store/leaveStore';
import Panel from '@/components/Panel';
import Calendar from '@/components/calendar/Calendar';
import NoticeArea from '@/components/NoticeArea';
import LeaveManager from '@/components/LeaveManager';

export default function Home() {
  const { user, loading: authLoading, signOut, recoveryOrphanAccount } = useAuthStore();
  const { panels, updatePanel, addPanel, swapPanels } = usePanelStore();
  const { users, loading: userLoading, deleteUser, updateUserPanel, updateUserName, updateLeaveViewPermission } = useUserStore();
  const { loading: leaveLoading } = useLeaveStore();
  const { toasts } = useToastStore();
  const [adminMode, setAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'users' | 'leave' | 'recovery'>('users');
  const [deleteError, setDeleteError] = useState('');
  const [showAddPanelModal, setShowAddPanelModal] = useState(false);
  const [newPanelName, setNewPanelName] = useState('');
  const [draggedPanelId, setDraggedPanelId] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
    if (!user?.email) return;
    const cleanup1 = initPostListener();
    const cleanup2 = initRequestListener(user.email);
    const cleanup3 = initPanelListener();
    const cleanup4 = initUserListener();
    const cleanup5 = initLeaveListener();
    return () => { cleanup1(); cleanup2(); cleanup3(); cleanup4(); cleanup5(); };
  }, [user?.email]);

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
        if (prevPanel) await updatePanel(prevPanel.id, { ownerEmail: null });
        await updateUserPanel(targetUserId, null);
        return;
      }
      const nextPanel = panels.find((p) => p.id === nextPanelId);
      if (!nextPanel) return;
      const occupiedByRealUser = !!(nextPanel.ownerEmail && users.some((u) => u.email === nextPanel.ownerEmail));
      if (occupiedByRealUser && nextPanel.ownerEmail !== targetEmail) return;
      if (prevPanel && prevPanel.id !== nextPanel.id) {
        await updatePanel(prevPanel.id, { ownerEmail: null });
      }
      await updatePanel(nextPanel.id, { ownerEmail: targetEmail });
      await updateUserPanel(targetUserId, nextPanel.id);
    } catch (err) {
      console.error(err);
      setDeleteError('패널 배정 중 오류가 발생했습니다.');
      useToastStore.getState().addToast({ message: '패널 배정 중 오류가 발생했습니다. 다시 시도해주세요.', type: 'error' });
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
    await swapPanels(draggedPanelId, targetPanelId);
    setDraggedPanelId(null);
  };

  const handleAddPanel = async () => {
    const trimmed = newPanelName.trim();
    if (!trimmed) return;
    await addPanel(trimmed);
    setNewPanelName('');
    setShowAddPanelModal(false);
  };

  const [mobilePanelId, setMobilePanelId] = useState<string | null>(null);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDF8F4]">Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-[#FDF8F4]">
      {/* 사이드바 */}
      <aside className="flex-col justify-between min-h-screen w-[200px] bg-[#5C1F1F] py-8 px-6 hidden md:flex">
        <div>
          <div className="mb-12 select-none cursor-pointer transition-opacity hover:opacity-80" onClick={() => router.push('/')}>
            <span className="block text-white text-2xl font-extrabold tracking-[0.15em] uppercase text-center" style={{ letterSpacing: '0.15em' }}>HIZZI BOARD</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#C17B6B] flex items-center justify-center text-white font-bold text-lg uppercase">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="text-white text-xs font-medium truncate max-w-[100px]">
              {user?.displayName || user?.email}
            </div>
          </div>
          {user && users.find((u) => u.email === user.email)?.leaveViewPermission &&
           user && users.find((u) => u.email === user.email)?.leaveViewPermission !== 'none' && (
            <button
              onClick={() => router.push('/leave')}
              className="w-full px-2 py-1 text-white text-center transition-all hover:opacity-90"
              style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              연차 사용 현황
            </button>
          )}
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
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
                {adminMode ? '관리자 모드 닫기' : '관리자 모드'}
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

        <div className="flex-1 px-2 md:px-8 py-8" style={{ overflowY: 'auto', overflowX: 'visible' }}>
          {adminMode && (
            <div className="border border-[#EDE5DC] bg-white rounded p-4 mb-4">
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setAdminTab('users')}
                  className="px-3 py-1 text-xs border"
                  style={{ borderColor: adminTab === 'users' ? '#2C1810' : '#EDE5DC', color: adminTab === 'users' ? '#2C1810' : '#9E8880', background: adminTab === 'users' ? '#FDF8F4' : '#fff' }}>
                  사용자 관리
                </button>
                <button type="button" onClick={() => setAdminTab('leave')}
                  className="px-3 py-1 text-xs border"
                  style={{ borderColor: adminTab === 'leave' ? '#2C1810' : '#EDE5DC', color: adminTab === 'leave' ? '#2C1810' : '#9E8880', background: adminTab === 'leave' ? '#FDF8F4' : '#fff' }}>
                  연차 관리
                </button>
                <button type="button" onClick={() => setAdminTab('recovery')}
                  className="px-3 py-1 text-xs border"
                  style={{ borderColor: adminTab === 'recovery' ? '#2C1810' : '#EDE5DC', color: adminTab === 'recovery' ? '#2C1810' : '#9E8880', background: adminTab === 'recovery' ? '#FDF8F4' : '#fff' }}>
                  계정 복구
                </button>
              </div>

              {adminTab === 'users' ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-[#2C1810]">관리자 - 사용자 관리</h2>
                      <span className="text-xs text-[#C17B6B]">미배정 {unassignedCount}명</span>
                    </div>
                    <button type="button" onClick={() => setShowAddPanelModal(true)}
                      className="px-3 py-1 text-xs border border-[#2C1810] text-[#2C1810] bg-[#FDF8F4]">
                      + 패널 추가
                    </button>
                  </div>
                  {deleteError && <p className="text-sm text-red-600 mb-2">{deleteError}</p>}
                  {userLoading ? (
                    <p>불러오는 중...</p>
                  ) : (
                    <div className="space-y-2">
                      {sortedUsers.map((u) => {
                        const userPanel = getUserPanel(u.email);
                        const isCurrentAdmin = user?.email === u.email && user?.role === 'admin';
                        const isUnassigned = isUnassignedUser(u);
                        const isEditingName = editingNameId === u.id;
                        return (
                          <div key={u.id} className="flex justify-between items-center bg-white p-2 border rounded gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium flex items-center gap-2">
                                {isEditingName ? (
                                  <input
                                    autoFocus
                                    value={editingNameValue}
                                    onChange={(e) => setEditingNameValue(e.target.value)}
                                    onBlur={async () => {
                                      if (editingNameValue.trim()) await updateUserName(u.id, editingNameValue.trim());
                                      setEditingNameId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editingNameValue.trim()) void updateUserName(u.id, editingNameValue.trim());
                                        setEditingNameId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingNameId(null);
                                      }
                                    }}
                                    className="border-b border-[#2C1810] bg-transparent outline-none text-sm text-[#2C1810]"
                                  />
                                ) : (
                                  <span onClick={() => { setEditingNameId(u.id); setEditingNameValue(u.name); }}
                                    className="cursor-pointer hover:text-[#C17B6B]">
                                    {u.name}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-500">({u.email})</span>
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
                                <>
                                  <select
                                    value={u.leaveViewPermission || 'none'}
                                    onChange={(e) => updateLeaveViewPermission(u.id, e.target.value as AppUser['leaveViewPermission'])}
                                    className="border border-[#EDE5DC] px-2 py-1 text-xs bg-white min-w-[100px]">
                                    <option value="none">연차보기 없음</option>
                                    <option value="self">본인만</option>
                                    <option value="all">전체</option>
                                    {/* 'me' 옵션은 의도적으로 제외 — UI상 'self'와 동일하게 처리 */}
                                  </select>
                                  <select
                                    value={userPanel?.id || ''}
                                    onChange={(e) => handleAssignPanel(u.id, u.email, e.target.value)}
                                    className="border border-[#EDE5DC] px-2 py-1 text-xs bg-white min-w-[140px]">
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
                                  <button
                                    disabled={isCurrentAdmin}
                                    onClick={() => setDeleteConfirmId(u.id)}
                                    className="px-3 py-1 text-xs border text-white disabled:opacity-40"
                                    style={{ borderColor: '#C17B6B', background: '#C17B6B' }}>
                                    삭제
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : adminTab === 'leave' ? (
                leaveLoading
                  ? <p className="text-xs text-[#9E8880]">불러오는 중...</p>
                  : <LeaveManager />
              ) : (
                <div>
                  <h2 className="text-base font-semibold text-[#2C1810] mb-4">관리자 - 계정 복구</h2>
                  <p className="text-xs text-[#9E8880] mb-4">Firebase Auth에는 있지만 Firestore users에 없는 고아 계정을 복구합니다.</p>
                  {recoveryMessage && (
                    <div className={`text-sm p-3 rounded mb-4 ${recoveryMessage.includes('성공') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {recoveryMessage}
                    </div>
                  )}
                  <div className="border border-[#EDE5DC] p-4 rounded bg-white">
                    <label className="text-[11px] text-[#9E8880] uppercase tracking-wider mb-2 block">이메일</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="example@company.com"
                        className="flex-1 border-b border-[#EDE5DC] bg-transparent outline-none text-sm text-[#2C1810]"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setRecoveryMessage('');
                            await recoveryOrphanAccount(recoveryEmail);
                            setRecoveryMessage(`✓ ${recoveryEmail} 계정을 복구했습니다.`);
                            setRecoveryEmail('');
                          } catch (err: unknown) {
                            setRecoveryMessage(`✗ 오류: ${err instanceof Error ? err.message : '계정 복구 실패'}`);
                          }
                        }}
                        className="px-4 py-1 text-xs bg-[#2C1810] text-[#FDF8F4] border border-[#2C1810] rounded">
                        복구
                      </button>
                    </div>
                    <p className="text-[10px] text-[#9E8880]">✓ 해당 이메일이 이미 Firestore에 있으면 복구되지 않습니다.</p>
                    <p className="text-[10px] text-[#9E8880]">✓ 복구 후 자동으로 빈 패널에 배정됩니다. (관리자 계정 제외)</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 패널 그리드 */}
          <div>
            <div className="hidden md:grid grid-cols-3 gap-6 auto-rows-fr">
              {panels
                .slice()
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((panel) => (
                  <div key={panel.id} draggable
                    onDragStart={e => handlePanelDragStart(e, panel.id)}
                    onDragOver={handlePanelDragOver}
                    onDrop={e => handlePanelDrop(e, panel.id)}
                    className="h-full">
                    <Panel id={panel.id} name={panel.name} ownerEmail={panel.ownerEmail} position={panel.position} />
                  </div>
                ))}
            </div>
            {/* 모바일 3열 미니뷰 */}
            <div className="grid grid-cols-3 gap-2 md:hidden">
              {panels
                .slice()
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((panel) => (
                  <button key={panel.id}
                    className="h-20 bg-white border border-[#EDE5DC] rounded flex items-center justify-center text-xs font-bold text-[#2C1810] overflow-hidden"
                    onClick={() => setMobilePanelId(panel.id)}>
                    {panel.name}
                  </button>
                ))}
            </div>
            {/* 모바일 상세보기 */}
            {mobilePanelId && (() => {
              const activePanel = panels.find(p => p.id === mobilePanelId);
              if (!activePanel) return null;
              return (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center md:hidden"
                  onClick={() => setMobilePanelId(null)}>
                  <div className="bg-white rounded-lg shadow-lg w-full h-full max-w-md mx-auto p-4 relative flex flex-col"
                    onClick={e => e.stopPropagation()}>
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

        {/* 토스트 */}
        <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id} className="px-4 py-2 bg-gray-800 text-white rounded shadow-lg text-sm flex items-center gap-2 min-w-[200px]">
              <span className="flex-1">{toast.message}</span>
              <button
                className="ml-2 text-white text-lg hover:text-red-300 focus:outline-none"
                aria-label="토스트 닫기"
                onClick={() => useToastStore.getState().removeToast(toast.id)}
                tabIndex={0}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* 패널 추가 모달 */}
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

      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (() => {
        const targetUser = users.find((u) => u.id === deleteConfirmId);
        if (!targetUser) return null;
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDeleteConfirmId(null)}>
            <div className="bg-white border border-[#EDE5DC] w-full max-w-sm p-4 rounded" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-[#2C1810] mb-3">계정 삭제</h3>
              <p className="text-xs text-[#9E8880] mb-4">
                정말 <strong>{targetUser.name}</strong>({targetUser.email}) 계정을 삭제하시겠습니까?<br/>
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteConfirmId(null)}
                  className="px-3 py-1 text-xs border border-[#9E8880] text-[#9E8880]">
                  취소
                </button>
                <button type="button"
                  onClick={async () => {
                    try {
                      const panel = panels.find((p) => p.ownerEmail === targetUser.email);
                      if (panel) await updatePanel(panel.id, { ownerEmail: null });
                      await updateUserPanel(deleteConfirmId, null);
                      await deleteUser(deleteConfirmId);
                      setDeleteConfirmId(null);
                    } catch (err: unknown) {
                      console.error(err);
                      setDeleteError('삭제 중 오류가 발생했습니다.');
                      useToastStore.getState().addToast({ message: '사용자 삭제 중 오류가 발생했습니다. 다시 시도해주세요.', type: 'error' });
                    }
                  }}
                  className="px-3 py-1 text-xs text-white"
                  style={{ borderColor: '#C17B6B', background: '#C17B6B', border: '1px solid #C17B6B' }}>
                  삭제
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
