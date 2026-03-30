'use client';

import { useState } from 'react';
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

const DEFAULT_CATEGORIES = ['공지', '결제', '메모'];

export default function Panel({ id, name, ownerEmail, position, categories }: PanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [panelName, setPanelName] = useState(name);
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryList, setCategoryList] = useState<string[]>(categories || DEFAULT_CATEGORIES);

  const { posts } = usePostStore();
  const { user } = useAuthStore();
  const { updatePanel } = usePanelStore();

  // 게시물 필터링 (카테고리, 공개범위)
  const filteredPosts = posts.filter((post) => {
    if (post.panelId !== id) return false;
    if (activeCategory !== '전체') {
      if (!post.category || post.category !== activeCategory) return false;
    }
    // 공개범위: visibleTo가 없으면 전체, 있으면 본인 또는 관리자만
    if (post.visibleTo && Array.isArray(post.visibleTo)) {
      if (!user) return false;
      const userEmail = user.email ?? '';
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

  // 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const updated = [...categoryList, newCategory.trim()];
    setCategoryList(updated);
    setNewCategory('');
    setShowCategoryModal(false);
    await updatePanel(id, { categories: updated });
  };

  return (
    <div className="bg-white border-2 border-[#81D8D0] rounded-lg p-4 flex flex-col h-full">
      {/* 바인더 탭 */}
      <div className="flex gap-2 mb-2">
        {['전체', ...categoryList].map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1 rounded-t-lg border-b-2 ${activeCategory === cat ? 'border-[#81D8D0] bg-[#e0f7f5] font-bold' : 'border-transparent bg-gray-100'} text-sm`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
        {canAddCategory && (
          <button
            className="px-3 py-1 rounded-t-lg border-b-2 border-transparent bg-gray-100 text-sm"
            onClick={() => setShowCategoryModal(true)}
          >
            +
          </button>
        )}
      </div>
      {/* 패널 헤더 */}
      <div className="flex justify-between items-center mb-4">
        {!isEditing ? (
          <h3
            className={`text-xl font-semibold text-gray-800 ${canRename ? 'cursor-pointer hover:text-[#81D8D0]' : ''}`}
            onClick={() => canRename && setIsEditing(true)}
          >
            {panelName}
          </h3>
        ) : (
          <div className="flex gap-2">
            <input
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
              className="px-2 py-1 border rounded text-base"
            />
            <button
              onClick={savePanelName}
              className="px-2 py-1 bg-[#81D8D0] text-white rounded"
            >
              저장
            </button>
          </div>
        )}
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