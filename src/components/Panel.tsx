

import { useState, useRef, useEffect } from "react";
import { usePostStore } from "@/store/postStore";
import { usePanelStore } from "@/store/panelStore";
import { useAuthStore } from "@/store/authStore";
import PostItem from "./PostItem";
import CreatePost from "./CreatePost";
import TodoItem from "./TodoItem";

interface PanelProps {
  id: string;
  name: string;
  ownerEmail?: string | null;
  position?: number;
  categories?: string[];
  color?: string;
}

// [마이그레이션 필요] 기존 Firestore 카테고리: 결재 → 첨부파일로 변경 필요
const DEFAULT_CATEGORIES = ["할일", "메모", "첨부파일"];
const BASE_CATEGORIES = ["전체", ...DEFAULT_CATEGORIES];



export default function Panel({ id, name, ownerEmail, position, categories }: PanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [panelName, setPanelName] = useState(name);
  const panelNameInputRef = useRef<HTMLInputElement>(null);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [tabNameDraft, setTabNameDraft] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>(categories || DEFAULT_CATEGORIES);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCompleted, setSelectedCompleted] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);

  const { posts, deletePost } = usePostStore();
  const { user } = useAuthStore();
  const { updatePanel } = usePanelStore();



  // 게시물 필터링 (첨부파일 탭은 attachments 필드가 있는 게시물만)
  const filteredPosts = posts.filter((post) => {
    if (post.panelId !== id) return false;
    // 완료된 할일은 전체/할일 탭에서 숨김
    if (post.completed && post.category === '할일') return false;
    if (activeCategory === "첨부파일") {
      if (!post.attachments || post.attachments.length === 0) return false;
    } else if (activeCategory !== "전체") {
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

  // 드래그 앤 드롭 핸들러 (상위에서 전달 필요)
  // ...기존과 동일하게 유지 (props로 핸들러 받을 경우 추가)

  return (
    <div
      className="panel-draggable flex flex-col h-full border border-[#EDE5DC] bg-white rounded-none p-0 shadow-sm"
      draggable="true"
      data-panel-id={id}
      style={{ transition: "background 0.2s, border 0.2s" }}
    >
      {/* 탭 영역 */}
      <div className="flex gap-4 mb-0 border-b border-[#EDE5DC] bg-[#FDF8F4] px-5 pt-4 pb-0">
        {["전체", ...categoryList].map((cat) => {
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
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveTabName(cat, tabNameDraft);
                    }
                  }}
                  style={{ minWidth: 48, borderBottom: `2px solid #C17B6B` }}
                />
              ) : (
                <button
                  className={`px-3 py-2 border-b-2 text-[10px] uppercase tracking-widest ${activeCategory === cat ? "font-bold" : ""}`}
                  style={{
                    borderBottom: activeCategory === cat ? "2px solid #C17B6B" : "2px solid transparent",
                    color: activeCategory === cat ? "#C17B6B" : "#2C1810",
                    background: "transparent",
                    transition: "background 0.2s, border 0.2s, color 0.2s",
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
        {canAddCategory && (
          <button
            className="px-3 py-2 border-b-2 border-transparent text-[10px] uppercase tracking-widest text-[#C17B6B]"
            style={{ background: "transparent" }}
            onClick={() => setShowCategoryModal(true)}
          >
            +
          </button>
        )}
      </div>
      {/* 패널 제목 영역 */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-[#EDE5DC] bg-white">
        {!isEditing ? (
          <h3
            className="text-xs font-bold text-[#2C1810] uppercase tracking-widest select-none"
            style={{
              letterSpacing: "0.18em",
              cursor: canRename ? 'pointer' : 'default',
              borderBottom: canRename ? '1px dashed transparent' : 'none',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onClick={() => canRename && setIsEditing(true)}
            onMouseEnter={e => {
              if (canRename) {
                e.currentTarget.style.borderBottomColor = '#EDE5DC';
                e.currentTarget.style.color = '#7A2828';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderBottomColor = 'transparent';
              e.currentTarget.style.color = '#2C1810';
            }}
            tabIndex={0}
            title={canRename ? '클릭하여 이름 변경' : ''}
          >
            {panelName}
          </h3>
        ) : (
          <input
            ref={panelNameInputRef}
            value={panelName}
            onChange={(e) => setPanelName(e.target.value)}
            onBlur={savePanelName}
            onKeyDown={(e) => {
              if (e.key === "Enter") savePanelName();
            }}
            className="border-b border-[#EDE5DC] px-1 py-0.5 mr-1 text-xs uppercase tracking-widest"
            autoFocus
            style={{ minWidth: 60 }}
          />
        )}
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-1 border border-[#C17B6B] text-[#C17B6B] bg-white rounded-none text-[10px] uppercase tracking-widest outline-none hover:bg-[#FDF8F4] transition mt-2"
              style={{ boxShadow: "none" }}
            >
              + 게시물
            </button>
          )}
        </div>
      </div>
      {/* 게시물 목록 */}
      <div className="flex-1 overflow-y-auto px-5" style={{ overflowX: 'visible' }}>
        {activeCategory === "할일" ? (
          (() => {
            const isOwner = user && ownerEmail === user?.email;
            const canEdit = !!(user && (user.role === "admin" || isOwner));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todoAll = posts.filter(p =>
              p.panelId === id && p.category === "할일" &&
              (() => {
                if (!user) return false;
                const v = p.visibleTo;
                if (!v || v.length === 0) return true;
                if (user.role === "admin") return true;
                if (p.author === user.email) return true;
                return v.includes(user.email ?? "");
              })()
            );

            // 활성 할일: 별표 누른 시각 최신순 → 일반은 작성순
            const activeTodos = todoAll
              .filter(p => !p.completed)
              .sort((a, b) => {
                if (a.starred && !b.starred) return -1;
                if (!a.starred && b.starred) return 1;
                if (a.starred && b.starred) {
                  const aT = a.starredAt ? new Date(a.starredAt).getTime() : 0;
                  const bT = b.starredAt ? new Date(b.starredAt).getTime() : 0;
                  return bT - aT;
                }
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              });

            // 완료 할일 전체 (완료 시각 최신순)
            const completedTodos = todoAll
              .filter(p => p.completed)
              .sort((a, b) => {
                const aT = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                const bT = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                return bT - aT;
              });

            // 오늘 완료 / 이전 완료 분리
            const todayCompleted = completedTodos.filter(p => {
              if (!p.completedAt) return true; // completedAt 없으면 오늘로 처리
              const ct = new Date(p.completedAt);
              return ct >= today && ct < tomorrow;
            });

            const pastCompleted = completedTodos.filter(p => {
              if (!p.completedAt) return false;
              const ct = new Date(p.completedAt);
              return ct < today;
            });

            // 이전 완료 날짜별 그룹핑
            const pastGrouped: Record<string, typeof pastCompleted> = {};
            pastCompleted.forEach(p => {
              const dt = p.completedAt ? new Date(p.completedAt) : new Date();
              const key = dt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
              if (!pastGrouped[key]) pastGrouped[key] = [];
              pastGrouped[key].push(p);
            });

            const formatTime = (d: Date) => {
              const dt = d instanceof Date ? d : new Date(d);
              return dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            };
            const formatDate = (d: Date) => {
              const dt = d instanceof Date ? d : new Date(d);
              return dt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
            };
            const formatDateTime = (d: Date) => {
              const dt = d instanceof Date ? d : new Date(d);
              return dt.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            };

            const CompletedRow = ({ p }: { p: typeof completedTodos[0] }) => {
              const [showTooltip, setShowTooltip] = useState(false);
              const isWork = p.taskType === 'work';
              const isSelected = selectedCompleted.includes(p.id);
              return (
                <div
                  style={{
                    display: 'flex', gap: 8, padding: '6px 0',
                    borderBottom: '1px solid #EDE5DC', alignItems: 'center',
                    position: 'relative',
                    background: isSelected ? '#FFF5F2' : 'transparent',
                  }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {/* 선택 모드 체크박스 */}
                  {selectMode && canEdit && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedCompleted(prev =>
                          prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      style={{ flexShrink: 0, cursor: 'pointer', accentColor: '#C17B6B' }}
                    />
                  )}

                  {/* 복구 버튼 (선택 모드 아닐 때만) */}
                  {!selectMode && canEdit && (
                    <button
                      onClick={async () => {
                        await usePostStore.getState().updatePost(p.id, {
                          completed: false,
                          completedAt: null,
                        });
                      }}
                      style={{ fontSize: 10, color: '#C17B6B', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="할일로 복구"
                    >
                      ✓
                    </button>
                  )}
                  <span style={{ fontSize: 11, color: '#9E8880', textDecoration: 'line-through', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.content}
                  </span>
                  <span style={{ fontSize: 9, padding: '1px 5px', background: isWork ? '#FFF5F2' : '#F5F0EE', color: isWork ? '#C17B6B' : '#9E8880', flexShrink: 0 }}>
                    {isWork ? '업무' : '개인'}
                  </span>
                  <span style={{ fontSize: 10, color: '#C4B8B0', flexShrink: 0 }}>
                    {p.completedAt ? formatTime(new Date(p.completedAt)) : '-'}
                  </span>
                  {/* 호버 툴팁 */}
                  {showTooltip && !selectMode && (
                    <div style={{
                      position: 'absolute', bottom: '100%', right: 0,
                      background: '#2C1810', color: '#FDF8F4',
                      fontSize: 10, padding: '4px 8px', whiteSpace: 'nowrap',
                      zIndex: 20, pointerEvents: 'none',
                    }}>
                      작성 {formatDateTime(new Date(p.createdAt))} → 완료 {p.completedAt ? formatDateTime(new Date(p.completedAt)) : '-'}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <>
                {activeTodos.length === 0 && !showCompleted && (
                  <p className="text-[#C1B6A6] text-center text-xs py-4">할일이 없습니다</p>
                )}
                {activeTodos.map(post => (
                  <TodoItem key={post.id} post={post} canEdit={canEdit} />
                ))}

                {/* 완료된 할일 토글 버튼 */}
                <button
                  onClick={() => setShowCompleted(v => !v)}
                  style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'left' }}
                >
                  {showCompleted ? '▲ 완료된 할일 숨기기' : `▼ 완료된 할일 보기 (${completedTodos.length})`}
                </button>

                {showCompleted && (
                  <>
                    {canEdit && completedTodos.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, padding: '6px 0', alignItems: 'center', borderBottom: '1px solid #EDE5DC' }}>
                        {/* 선택 모드 토글 */}
                        <button
                          onClick={() => {
                            setSelectMode(v => !v);
                            setSelectedCompleted([]);
                          }}
                          style={{ fontSize: 10, color: selectMode ? '#C17B6B' : '#9E8880', background: 'none', border: `1px solid ${selectMode ? '#C17B6B' : '#EDE5DC'}`, cursor: 'pointer', padding: '2px 8px', letterSpacing: '0.04em' }}
                        >
                          {selectMode ? '선택 취소' : '선택'}
                        </button>

                        {/* 선택 삭제 */}
                        {selectMode && selectedCompleted.length > 0 && (
                          <button
                            onClick={async () => {
                              for (const id of selectedCompleted) {
                                await usePostStore.getState().deletePost(id);
                              }
                              setSelectedCompleted([]);
                              setSelectMode(false);
                            }}
                            style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: '1px solid #C17B6B', cursor: 'pointer', padding: '2px 8px' }}
                          >
                            선택 삭제 ({selectedCompleted.length})
                          </button>
                        )}

                        {/* 전체 삭제 */}
                        {!selectMode && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`완료된 할일 ${completedTodos.length}개를 모두 삭제할까요?`)) return;
                              for (const p of completedTodos) {
                                await usePostStore.getState().deletePost(p.id);
                              }
                              setSelectedCompleted([]);
                              setSelectMode(false);
                            }}
                            style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: '1px solid #C17B6B', cursor: 'pointer', padding: '2px 8px' }}
                          >
                            전체 삭제 ({completedTodos.length})
                          </button>
                        )}
                      </div>
                    )}

                  <div style={{ borderTop: '1px solid #EDE5DC', paddingTop: 4 }}>
                    {/* 오늘 완료 */}
                    {todayCompleted.length === 0 && pastCompleted.length === 0 && (
                      <p style={{ fontSize: 11, color: '#C4B8B0', padding: '8px 0' }}>완료된 할일이 없습니다</p>
                    )}
                    {todayCompleted.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, color: '#C4B8B0', padding: '6px 0 2px', letterSpacing: '0.06em' }}>오늘</div>
                        {todayCompleted.map(p => <CompletedRow key={p.id} p={p} />)}
                      </>
                    )}

                    {/* 이전 완료 - 날짜별 그룹 */}
                    {pastCompleted.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, color: '#C4B8B0', padding: '8px 0 2px', letterSpacing: '0.06em', borderTop: todayCompleted.length > 0 ? '1px solid #EDE5DC' : 'none', marginTop: todayCompleted.length > 0 ? 4 : 0 }}>이전</div>
                        {Object.entries(pastGrouped).map(([date, items]) => (
                          <div key={date}>
                            <div style={{ fontSize: 10, color: '#C4B8B0', padding: '4px 0 2px', fontWeight: 600 }}>{date}</div>
                            {items.map(p => <CompletedRow key={p.id} p={p} />)}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  </>
                )}
              </>
            );
          })()
        ) : (
          <>
            {filteredPosts.length === 0 ? (
              <p className="text-[#C1B6A6] text-center text-xs py-4 leading-relaxed">게시물이 없습니다</p>
            ) : (
              <>
                {(showAllPosts ? filteredPosts : filteredPosts.slice(0, 5)).map((post) => (
                  <div key={post.id} style={{ overflow: 'visible' }}>
                    {activeCategory === "전체" && post.category && post.category !== "전체" && (
                      <span style={{
                        fontSize: 9,
                        padding: '1px 6px',
                        marginBottom: 4,
                        display: 'inline-block',
                        letterSpacing: '0.06em',
                        background: post.category === '할일' ? '#FFF5F2'
                          : post.category === '공지' ? '#F5F0EE'
                          : post.category === '메모' ? '#F0F5F5'
                          : '#F5F5F0',
                        color: post.category === '할일' ? '#C17B6B'
                          : post.category === '공지' ? '#7A2828'
                          : post.category === '메모' ? '#5C7A7A'
                          : '#9E8880',
                      }}>
                        {post.category}
                      </span>
                    )}
                    <PostItem post={post} />
                  </div>
                ))}
                {filteredPosts.length > 5 && (
                  <button
                    onClick={() => setShowAllPosts(v => !v)}
                    style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'center' }}
                  >
                    {showAllPosts ? '▲ 접기' : `▼ 더보기 (${filteredPosts.length - 5}개 더)`}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
      {/* CreatePost 모달 */}
      {showCreate && (
        <CreatePost
          panelId={id}
          onClose={() => setShowCreate(false)}
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