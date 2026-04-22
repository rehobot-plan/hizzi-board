

import { useState, useRef, useEffect } from "react";
import { usePostStore } from "@/store/postStore";
import { usePanelStore } from "@/store/panelStore";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { useEscClose } from '@/hooks/useEscClose';
import CreatePost from "./CreatePost";
import TodoRequestBadge from "./TodoRequestBadge";
import TodoList from "./TodoList";
import PostList from "./PostList";
import Avatar from "./common/Avatar";
import { panel as panelTokens } from "@/styles/tokens";

interface PanelProps {
  id: string;
  name: string;
  ownerEmail?: string | null;
  position?: number;
  categories?: string[];
  color?: string;
  /**
   * 렌더 컨텍스트:
   * - 'grid' (기본): 데스크탑 6패널 그리드. max-height min(600px, 70vh) 적용
   * - 'fullscreen': 모바일 상세 모달 등 viewport 전체 차지. max-height 미적용
   */
  variant?: 'grid' | 'fullscreen';
}

// [마이그레이션 필요] 기존 Firestore 카테고리: 결재 → 첨부파일로 변경 필요
const DEFAULT_CATEGORIES = ["할일", "메모"];
const BASE_CATEGORIES = [...DEFAULT_CATEGORIES];



export default function Panel({ id, name, ownerEmail, position, categories, variant = 'grid' }: PanelProps) {
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

  // ─── 스크롤 영역 (main-ux.md §1 패널 높이 + 탭 독립 스크롤) ─
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const [isAtBottom, setIsAtBottom] = useState(false);
  // 펼쳐보기 토글 (오너 제안 · 스크롤 대체 — 콘텐츠 초과 시 ⋯ 버튼으로 max-height 해제)
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  // 탭 전환 시 현재 스크롤 위치 저장 + 복원 (할일·메모 각 독립)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = scrollPositionsRef.current.get(activeCategory) ?? 0;
    el.scrollTop = saved;
  }, [activeCategory]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    scrollPositionsRef.current.set(activeCategory, el.scrollTop);
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 1);
  };

  const { posts, deletePost } = usePostStore();
  const { user } = useAuthStore();
  const { updatePanel } = usePanelStore();
  const users = useUserStore((s) => s.users);
  const owner = ownerEmail ? users.find((u) => u.email === ownerEmail) : null;
  const ownerMeta = owner
    ? [owner.department, owner.position].filter((s) => s && s.trim()).join(' · ')
    : '';



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

  // fade-out 재계산 — 탭 전환 + 콘텐츠 변화(Firestore 실시간·in-place complete/delete)에 연동
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 1);
  }, [activeCategory, filteredPosts.length, posts.length]);

  // 콘텐츠 초과 감지 — handle 노출 여부
  // ResizeObserver: 컨테이너 자체 크기 변화 (뷰포트·grid fr 변화)
  // MutationObserver: 자식 subtree 렌더 변화 (todoFilter·selectMode·비동기 데이터 로드 등)
  // rAF 배치: 동일 tick 내 중복 호출 억제 + 이전값 guard로 state churn 방지
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let rafId = 0;
    const check = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const current = scrollRef.current;
        if (!current) return;
        const next = current.scrollHeight > current.clientHeight + 1;
        setHasOverflow((prev) => (prev === next ? prev : next));
      });
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      mo.disconnect();
    };
  }, [activeCategory, isExpanded]);

  // 카테고리 전환 시 펼침 상태 리셋 — 아이템 적은 카테고리에서 handle 잔존 방지
  useEffect(() => {
    setIsExpanded(false);
  }, [activeCategory]);

  // 펼쳐보기 토글 — 접힘 시 scrollTop 0 복귀 + 페이지 scroll 위치 보존(rAF 2회 복원)
  const toggleExpand = () => {
    const savedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    setIsExpanded((prev) => {
      const next = !prev;
      if (!next) {
        const el = scrollRef.current;
        if (el) el.scrollTop = 0;
        scrollPositionsRef.current.set(activeCategory, 0);
      }
      return next;
    });
    // setState 이후 React commit → 브라우저 layout → scroll anchor·focus 재조정이 여기 끼어들 수 있어
    // rAF 2회(commit + paint 이후)에 window.scrollY를 원래대로 복원. viewport jump 차단.
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - savedScrollY) > 1) {
            window.scrollTo({ top: savedScrollY, behavior: 'auto' });
          }
        });
      });
    }
  };

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

  const showHandle = variant === 'grid' && (hasOverflow || isExpanded);

  return (
    <>
    <div
      className="panel-draggable flex flex-col border border-[#EDE5DC] bg-white rounded-none p-0 shadow-sm"
      draggable="true"
      data-panel-id={id}
      data-testid="panel-container"
      data-panel-variant={variant}
      style={{
        ...(variant === 'grid'
          ? {
              position: 'relative',
              maxHeight: isExpanded ? 'none' : panelTokens.height.max,
              minHeight: panelTokens.height.min,
              overflow: 'hidden',
              overflowAnchor: 'none',
              minWidth: 0,
            }
          : { position: 'relative', height: '100%', overflow: 'hidden', minWidth: 0 }),
        transition: "background 0.2s, border 0.2s",
      }}
    >
      {/* 헤더: 패널명 행 + 탭 행 분리 */}
      <div className="border-b border-[#EDE5DC] bg-[#FDF8F4]">
        {/* 패널명 행 — 아바타(40px) + 이름 */}
        <div
          data-testid="panel-title-row"
          className="px-5 pt-3 pb-2 flex items-center gap-3"
          style={{ borderBottom: '0.5px solid rgba(237,229,220,0.6)' }}
        >
          {ownerEmail && (
            <Avatar photoURL={owner?.photoURL} name={owner?.name || ownerEmail} size={40} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {!isEditing ? (
              <span
                style={{
                  fontSize: 16, fontWeight: 700, color: '#2C1810',
                  letterSpacing: '0.02em', cursor: canRename ? 'pointer' : 'default',
                  transition: 'color 0.15s',
                }}
                onClick={() => canRename && setIsEditing(true)}
                onMouseEnter={e => { if (canRename) (e.currentTarget as HTMLElement).style.color = '#7A2828'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#2C1810'; }}
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
                style={{ fontSize: 16, fontWeight: 700, border: 'none', borderBottom: '1px solid #EDE5DC', outline: 'none', background: 'transparent', color: '#2C1810', minWidth: 80 }}
                autoFocus
              />
            )}
            {ownerMeta && (
              <span
                data-testid="panel-owner-meta"
                style={{ fontSize: 11, fontWeight: 400, color: '#9E8880' }}
              >
                {ownerMeta}
              </span>
            )}
          </div>
        </div>
        {/* 탭 행 — 카테고리 탭(좌) → 봉투(우) 순서, 우측 정렬 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 36, paddingRight: 20 }}>
          {categoryList.map((cat) => {
            const isBase = BASE_CATEGORIES.includes(cat);
            return (
              <div key={cat} className="relative flex items-center group">
                {editingTab === cat ? (
                  <input
                    style={{ height: 36, padding: '0 12px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none', borderBottom: '2px solid #C17B6B', outline: 'none', minWidth: 48 }}
                    value={tabNameDraft}
                    autoFocus
                    onChange={(e) => setTabNameDraft(e.target.value)}
                    onBlur={() => saveTabName(cat, tabNameDraft)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveTabName(cat, tabNameDraft); } }}
                  />
                ) : (
                  <button
                    style={{
                      height: 36, padding: '0 12px',
                      borderBottom: activeCategory === cat ? '2px solid #C17B6B' : '2px solid transparent',
                      color: activeCategory === cat ? '#C17B6B' : '#9E8880',
                      background: 'transparent', border: 'none',
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                      fontWeight: activeCategory === cat ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                    onClick={() => setActiveCategory(cat)}
                    onDoubleClick={() => { if (!isBase && canAddCategory) { setEditingTab(cat); setTabNameDraft(cat); } }}
                    type="button"
                  >
                    {cat}
                  </button>
                )}
                {canAddCategory && !isBase && (
                  <button
                    className="ml-0.5 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="탭 삭제"
                    onClick={() => { setDeleteTarget(cat); setShowDeleteModal(true); }}
                    type="button"
                  >×</button>
                )}
              </div>
            );
          })}
          {(isOwner || user?.role === 'admin') && ownerEmail && (
            <div style={{ display: 'flex', alignItems: 'center', height: 36, paddingLeft: 12 }}>
              <TodoRequestBadge panelOwnerEmail={ownerEmail} />
            </div>
          )}
        </div>
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
      {/* 게시물 목록 — scroll div가 card의 직접 flex child (main-ux.md §1). */}
      {/* height:100% 체인 대신 flex:1 1 auto + minHeight:0으로 shrink → card max-height 안에서 정확히 남은 공간 차지. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-testid="panel-scroll"
        className="panel-scroll px-5"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
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
            key={activeCategory}
            posts={filteredPosts}
            activeCategory={activeCategory}
            panelId={id}
            canEdit={!!(user && (user.role === 'admin' || ownerEmail === user?.email))}
            selectMode={memoSelectMode}
            onSelectModeChange={setMemoSelectMode}
          />
        )}
      </div>
      {/* 하단 fade-out — card 기준 absolute (panel-draggable position:relative). 스크롤 끝 도달 시 사라짐. 펼친 상태에선 숨김. */}
      {!isExpanded && (
        <div
          aria-hidden="true"
          data-testid="panel-scroll-fade"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: panelTokens.fadeOut.height,
            background: panelTokens.fadeOut.gradient,
            pointerEvents: 'none',
            opacity: isAtBottom ? 0 : 1,
            transition: 'opacity 0.15s ease',
          }}
        />
      )}
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
                className="px-2 py-1 bg-[#C17B6B] text-white rounded-md hover:bg-[#A86855] text-xs"
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
      {showHandle && (
        <button
          type="button"
          onClick={toggleExpand}
          onMouseDown={(e) => e.preventDefault()}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? '접기' : '펼쳐보기'}
          title={isExpanded ? '접기' : '펼쳐보기'}
          data-testid="panel-expand-handle"
          style={{
            position: 'absolute',
            bottom: -9,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 44,
            height: 18,
            borderRadius: 9,
            background: '#FFFFFF',
            border: '1px solid #C4B8B0',
            color: '#C4B8B0',
            boxShadow: '0 1px 3px rgba(44,20,16,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            zIndex: 3,
            transition: 'color 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#9E8880';
            e.currentTarget.style.borderColor = '#9E8880';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#C4B8B0';
            e.currentTarget.style.borderColor = '#C4B8B0';
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          >
            <path d="M6 9 L12 15 L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  );
}