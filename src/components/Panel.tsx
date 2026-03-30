

import { useState, useRef, useEffect } from "react";
import { usePostStore } from "@/store/postStore";
import { usePanelStore } from "@/store/panelStore";
import { useAuthStore } from "@/store/authStore";
import PostItem from "./PostItem";
import CreatePost from "./CreatePost";

interface PanelProps {
  id: string;
  name: string;
  ownerEmail?: string | null;
  position?: number;
  categories?: string[];
  color?: string;
}

const DEFAULT_CATEGORIES = ["공지", "결재", "메모"];
const BASE_CATEGORIES = ["전체", ...DEFAULT_CATEGORIES];
const COLOR_SWATCHES = [
  { color: "#81D8D0", name: "티파니 민트" },
  { color: "#F4C0D1", name: "파스텔 핑크" },
  { color: "#B5D4F4", name: "하늘 블루" },
  { color: "#C0DD97", name: "라임 그린" },
  { color: "#FAC775", name: "골드" },
  { color: "#F0997B", name: "코랄" },
  { color: "#AFA9EC", name: "라벤더" },
  { color: "#D3D1C7", name: "웜 그레이" },
];

function withAlpha(hex: string, alpha: number = 0.1) {
  if (!hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) return hex;
  let r, g, b;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function Panel({ id, name, ownerEmail, position, categories, color }: PanelProps) {
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [panelColor, setPanelColor] = useState<string>(color || "#81D8D0");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { posts, deletePost } = usePostStore();
  const { user } = useAuthStore();
  const { updatePanel } = usePanelStore();

  useEffect(() => {
    setPanelColor(color || "#81D8D0");
  }, [color]);

  // 게시물 필터링
  const filteredPosts = posts.filter((post) => {
    if (post.panelId !== id) return false;
    if (activeCategory !== "전체") {
      if (!post.category || post.category !== activeCategory) return false;
    }
    if (!user) return false;
    const userEmail = user.email ?? "";
    const visibleTo = post.visibleTo;
    if (!visibleTo || visibleTo.length === 0) return true;
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

  // 패널 색상 변경
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
            style={{ letterSpacing: "0.18em" }}
            onClick={() => canRename && setIsEditing(true)}
            tabIndex={0}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") savePanelName();
            }}
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
          {canRename && (
            <button
              onClick={() => setShowColorPicker((v) => !v)}
              className="text-base text-[#C17B6B] hover:text-[#5C1F1F]"
              title="패널 색상 변경"
              type="button"
            >
              🎨
            </button>
          )}
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
      <div className="flex-1 overflow-y-auto px-5">
        {filteredPosts.length === 0 ? (
          <p className="text-[#C1B6A6] text-center text-xs py-4 leading-relaxed">게시물이 없습니다</p>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="group relative py-3 border-b border-[#EDE5DC] hover:border-l-2 hover:border-l-[#C17B6B] pl-2"
            >
              <PostItem post={post} />
            </div>
          ))
        )}
      </div>
      {/* CreatePost 모달 */}
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
      {/* 컬러 스와치 팔레트 */}
      {showColorPicker && canRename && (
        <div className="absolute z-50 mt-2 bg-white p-4 rounded shadow-lg border flex flex-col items-center">
          <div className="flex gap-2 mb-2">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.color}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center focus:outline-none transition ${panelColor === swatch.color ? "border-[#222] shadow" : "border-gray-200"}`}
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
                setPanelColor("#81D8D0");
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
    </div>
  );
}