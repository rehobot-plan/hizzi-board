'use client';

import { useState, useRef } from 'react';
import { Post, usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();
  const { updatePost, deletePost } = usePostStore();

  // 권한 확인: 본인 또는 관리자만 편집/삭제 가능
  const canEdit = user && (user.email === post.author || user.role === 'admin');

  // 우클릭 컨텍스트 메뉴 (웹)
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // 길게 누르기 시작 (모바일)
  const handleTouchStart = () => {
    if (!canEdit) return;
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ x: 0, y: 0 }); // 모바일은 위치 대신 모달로 표시
    }, 500);
  };

  // 길게 누르기 취소
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 외부 클릭 시 메뉴 닫기
  const handleClickOutside = () => {
    setContextMenu(null);
  };

  // 편집 처리
  const handleEdit = async () => {
    if (!editContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      await updatePost(post.id, { content: editContent.trim() });
      setIsEditOpen(false);
      setContextMenu(null);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('게시물 수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      setContextMenu(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시물 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderContent = () => {
    switch (post.type) {
      case 'text':
        return <p className="text-gray-800">{post.content}</p>;
      case 'image':
        const imageSrc =
          post.content?.trim() && post.content !== 'Post image'
            ? post.content
            : '/time-pad.jpg';

        if (imageError) {
          return <p className="text-gray-500 italic">이미지 로드에 실패했습니다.</p>;
        }

        return (
          <img
            src={imageSrc}
            alt="Post image"
            className="max-w-full h-auto rounded cursor-pointer hover:opacity-90"
            onClick={() => setIsModalOpen(true)}
            onError={() => setImageError(true)}
          />
        );
      case 'link':
        return (
          <a href={post.content} target="_blank" rel="noopener noreferrer" className="text-[#81D8D0] hover:underline">
            {post.content}
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className="bg-gray-50 p-3 rounded mb-2 border relative cursor-default"
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClickOutside}
      >
        {renderContent()}
        <div className="text-xs text-gray-500 mt-1">
          {post.author} • {post.createdAt.toLocaleString()}
        </div>
      </div>

      {/* 우클릭/길게 누르기 컨텍스트 메뉴 */}
      {contextMenu && canEdit && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClickOutside}
        >
          <div
            className="fixed bg-white rounded shadow-lg border border-gray-300 z-50 min-w-max"
            style={{
              top: contextMenu.x === 0 ? '50%' : `${contextMenu.y}px`,
              left: contextMenu.x === 0 ? '50%' : `${contextMenu.x}px`,
              transform: contextMenu.x === 0 ? 'translate(-50%, -50%)' : 'translate(0, 0)',
            }}
          >
            <button
              onClick={() => {
                setEditContent(post.content);
                setIsEditOpen(true);
                setContextMenu(null);
              }}
              className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
            >
              편집
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 disabled:opacity-50"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {isModalOpen && post.type === 'image' && !imageError && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              className="absolute top-2 right-2 z-10 text-white bg-black bg-opacity-30 rounded-full px-2 py-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
            >
              닫기
            </button>
            <img
              src={post.content}
              alt="Post image enlarged"
              className="max-h-[90vh] max-w-[90vw] rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* 편집 모달 */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">게시물 편집</h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#81D8D0] focus:border-[#81D8D0]"
              rows={4}
              disabled={isUpdating}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isUpdating}
              >
                취소
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-[#81D8D0] text-white rounded-md hover:bg-[#6BC4BB] disabled:opacity-50"
                disabled={isUpdating}
              >
                {isUpdating ? '수정 중...' : '수정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}