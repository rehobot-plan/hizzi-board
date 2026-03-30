'use client';

import { useState, useRef } from 'react';
// import { HexColorPicker } from 'react-colorful';
import { usePostStore } from '@/store/postStore';
import { usePanelStore } from '@/store/panelStore';
import { useAuthStore } from '@/store/authStore';
import PostItem from './PostItem';
import CreatePost from './CreatePost';

interface PanelProps {
  id: string;
  name: string;
  ownerEmail?: string | null;
  position?: number;
  categories?: string[];
}

const DEFAULT_CATEGORIES = ['공지', '결재', '메모'];
const BASE_CATEGORIES = ['전체', ...DEFAULT_CATEGORIES];

export default function Panel({ id, name, ownerEmail, position, categories }: PanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [panelName, setPanelName] = useState(name);
  const panelNameInputRef = useRef<HTMLInputElement>(null);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [tabNameDraft, setTabNameDraft] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryList, setCategoryList] = useState<string[]>(categories || DEFAULT_CATEGORIES);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [panelColor, setPanelColor] = useState<string>(categories && categories.length && typeof categories[0] === 'string' ? '#81D8D0' : '#81D8D0');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { posts, deletePost } = usePostStore();
  const { user } = useAuthStore();
  const { updatePanel } = usePanelStore();

  // 게시물 필터링 (카테고리, 공개범위)
  const filteredPosts = posts.filter((post) => {
    if (post.panelId !== id) return false;
    if (activeCategory !== '전체') {
      if (!post.category || post.category !== activeCategory) return false;
    }
    // 공개범위: visibleTo가 없으면 전체, 있으면 본인/관리자/특정인만
    if (post.visibleTo && Array.isArray(post.visibleTo)) {
      if (!user) return false;
      const userEmail = user.email ?? '';
      // 'all'이면 모두 볼 수 있음, 'me'면 본인만, 아니면 배열에 포함된 이메일만
      if (post.visibleTo.includes('all')) return true;
      if (post.visibleTo.includes('me')) return post.author === userEmail || user.role === 'admin';
      if (!post.visibleTo.includes(userEmail) && user.role !== 'admin') return false;
    }
    return true;
  });

  const isOwner = user && ownerEmail === user?.email;
  const canCreate = user && (user.role === 'admin' || isOwner);
  const canRename = user && (user.role === 'admin' || isOwner);
  const canAddCategory = canCreate;

  // 패널명 저장
  const savePanelName = async () => {
    setIsEditing(false);
    await updatePanel(id, { name: panelName, ownerEmail: (ownerEmail || user?.email) ?? undefined });
  };

  // 탭 이름 저장
  const saveTabName = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingTab(null);
      setTabNameDraft('');
      return;
    }
    const updated = categoryList.map(cat => cat === oldName ? newName.trim() : cat);
    setCategoryList(updated);
    setEditingTab(null);
    setTabNameDraft('');
    await updatePanel(id, { categories: updated });
    // 해당 카테고리의 게시물도 category 필드 업데이트 필요 (선택적 구현)
  };

  // 패널 색상 저장
  const savePanelColor = async (color: string) => {
    setPanelColor(color);
    setShowColorPicker(false);
    await updatePanel(id, { color });
  };

  // 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const updated = [...categoryList, newCategory.trim()];
    setCategoryList(updated);
    setNewCategory('');
    setShowCategoryModal(false);
    await updatePanel(id, { categories: updated });
  };

  // drag-and-drop 패널 스왑 지원 (버그픽스 #3, page.tsx와 연동 필요)
  // (여기서는 UI/핸들러만 준비, 실제 스왑 로직은 page.tsx에서 처리)

  return (
    <div className="bg-white border-2 border-[#81D8D0] rounded-lg p-4 flex flex-col h-full panel-draggable" draggable="true" data-panel-id={id}>
      {/* 바인더 탭 */}
      <div className="flex gap-2 mb-2">
        {['전체', ...categoryList].map((cat) => {
          const isBase = BASE_CATEGORIES.includes(cat);
          return (
            <div key={cat} className="relative flex items-center group">
              {editingTab === cat ? (
                <input
                  className={`px-2 py-1 rounded-t-lg border-b-2 border-[#81D8D0] text-sm focus:outline-none`}
                  value={tabNameDraft}
                  autoFocus
                  onChange={e => setTabNameDraft(e.target.value)}
                  onBlur={() => saveTabName(cat, tabNameDraft)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveTabName(cat, tabNameDraft);
                    }
                  }}
                  style={{ minWidth: 60 }}
                />
              ) : (
                <button
                  className={`px-3 py-1 rounded-t-lg border-b-2 ${activeCategory === cat ? 'border-[#81D8D0] bg-[#e0f7f5] font-bold' : 'border-transparent bg-gray-100'} text-sm`}
                  onClick={() => setActiveCategory(cat)}
                  onDoubleClick={() => {
                    if (!isBase && canAddCategory) {
                      setEditingTab(cat);
                      setTabNameDraft(cat);
                    }
                  }}
                  type="button"
                >
                  {cat}
                </button>
              )}
              {canAddCategory && !isBase && (
                <button
                  className="ml-1 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                  title="탭 삭제"
                  onClick={() => { setDeleteTarget(cat); setShowDeleteModal(true); }}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {canAddCategory && (
          <button
            className="px-3 py-1 rounded-t-lg border-b-2 border-transparent bg-gray-100 text-sm"
            onClick={() => setShowCategoryModal(true)}
          >
            +
          </button>
        )}
      </div>
            {/* 카테고리 삭제 확인 모달 */}
            {showDeleteModal && deleteTarget && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-xs">
                  <h3 className="text-lg font-semibold mb-4">⚠️ &quot;{deleteTarget}&quot; 탭을 삭제하면 해당 탭의 모든 게시물이 함께 삭제됩니다. 정말 삭제하시겠습니까?</h3>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={async () => {
                        // 카테고리 목록에서 제거
                        const updated = categoryList.filter(cat => cat !== deleteTarget);
                        setCategoryList(updated);
                        await updatePanel(id, { categories: updated });
                        // 해당 카테고리의 게시물 모두 삭제
                        const toDelete = posts.filter(p => p.panelId === id && p.category === deleteTarget);
                        for (const p of toDelete) {
                          await deletePost(p.id);
                        }
                        setShowDeleteModal(false);
                        setDeleteTarget(null);
                        if (activeCategory === deleteTarget) setActiveCategory('전체');
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            )}
      {/* 패널 헤더 */}
      <div className="flex justify-between items-center mb-4">
        {!isEditing ? (
          <h3
            className={`text-xl font-semibold text-gray-800 ${canRename ? 'cursor-pointer hover:text-[#81D8D0]' : ''}`}
            onClick={() => canRename && setIsEditing(true)}
            style={{ color: panelColor }}
            tabIndex={0}
            onBlur={() => setIsEditing(false)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                savePanelName();
              }
            }}
          >
            {panelName}
          </h3>
        ) : (
          <input
            ref={panelNameInputRef}
            value={panelName}
            onChange={e => setPanelName(e.target.value)}
            onBlur={savePanelName}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                savePanelName();
              }
            }}
            className="border rounded px-2 py-1 mr-2"
            autoFocus
            style={{ minWidth: 80 }}
          />
        )}
        {/* 색상 변경 버튼: 본인/관리자만 */}
        {canRename && (
          <button
            onClick={() => setShowColorPicker(v => !v)}
            className="ml-1 text-xl"
            title="패널 색상 변경"
            type="button"
          >
            🎨
          </button>
        )}
        {showColorPicker && canRename && (
          <div className="absolute z-50 mt-2 bg-white p-4 rounded shadow-lg border flex flex-col items-center">
            {/* 스와치 팔레트 */}
            <div className="flex gap-2 mb-2">
              {[
                { color: '#81D8D0', name: '티파니 민트' },
                { color: '#F4C0D1', name: '파스텔 핑크' },
                { color: '#B5D4F4', name: '하늘 블루' },
                { color: '#C0DD97', name: '라임 그린' },
                { color: '#FAC775', name: '골드' },
                { color: '#F0997B', name: '코랄' },
                { color: '#AFA9EC', name: '라벤더' },
                { color: '#D3D1C7', name: '웜 그레이' },
              ].map(swatch => (
                <button
                  key={swatch.color}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center focus:outline-none transition ${panelColor === swatch.color ? 'border-[#222] shadow' : 'border-gray-200'}`}
                  style={{ background: swatch.color }}
                  title={swatch.name}
                  onClick={() => setPanelColor(swatch.color)}
                  type="button"
                >
                  {panelColor === swatch.color && <span className="w-3 h-3 bg-white rounded-full border border-[#222]" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="px-3 py-1 bg-[#81D8D0] text-white rounded"
                onClick={() => savePanelColor(panelColor)}
                type="button"
              >
                색상 적용
              </button>
              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() => setShowColorPicker(false)}
                type="button"
              >
                취소
              </button>
              <button
                className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-[#81D8D0] hover:bg-[#e0f7f5]"
                onClick={async () => {
                  setPanelColor('#81D8D0');
                  setShowColorPicker(false);
                  await updatePanel(id, { color: undefined });
                }}
                type="button"
              >
                기본색으로 초기화
              </button>
            </div>
          </div>
        )}
        {/* 이름 변경 텍스트 완전 제거, 🎨 버튼만 남김 */}
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1 bg-[#81D8D0] text-white text-sm rounded hover:bg-[#6BC4BB] transition-colors"
          >
            + 게시물
          </button>
        )}
      </div>
      {/* 게시물 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredPosts.length === 0 ? (
          <p className="text-gray-500 text-center">게시물이 없습니다</p>
        ) : (
          filteredPosts.map(post => (
            <PostItem key={post.id} post={post} />
          ))
        )}
      </div>
      {showCreate && (
        <CreatePost
          panelId={id}
          onClose={() => setShowCreate(false)}
          categories={categoryList}
        />
      )}
      {/* 카테고리 추가 모달 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-xs">
            <h3 className="text-lg font-semibold mb-4">새 카테고리 추가</h3>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              placeholder="카테고리명 입력"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-[#81D8D0] text-white rounded-md hover:bg-[#6BC4BB]"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}