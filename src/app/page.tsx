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

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuthStore();
  const { panels, loading: panelLoading, updatePanel } = usePanelStore();
  const { users, loading: userLoading, deleteUser } = useUserStore();
  const { toasts } = useToastStore();
  const [adminMode, setAdminMode] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [draggedPanelId, setDraggedPanelId] = useState<string | null>(null); // <-- moved up
  const router = useRouter();

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
    // 패널 순서 스왑 (position 필드 활용)
    const draggedPanel = panels.find(p => p.id === draggedPanelId);
    const targetPanel = panels.find(p => p.id === targetPanelId);
    if (!draggedPanel || !targetPanel) return;
    // position 값 스왑
    await updatePanel(draggedPanel.id, { position: targetPanel.position });
    await updatePanel(targetPanel.id, { position: draggedPanel.position });
    setDraggedPanelId(null);
  };

  if (authLoading || panelLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white p-4 relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Hizzi Board</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.displayName || user?.email}</span>
            {user?.role === 'admin' && (
              <button
                onClick={() => setAdminMode((prev) => !prev)}
                className="px-4 py-2 bg-[#FFB703] text-black rounded hover:bg-[#f4a700] transition-colors"
              >
                {adminMode ? '관리 모드 종료' : '관리 모드'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#81D8D0] text-white rounded hover:bg-[#6BC4BB] transition-colors"
            >
              로그아웃
            </button>
          </div>
        </header>

        {adminMode && (
          <div className="border border-red-300 bg-red-50 rounded p-4 mb-4">
            <h2 className="text-xl font-semibold text-red-600 mb-2">관리자 - 사용자 관리</h2>
            {deleteError && <p className="text-sm text-red-600 mb-2">{deleteError}</p>}
            {userLoading ? (
              <p>로딩 중...</p>
            ) : (
              <div className="space-y-2">
                {users.map((u) => {
                  const userPanel = panels.find((p) => p.ownerEmail === u.email);
                  const isCurrentAdmin = user?.email === u.email && user?.role === 'admin';
                  return (
                    <div key={u.id} className="flex justify-between items-center bg-white p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{u.name} ({u.email})</p>
                        <p className="text-xs text-gray-500">담당 패널: {userPanel?.name || '없음'}</p>
                      </div>
                      <button
                        disabled={isCurrentAdmin}
                        onClick={async () => {
                          if (isCurrentAdmin) return;
                          try {
                            const panel = panels.find((p) => p.ownerEmail === u.email);
                            if (panel) await updatePanel(panel.id, { ownerEmail: null });
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[calc(100vh-120px)]">
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
        {/* 공유 달력: 게시판 3칸 너비(절반)로 하단에 배치 */}
        <div className="flex justify-center mt-8">
          <div className="w-[50%] min-w-[400px] max-w-2xl">
            {/* Calendar 컴포넌트 */}
            <Calendar />
          </div>
        </div>
      </div>

      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="px-4 py-2 bg-gray-800 text-white rounded shadow-lg text-sm">
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
