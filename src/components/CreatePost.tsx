'use client';

import { useState } from 'react';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';

interface CreatePostProps {
  panelId: string;
  onClose: () => void;
  categories?: string[];
}

export default function CreatePost({ panelId, onClose, categories }: CreatePostProps) {
  const [type, setType] = useState<'text' | 'image' | 'link'>('text');
  const [category, setCategory] = useState<string>('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [droppedFilename, setDroppedFilename] = useState('');
  const [visibleTo, setVisibleTo] = useState<string[]>(['all']);
  const { addPost } = usePostStore();
  const { user } = useAuthStore();

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setType('image');
        setContent(reader.result);
        setDroppedFilename(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || loading) return;

    setLoading(true);
    try {
      await addPost({
        panelId,
        type,
        content: content.trim(),
        author: user.email || 'Anonymous',
        category: category || undefined,
        visibleTo: visibleTo.length > 0 ? visibleTo : ['all'],
      });
      setContent('');
      setCategory('');
      setVisibleTo(['all']);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('게시물 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">새 게시물 작성</h3>
        <form onSubmit={handleSubmit}>
          {/* 카테고리 선택 */}
          {categories && categories.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#81D8D0] focus:border-[#81D8D0]"
                disabled={loading}
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
          {/* 공개범위 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">공개범위</label>
            <select
              multiple
              value={visibleTo}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                setVisibleTo(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#81D8D0] focus:border-[#81D8D0]"
              disabled={loading}
            >
              <option value="all">전체 공개</option>
              <option value="me">나만 보기</option>
              {/* 필요시 추가 옵션 */}
            </select>
            <div className="text-xs text-gray-500 mt-1">Ctrl(또는 Cmd) 클릭으로 다중 선택</div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">타입</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'text' | 'image' | 'link')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#81D8D0] focus:border-[#81D8D0]"
              disabled={loading}
            >
              <option value="text">텍스트</option>
              <option value="image">이미지</option>
              <option value="link">링크</option>
            </select>
          </div>
          <div
            className={`mb-4 ${type === 'image' ? 'border border-dashed border-[#81D8D0] p-3' : ''}`}
            onDragOver={(e) => {
              if (type === 'image') {
                e.preventDefault();
                setDragActive(true);
              }
            }}
            onDragLeave={(e) => {
              if (type === 'image') {
                e.preventDefault();
                setDragActive(false);
              }
            }}
            onDrop={(e) => type === 'image' && onDrop(e)}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {type === 'text' ? '내용' : type === 'image' ? '이미지 URL 또는 파일' : '링크 URL'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#81D8D0] focus:border-[#81D8D0]"
              rows={4}
              placeholder={
                type === 'text'
                  ? '텍스트를 입력하세요'
                  : type === 'image'
                  ? '이미지 URL을 붙여넣거나 파일을 드래그 앤 드롭하세요.'
                  : 'URL을 입력하세요'
              }
              required
              disabled={loading}
            />
            {type === 'image' && (
              <>
                <div className="my-2 text-xs text-gray-500">
                  {dragActive ? '파일을 여기로 놓으세요...' : '드래그 앤 드롭 또는 아래에서 선택'}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="px-3 py-2 bg-[#81D8D0] text-white rounded cursor-pointer hover:bg-[#6BC4BB]"
                  >
                    파일 선택
                  </label>
                  {droppedFilename && <span className="text-sm text-gray-600">선택됨: {droppedFilename}</span>}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#81D8D0] text-white rounded-md hover:bg-[#6BC4BB] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '작성 중...' : '작성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}