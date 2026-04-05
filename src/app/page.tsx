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
  const { user, loading: authLoading, signOut, recoveryOrphanAccount } = useAuthStore();
  const { panels, loading: panelLoading, updatePanel, addPanel } = usePanelStore();
  const { users, loading: userLoading, deleteUser, updateUserPanel, updateUserName, updateLeaveViewPermission } = useUserStore();
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

      // ?대? ?ㅻⅨ ?ъ슜?먭? 諛곗젙???⑤꼸? ?좏깮 遺덇?
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
      setDeleteError('?⑤꼸 諛곗젙 ???以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
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

  // ?ъ씠?쒕컮 硫붾돱
  // ?ъ씠?쒕컮 硫붾돱 ?쒓굅, 釉뚮옖?쒕챸/?ъ슜???뺣낫留??좎?

  // 紐⑤컮???⑤꼸 ?ㅻ쾭?덉씠 ?곹깭
  const [mobilePanelId, setMobilePanelId] = useState<string | null>(null);

  if (authLoading || panelLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDF8F4]">Loading...</div>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#FDF8F4]">
      {/* ?ъ씠?쒕컮: 紐⑤컮?쇱뿉???④? */}
      <aside
        className="flex-col justify-between min-h-screen w-[200px] bg-[#5C1F1F] py-8 px-6 hidden md:flex"
      >
        <div>
          <div className="mb-12 select-none cursor-pointer transition-opacity hover:opacity-80" onClick={() => router.push('/')}>
            <span className="block text-white text-2xl font-extrabold tracking-[0.15em] uppercase text-center" style={{ letterSpacing: '0.15em' }}>HIZZI BOARD</span>
          </div>
        </div>
        {/* ?꾨컮?+?대쫫 */}
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
              ?곗감 ?ъ슜 ?댁뿭
            </button>
          )}
        </div>
      </aside>

      {/* 硫붿씤 而⑦뀗痢?*/}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* ?ㅻ뜑 */}
        <header className="flex items-center px-8 border-b border-[#EDE5DC] bg-transparent py-6 min-h-[72px]">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <button
                onClick={() => setAdminMode((prev) => !prev)}
                className="px-3 py-1 border border-[#C17B6B] text-[#C17B6B] bg-white rounded outline-none hover:bg-[#FDF8F4] text-xs uppercase tracking-widest transition"
              >
                {adminMode ? '愿由?紐⑤뱶 醫낅즺' : '愿由?紐⑤뱶'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 border border-[#C17B6B] text-[#C17B6B] bg-white rounded outline-none hover:bg-[#FDF8F4] text-xs uppercase tracking-widest transition"
            >
              濡쒓렇?꾩썐
            </button>
          </div>
        </header>

        <div className="flex-1 px-2 md:px-8 py-8" style={{ overflowY: 'auto', overflowX: 'visible' }}>
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
                  ?ъ슜??愿由?                </button>
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
                  ?곗감 愿由?                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('recovery')}
                  className="px-3 py-1 text-xs border"
                  style={{
                    borderColor: adminTab === 'recovery' ? '#2C1810' : '#EDE5DC',
                    color: adminTab === 'recovery' ? '#2C1810' : '#9E8880',
                    background: adminTab === 'recovery' ? '#FDF8F4' : '#fff',
                  }}
                >
                  怨꾩젙 蹂듦뎄
                </button>
              </div>

              {adminTab === 'users' ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-[#2C1810]">愿由ъ옄 - ?ъ슜??愿由?</h2>
                      <span className="text-xs text-[#C17B6B]">誘몃같??{unassignedCount}紐?</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddPanelModal(true)}
                      className="px-3 py-1 text-xs border border-[#2C1810] text-[#2C1810] bg-[#FDF8F4]"
                    >
                      + ?⑤꼸 異붽?
                    </button>
                  </div>
                  {deleteError && <p className="text-sm text-red-600 mb-2">{deleteError}</p>}
                  {userLoading ? (
                    <p>濡쒕뵫 以?..</p>
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
                                      if (editingNameValue.trim()) {
                                        await updateUserName(u.id, editingNameValue.trim());
                                      }
                                      setEditingNameId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editingNameValue.trim()) {
                                          void updateUserName(u.id, editingNameValue.trim());
                                        }
                                        setEditingNameId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingNameId(null);
                                      }
                                    }}
                                    className="border-b border-[#2C1810] bg-transparent outline-none text-sm text-[#2C1810]"
                                  />
                                ) : (
                                  <span
                                    onClick={() => {
                                      setEditingNameId(u.id);
                                      setEditingNameValue(u.name);
                                    }}
                                    className="cursor-pointer hover:text-[#C17B6B]"
                                  >
                                    {u.name}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-500">({u.email})</span>
                                {isUnassigned && (
                                  <span className="text-[10px] px-2 py-0.5 border" style={{ color: '#C17B6B', borderColor: '#C17B6B', background: '#FFF5F2' }}>
                                    ?⑤꼸 誘몃같??                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">?대떦 ?⑤꼸: {userPanel?.name || '?놁쓬'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {u.role === 'admin' ? (
                                <span className="text-xs text-[#9E8880] px-2">愿由ъ옄 怨꾩젙</span>
                              ) : (
                                <>
                                  <select
                                    value={u.leaveViewPermission || 'none'}
                                    onChange={(e) => updateLeaveViewPermission(u.id, e.target.value as 'none' | 'self' | 'all')}
                                    className="border border-[#EDE5DC] px-2 py-1 text-xs bg-white min-w-[100px]"
                                  >
                                    <option value="none">?곗감?대엺 ?놁쓬</option>
                                    <option value="self">蹂몄씤留?</option>
                                    <option value="all">?꾩껜</option>
                                  </select>
                                  <select
                                    value={userPanel?.id || ''}
                                    onChange={(e) => handleAssignPanel(u.id, u.email, e.target.value)}
                                    className="border border-[#EDE5DC] px-2 py-1 text-xs bg-white min-w-[140px]"
                                  >
                                    <option value="">?⑤꼸 ?놁쓬</option>
                                  {panels
                                    .slice()
                                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                                    .map((p) => {
                                      const hasRealOwner = !!(p.ownerEmail && users.some((us) => us.email === p.ownerEmail));
                                      const occupiedByOther = hasRealOwner && p.ownerEmail !== u.email;
                                      return (
                                        <option key={p.id} value={p.id} disabled={occupiedByOther}>
                                          {p.name}{occupiedByOther ? ' (諛곗젙??' : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <button
                                    disabled={isCurrentAdmin}
                                    onClick={() => setDeleteConfirmId(u.id)}
                                    className="px-3 py-1 text-xs border text-white disabled:opacity-40"
                                    style={{ borderColor: '#C17B6B', background: '#C17B6B' }}
                                  >
                                    ??젣
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
                <LeaveManager />
              ) : (
                <div>
                  <h2 className="text-base font-semibold text-[#2C1810] mb-4">愿由ъ옄 - 怨꾩젙 蹂듦뎄</h2>
                  <p className="text-xs text-[#9E8880] mb-4">Firebase Auth?먮뒗 ?덉?留?Firestore users???녿뒗 怨좎븘 怨꾩젙??蹂듦뎄?⑸땲??</p>
                  
                  {recoveryMessage && (
                    <div className={`text-sm p-3 rounded mb-4 ${recoveryMessage.includes('?깃났') || recoveryMessage.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {recoveryMessage}
                    </div>
                  )}
                  
                  <div className="border border-[#EDE5DC] p-4 rounded bg-white">
                    <label className="text-[11px] text-[#9E8880] uppercase tracking-wider mb-2 block">?대찓??</label>
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
                            setRecoveryMessage(`??${recoveryEmail} 怨꾩젙??蹂듦뎄?섏뿀?듬땲??`);
                            setRecoveryEmail('');
                          } catch (err: any) {
                            setRecoveryMessage(`???ㅻ쪟: ${err?.message || '怨꾩젙 蹂듦뎄 ?ㅽ뙣'}`);
                          }
                        }}
                        className="px-4 py-1 text-xs bg-[#2C1810] text-[#FDF8F4] border border-[#2C1810] rounded"
                      >
                        蹂듦뎄
                      </button>
                    </div>
                    <p className="text-[10px] text-[#9E8880]">???대떦 ?대찓?쇱씠 ?대? Firestore???덉쑝硫?蹂듦뎄?????놁뒿?덈떎.</p>
                    <p className="text-[10px] text-[#9E8880]">??蹂듦뎄 ???먮룞?쇰줈 鍮??⑤꼸??諛곗젙?⑸땲?? (愿由ъ옄 怨꾩젙 ?쒖쇅)</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ?곗뒪?ы깙: 3x2 洹몃━?? 紐⑤컮?? 3??誘몃땲移대뱶 */}
          <div>
            {/* ?곗뒪?ы깙 */}
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
            {/* 紐⑤컮?? 3??誘몃땲移대뱶 */}
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
            {/* 紐⑤컮???ㅻ쾭?덉씠 */}
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
                aria-label="?뚮┝ ?リ린"
                onClick={() => useToastStore.getState().removeToast(toast.id)}
                tabIndex={0}
              >
                횞
              </button>
            </div>
          ))}
        </div>
      </main>

      {showAddPanelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAddPanelModal(false)}>
          <div className="bg-white border border-[#EDE5DC] w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xs font-semibold text-[#2C1810] uppercase tracking-widest mb-3">?⑤꼸 異붽?</h3>
            <input
              value={newPanelName}
              onChange={(e) => setNewPanelName(e.target.value)}
              placeholder="?⑤꼸 ?대쫫"
              className="w-full border-b border-[#EDE5DC] bg-transparent outline-none text-sm text-[#2C1810] mb-4"
              autoFocus
            />
            <div className="flex justify-between">
              <button type="button" onClick={() => setShowAddPanelModal(false)} className="text-xs text-[#9E8880]">痍⑥냼</button>
              <button type="button" onClick={handleAddPanel} className="px-3 py-1 text-xs bg-[#2C1810] text-[#FDF8F4]">異붽?</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (() => {
        const targetUser = users.find((u) => u.id === deleteConfirmId);
        if (!targetUser) return null;
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDeleteConfirmId(null)}>
            <div className="bg-white border border-[#EDE5DC] w-full max-w-sm p-4 rounded" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-[#2C1810] mb-3">怨꾩젙 ??젣</h3>
              <p className="text-xs text-[#9E8880] mb-4">
                ?뺣쭚 <strong>{targetUser.name}</strong>({targetUser.email}) 怨꾩젙????젣?섏떆寃좎뒿?덇퉴?<br/>
                ???묒뾽? ?섎룎由????놁뒿?덈떎.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3 py-1 text-xs border border-[#9E8880] text-[#9E8880]"
                >
                  痍⑥냼
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const panel = panels.find((p) => p.ownerEmail === targetUser.email);
                      if (panel) await updatePanel(panel.id, { ownerEmail: null });
                      await updateUserPanel(deleteConfirmId, null);
                      await deleteUser(deleteConfirmId);
                      setDeleteConfirmId(null);
                    } catch (err: any) {
                      console.error(err);
                      setDeleteError('??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
                    }
                  }}
                  className="px-3 py-1 text-xs text-white"
                  style={{ borderColor: '#C17B6B', background: '#C17B6B', border: '1px solid #C17B6B' }}
                >
                  ??젣
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
