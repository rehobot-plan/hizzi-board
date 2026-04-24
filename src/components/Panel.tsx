

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
import FAB from "./common/FAB";
import RecordModal from "./RecordModal";
import Calendar from "./calendar/Calendar";
import { canViewPost } from "@/lib/postSelectors";
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
  // 블록 ③-B — 탭 행 우측 ··· 드롭다운(3층 진입 허브) + 3층 "기록" 모달
  const [showMenu, setShowMenu] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // 블록 ⑤ 달력 피어 탭 — FAB 외부 트리거 signal
  const [calendarAddSignal, setCalendarAddSignal] = useState(0);

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
    return canViewPost(post, user ? { email: user.email, role: user.role } : null);
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

  // click 시점의 scrollY는 mousedown/focus/layout 경로에서 이미 오염됐을 수 있어
  // hover·focus·touch 진입 시점(jump 이전)에 의도된 scrollY를 선기록한다.
  // 이 ref가 비어 있을 땐(예: 프로그래매틱 click) click 시점 scrollY로 폴백.
  const intentScrollYRef = useRef<number | null>(null);
  const captureIntentScrollY = () => {
    if (typeof window !== 'undefined') {
      intentScrollYRef.current = window.scrollY;
    }
  };

  // 능동 scroll 정렬용 ref — 패널 card 측정 + 중복 실행 lock
  const cardRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // 펼쳐보기 토글 — Phase 1 능동 scroll 정렬 (+ 데스크탑/토글 조건 미충족 시 기존 5층 방어)
  const toggleExpand = () => {
    if (typeof window === 'undefined') {
      setIsExpanded((prev) => !prev);
      return;
    }

    // 중복 실행 방지 — smooth scroll 진행 중 재클릭 drop (queue 아님)
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    window.setTimeout(() => { isScrollingRef.current = false; }, 400);

    // Internal rollback toggle: localStorage.setItem('hizzi:activeScrollDisabled','true')
    // DevTools console에서 설정 · UI 노출 없음. 해제: localStorage.removeItem('hizzi:activeScrollDisabled')
    const activeScrollDisabled =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('hizzi:activeScrollDisabled') === 'true';
    const isDesktop = window.innerWidth >= 768;
    const useActiveScroll = !activeScrollDisabled && isDesktop && variant === 'grid';

    // 기존 5층 방어 — 능동 scroll 비활성 조건일 때만 작동. 능동 scroll이 쓰일 땐 방어와 간섭되니 실행 자체 skip.
    if (!useActiveScroll) {
      const savedScrollY = intentScrollYRef.current ?? window.scrollY;
      intentScrollYRef.current = null;
      let active = true;
      const restore = () => {
        if (!active) return;
        if (Math.abs(window.scrollY - savedScrollY) > 1) {
          window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
        }
      };
      const onScroll = () => restore();
      window.addEventListener('scroll', onScroll, { passive: true });
      requestAnimationFrame(() => {
        restore();
        requestAnimationFrame(restore);
      });
      window.setTimeout(() => {
        active = false;
        window.removeEventListener('scroll', onScroll);
      }, 800);
    } else {
      // 능동 scroll 모드에선 intent 기록 리셋만 (복원 로직 미사용)
      intentScrollYRef.current = null;
    }

    setIsExpanded((prev) => {
      const next = !prev;
      if (!next) {
        const el = scrollRef.current;
        if (el) el.scrollTop = 0;
        scrollPositionsRef.current.set(activeCategory, 0);
      }
      return next;
    });

    // 능동 scroll 정렬 — 레이아웃 안정 후(rAF 2프레임) panel top을 viewport 상단 근처로 정렬
    if (useActiveScroll) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const cardEl = cardRef.current;
          if (!cardEl) return;
          const top = cardEl.getBoundingClientRect().top;
          // 이미 viewport 상단 근처 → scroll 생략 (rangeless no-op)
          if (top >= 0 && top <= 100) return;
          const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          cardEl.scrollIntoView({
            behavior: reducedMotion ? ('instant' as ScrollBehavior) : 'smooth',
            block: 'start',
          });
        });
      });
    }
  };

  const isOwner = user && ownerEmail === user?.email;
  const canCreate = user && (user.role === "admin" || isOwner);
  const canRename = user && (user.role === "admin" || isOwner);
  const canAddCategory = canCreate;

  useEscClose(() => setMemoSelectMode(false), memoSelectMode);
  useEscClose(() => setShowMenu(false), showMenu);

  // 바깥 클릭 시 드롭다운 닫힘
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // RecordModal은 기본 카테고리(할일·메모) 전용. 사용자 정의 탭·달력 탭으로 전환 시 열린 메뉴·모달 리셋.
  const isRecordableCategory = activeCategory === '할일' || activeCategory === '메모';
  useEffect(() => {
    if (!isRecordableCategory) {
      setShowMenu(false);
      setShowRecord(false);
    }
  }, [isRecordableCategory]);

  // 블록 ⑤ — 수평 스와이프 액셀러레이터 (할일 ↔ 메모 ↔ 달력). 탭 탭핑 기본 · 스와이프 보조.
  // 임계 60px, 수직보다 수평이 2배 이상이어야 스와이프로 인정(스크롤 간섭 방지).
  const SWIPE_ORDER = ['할일', '메모', '달력'] as const;
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleSwipeStart = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return; // 데스크탑 마우스는 드래그 스와이프 제외(텍스트 선택 간섭 회피)
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleSwipeMove = (_e: React.PointerEvent) => {
    // 별도 추적 불필요 — start/end만으로 판정
  };

  const handleSwipeEnd = (e: React.PointerEvent) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dx) < Math.abs(dy) * 2) return;
    const cur = SWIPE_ORDER.indexOf(activeCategory as (typeof SWIPE_ORDER)[number]);
    if (cur === -1) return;
    const next = dx < 0 ? cur + 1 : cur - 1;
    if (next < 0 || next >= SWIPE_ORDER.length) return;
    setActiveCategory(SWIPE_ORDER[next]);
  };

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
      ref={cardRef}
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
        {/* 블록 ⑤ — '달력' 피어 탭. categoryList엔 저장 안 함(기본 탭과 동일 레벨 고정). */}
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
          <button
            type="button"
            data-testid="panel-tab-calendar"
            onClick={() => setActiveCategory('달력')}
            style={{
              height: 36, padding: '0 12px',
              borderBottom: activeCategory === '달력' ? '2px solid #C17B6B' : '2px solid transparent',
              color: activeCategory === '달력' ? '#C17B6B' : '#9E8880',
              background: 'transparent', border: 'none',
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
              fontWeight: activeCategory === '달력' ? 700 : 400,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            달력
          </button>
          {(isOwner || user?.role === 'admin') && ownerEmail && (
            <div style={{ display: 'flex', alignItems: 'center', height: 36, paddingLeft: 12 }}>
              <TodoRequestBadge panelOwnerEmail={ownerEmail} />
            </div>
          )}
          {canCreate && isRecordableCategory && (
            <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 36, paddingLeft: 8 }}>
              <button
                type="button"
                onClick={() => setShowMenu(v => !v)}
                aria-haspopup="menu"
                aria-expanded={showMenu}
                aria-label="패널 메뉴"
                data-testid="panel-menu-button"
                style={{
                  width: 24, height: 24, padding: 0,
                  background: 'transparent', border: 'none',
                  color: showMenu ? '#5C1F1F' : '#9E8880',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, letterSpacing: '0.08em', lineHeight: 1,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#5C1F1F')}
                onMouseLeave={e => (e.currentTarget.style.color = showMenu ? '#5C1F1F' : '#9E8880')}
              >
                ⋯
              </button>
              {showMenu && (
                <div
                  role="menu"
                  data-testid="panel-menu-popover"
                  style={{
                    position: 'absolute', top: 32, right: 0,
                    background: '#FFFFFF', border: '1px solid #EDE5DC',
                    boxShadow: '0 4px 12px rgba(44,20,16,0.08)',
                    minWidth: 120, zIndex: 20,
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="panel-menu-record"
                    onClick={() => { setShowMenu(false); setShowRecord(true); }}
                    style={{
                      display: 'block', width: '100%',
                      padding: '10px 14px', fontSize: 12, color: '#5C1F1F',
                      background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left', letterSpacing: '0.04em',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F5EFE9')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    기록
                  </button>
                </div>
              )}
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
      </div>
      {/* 게시물 목록 — scroll div가 card의 직접 flex child (main-ux.md §1). */}
      {/* height:100% 체인 대신 flex:1 1 auto + minHeight:0으로 shrink → card max-height 안에서 정확히 남은 공간 차지. */}
      {/* paddingBottom: FAB 겹침 회피 — FAB bottom(14) + height(44) + 여유(14) = 72. canCreate=false이면 FAB 없으므로 0. */}
      {/* 달력 탭은 월 그리드 특성상 내부 스크롤 예외(main-ux.md 1.2 · 5). overflow:visible + paddingBottom:0. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-testid="panel-scroll"
        className="panel-scroll px-5"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: activeCategory === '달력' ? 'visible' : 'auto',
          paddingBottom: activeCategory === '달력' ? 0 : (canCreate ? 72 : 0),
        }}
        onPointerDown={handleSwipeStart}
        onPointerMove={handleSwipeMove}
        onPointerUp={handleSwipeEnd}
        onPointerCancel={handleSwipeEnd}
      >
        {activeCategory === "할일" ? (
          <TodoList
            panelId={id}
            ownerEmail={ownerEmail}
            posts={posts}
            canEdit={!!(user && (user.role === 'admin' || ownerEmail === user?.email))}
            activeFilter={todoFilter}
          />
        ) : activeCategory === '달력' ? (
          <Calendar
            panelMode
            panelOwnerEmail={ownerEmail ?? undefined}
            openAddSignal={calendarAddSignal}
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
      {/* FAB — 패널 우하단 44px 진입점 (main-ux.md §4.1 · patterns.md P10 · uxui.md FAB 토큰).
          activeCategory를 CreatePost defaultCategory로 전달해 context-aware 동작.
          달력 탭 FAB prefill은 블록 ⑤(달력 피어 탭) 이후 이관. */}
      {canCreate && (
        <FAB
          onClick={() => {
            if (activeCategory === '달력') {
              setCalendarAddSignal(n => n + 1);
            } else {
              setShowCreate(true);
            }
          }}
          ariaLabel={
            activeCategory === '달력' ? '일정 추가' :
            activeCategory === '메모' ? '빠른 메모 추가' : '빠른 할일 추가'
          }
        />
      )}
      {/* 3층 "기록" 모달 — windowFilter='all' (전체). 1·2층은 TodoList/PostList 내부 'recent' 별도 호출. 기본 카테고리(할일·메모) 전용. */}
      {isRecordableCategory && (
        <RecordModal
          isOpen={showRecord}
          onClose={() => setShowRecord(false)}
          panelId={id}
          category={activeCategory === '메모' ? '메모' : '할일'}
          defaultTab={activeCategory === '메모' ? 'deleted' : 'completed'}
          windowFilter="all"
          canEdit={!!canCreate}
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
          onMouseEnter={(e) => {
            captureIntentScrollY();
            e.currentTarget.style.color = '#9E8880';
            e.currentTarget.style.borderColor = '#9E8880';
          }}
          onPointerEnter={captureIntentScrollY}
          onFocus={captureIntentScrollY}
          onTouchStart={captureIntentScrollY}
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