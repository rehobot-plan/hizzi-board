

import { useState, useRef, useEffect } from "react";
import { usePostStore } from "@/store/postStore";
import { usePanelStore } from "@/store/panelStore";
import { useAuthStore } from "@/store/authStore";
import { useEscClose } from '@/hooks/useEscClose';
import CreatePost from "./CreatePost";
import TodoRequestBadge from "./TodoRequestBadge";
import TodoList from "./TodoList";
import PostList from "./PostList";

interface PanelProps {
  id: string;
  name: string;
  ownerEmail?: string | null;
  position?: number;
  categories?: string[];
  color?: string;
}

// [마이그레이션 필요] 기존 Firestore 카테고리: 결재 → 첨부파일로 변경 필요
const DEFAULT_CATEGORIES = ["할일", "메모"];
const BASE_CATEGORIES = [...DEFAULT_CATEGORIES];



export default function Panel({ id, name, ownerEmail, position, categories }: PanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [panelName, setPanelName] = useState(name);
  const panelNameInputRef = useRef<HTMLInputElement>(null);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [tabNameDraft, setTabNameDraft] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("할일");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>(categories || DEFAULT_CATEGORIES);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [memoSelectMode, setMemoSelectMode] = useState(false);
  const [todoFilter, setTodoFilter] = useState<('업무' | '요청' | '개인')[]>(['업무', '요청']);

  const { posts, deletePost } = usePostStore();
  const { user } = useAuthStore();
  const { updatePanel } = usePanelStore();



  // 게시물 필터링 (첨부파일 탭은 attachments 필드가 있는 게시물만)
  const filteredPosts = posts.filter((post) => {
    if (post.panelId !== id) return false;
    if (post.deleted) return false;
    // 완료된 할일은 전체/할일 탭에서 숨김
    if (post.completed && post.category === '할일') return false;
    if (activeCategory === "첨부파일") {
      if (!post.attachment) return false;
    } else {
      if (!post.category || post.category !== activeCategory) return false;
    }
    const userEmail = user?.email ?? "";
    const visibleTo = post.visibleTo;
    if (!visibleTo || visibleTo.length === 0) return true;
    if (!user) return false;
    if (user.role === "admin") return true;
    if (post.author === userEmail) return true;
    if (visibleTo.includes(userEmail)) return true;
    return false;
  });

  const isOwner = user && ownerEmail === user?.email;
  const canCreate = user && (user.role === "admin" || isOwner);
  const canRename = user && (user.role === "admin" || isOwner);
  const canAddCategory = canCreate;

  useEscClose(() => setMemoSelectMode(false), memoSelectMode);

  // 패널 이름 인라인 편집
  const savePanelName = async () => {
    setIsEditing(false);
    await updatePanel(id, { name: panelName, ownerEmail: (ownerEmail || user?.email) ?? undefined });
  };

  // 탭 이름 변경
  const saveTabName = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setEditingTab(null);
      setTabNameDraft("");
      return;
    }
    const updated = categoryList.map((cat) => (cat === oldName ? newName.trim() : cat));
    setCategoryList(updated);
    setEditingTab(null);
    setTabNameDraft("");
    await updatePanel(id, { categories: updated });
  };



  // 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const updated = [...categoryList, newCategory.trim()];
    setCategoryList(updated);
    setNewCategory("");
    setShowCategoryModal(false);
    await updatePanel(id, { categories: updated });
  };

  return (
    <div
      className="panel-draggable flex flex-col h-full border border-[#EDE5DC] bg-white rounded-none p-0 shadow-sm"
      draggable="true"
      data-panel-id={id}
      style={{ transition: "background 0.2s, border 0.2s" }}
    >
      {/* 탭 영역 — 패널명 인라인 */}
      <div className="flex mb-0 border-b border-[#EDE5DC] bg-[#FDF8F4] px-5 pt-4 pb-0 items-center justify-between">
        {/* 패널명 인라인 (좌측) */}
        <div className="pb-2 pr-4 flex-shrink-0">
          {!isEditing ? (
            <span
              className="text-[10px] font-bold text-[#2C1810] uppercase tracking-widest select-none"
              style={{
                letterSpacing: '0.18em',
                cursor: canRename ? 'pointer' : 'default',
                transition: 'color 0.15s',
              }}
              onClick={() => canRename && setIsEditing(true)}
              onMouseEnter={e => { if (canRename) e.currentTarget.style.color = '#7A2828'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#2C1810'; }}
              title={canRename ? '클릭하여 이름 변경' : ''}
            >
              {panelName}
            </span>
          ) : (
            <input
              ref={panelNameInputRef}
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
              onBlur={savePanelName}
              onKeyDown={(e) => { if (e.key === 'Enter') savePanelName(); }}
              className="border-b border-[#EDE5DC] px-1 py-0.5 text-[10px] uppercase tracking-widest"
              autoFocus
              style={{ minWidth: 60 }}
            />
          )}
        </div>
        {/* 탭 버튼 (우측) */}
        <div className="flex gap-4 items-center">
          {categoryList.map((cat) => {
            const isBase = BASE_CATEGORIES.includes(cat);
            return (
              <div key={cat} className="relative flex items-center group">
                {editingTab === cat ? (
                  <input
                    className="px-3 py-2 border-b-2 text-[10px] uppercase tracking-widest focus:outline-none bg-transparent"
                    value={tabNameDraft}
                    autoFocus
                    onChange={(e) => setTabNameDraft(e.target.value)}
                    onBlur={() => saveTabName(cat, tabNameDraft)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveTabName(cat, tabNameDraft);
                      }
                    }}
                    style={{ minWidth: 48, borderBottom: '2px solid #C17B6B' }}
                  />
                ) : (
                  <button
                    className={`px-3 py-2 border-b-2 text-[10px] uppercase tracking-widest ${activeCategory === cat ? 'font-bold' : ''}`}
                    style={{
                      borderBottom: activeCategory === cat ? '2px solid #C17B6B' : '2px solid transparent',
                      color: activeCategory === cat ? '#C17B6B' : '#2C1810',
                      background: 'transparent',
                      transition: 'background 0.2s, border 0.2s, color 0.2s',
                    }}
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
                    className="ml-0.5 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="탭 삭제"
                    onClick={() => {
                      setDeleteTarget(cat);
                      setShowDeleteModal(true);
                    }}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {(isOwner || user?.role === 'admin') && ownerEmail && (
          <div className="pb-2 pl-2"><TodoRequestBadge panelOwnerEmail={ownerEmail} /></div>
        )}
      </div>

      {/* 필터 바 영역 */}
      <div className="flex items-center px-5 py-2 border-b border-[#EDE5DC] bg-white gap-2">
        {activeCategory === '할일' && (
          <>
            {(['업무', '요청', '개인'] as const).map(f => (
              <button
                key={f}
                onClick={() => setTodoFilter(prev =>
                  prev.includes(f)
                    ? prev.filter(x => x !== f)
                    : [...prev, f]
                )}
                style={{
                  fontSize: 10, letterSpacing: '0.04em',
                  color: todoFilter.includes(f) ? '#C17B6B' : '#9E8880',
                  background: 'none',
                  border: `1px solid ${todoFilter.includes(f) ? '#C17B6B' : '#EDE5DC'}`,
                  cursor: 'pointer', padding: '2px 10px',
                  transition: 'all 0.15s ease',
                }}
                type="button"
              >
                {f}
              </button>
            ))}
          </>
        )}
        <div style={{ flex: 1 }} />
        {canCreate && activeCategory !== '할일' && (
          <button
            onClick={() => { setMemoSelectMode(v => !v); }}
            style={{
              fontSize: 10, letterSpacing: '0.04em',
              color: memoSelectMode ? '#C17B6B' : '#9E8880',
              background: 'none',
              border: `1px solid ${memoSelectMode ? '#C17B6B' : '#EDE5DC'}`,
              cursor: 'pointer', padding: '2px 8px',
              transition: 'all 0.15s ease',
            }}
          >
            {memoSelectMode ? '취소' : '선택'}
          </button>
        )}
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '2px 12px', border: '1px solid #C17B6B',
              color: '#C17B6B', background: '#fff', cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FDF8F4')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            + 게시물
          </button>
        )}
      </div>
      {/* 게시물 목록 */}
      <div className="flex-1 overflow-y-auto px-5">
        {activeCategory === "할일" ? (
          <TodoList
            panelId={id}
            ownerEmail={ownerEmail}
            posts={posts}
            canEdit={!!(user && (user.role === 'admin' || ownerEmail === user?.email))}
            activeFilter={todoFilter}
          />
        ) : (
          <PostList
            posts={filteredPosts}
            activeCategory={activeCategory}
            panelId={id}
            canEdit={!!(user && (user.role === 'admin' || ownerEmail === user?.email))}
            selectMode={memoSelectMode}
            onSelectModeChange={setMemoSelectMode}
          />
        )}
      </div>
      {/* CreatePost 모달 */}
      {showCreate && (
        <CreatePost
          panelId={id}
          onClose={(savedCategory?: string) => {
            setShowCreate(false);
            if (savedCategory && categoryList.includes(savedCategory)) {
              setActiveCategory(savedCategory);
            }
          }}
          categories={categoryList}
          defaultCategory={activeCategory}
        />
      )}
      {/* 카테고리 추가 모달 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-3 rounded-lg w-full max-w-xs">
            <h3 className="text-base font-semibold mb-2">새 카테고리 추가</h3>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md mb-2 text-xs"
              placeholder="카테고리명 입력"
              autoFocus
            />
            <div className="flex justify-end gap-1">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-2 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-xs"
              >
                취소
              </button>
              <button
                onClick={handleAddCategory}
                className="px-2 py-1 bg-[#81D8D0] text-white rounded-md hover:bg-[#6BC4BB] text-xs"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 카테고리 삭제 모달 */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-3 rounded-lg w-full max-w-xs">
            <h3 className="text-base font-semibold mb-2">⚠️ &quot;{deleteTarget}&quot; 탭을 삭제하면 해당 탭의 모든 게시물이 함께 삭제됩니다. 정말 삭제하시겠습니까?</h3>
            <div className="flex justify-end gap-1">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="px-2 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-xs"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  const updated = categoryList.filter((cat) => cat !== deleteTarget);
                  setCategoryList(updated);
                  await updatePanel(id, { categories: updated });
                  const toDelete = posts.filter((p) => p.panelId === id && p.category === deleteTarget);
                  for (const p of toDelete) {
                    await deletePost(p.id);
                  }
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                  if (activeCategory === deleteTarget) setActiveCategory("전체");
                }}
                className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}