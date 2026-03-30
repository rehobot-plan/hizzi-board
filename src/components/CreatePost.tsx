'use client';

import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

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
  const { users } = useUserStore();
  const { addPost } = usePostStore();
  const { user } = useAuthStore();

  const [attachments, setAttachments] = useState<{ name: string; url: string; size: number; type: string }[]>([]);
  const [fileError, setFileError] = useState('');

  // 파일 처리 함수 (이미지/첨부파일 모두 처리)
  const handleFile = async (file: File) => {
    setFileError('');
    const ALLOWED_TYPES = [
      'image/', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        setFileError('이미지 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError('최대 20MB까지 업로드 가능합니다.');
        return;
      }
      setLoading(true);
      try {
        const storage = getStorage();
        const ext = file.name.split('.').pop();
        const storageRef = ref(storage, `images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setType('image');
        setContent(url);
        setDroppedFilename(file.name);
      } catch (e) {
        setFileError('이미지 업로드 실패');
      } finally {
        setLoading(false);
      }
      return;
    }
    // 첨부파일 (PDF, 엑셀, 워드, PPTX)
    if (!ALLOWED_TYPES.some(t => file.type.startsWith(t) || file.type === t)) {
      setFileError('지원하지 않는 파일 형식입니다.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('최대 20MB까지 업로드 가능합니다.');
      return;
    }
    try {
      const storage = getStorage();
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `attachments/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setAttachments(prev => [...prev, { name: file.name, url, size: file.size, type: file.type }]);
    } catch (e) {
      setFileError('파일 업로드 실패');
    }
  };

  // 드래그&드롭 파일 처리
  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  // 파일 선택 input 처리
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await handleFile(file);
  };

  // 게시물 작성 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!content.trim() && attachments.length === 0) || loading) return;
    setLoading(true);
    try {
      await addPost({
        panelId,
        type,
        content: content.trim(),
        author: user.email || 'Anonymous',
        category: category || undefined,
        visibleTo: visibleTo.length > 0 ? visibleTo : ['all'],
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setContent('');
      setCategory('');
      setVisibleTo(['all']);
      setAttachments([]);
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
            <label className="block text-sm font-medium text-gray-700 mb-2">공개 범위</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                className={`px-3 py-1 rounded border ${visibleTo.includes('all') ? 'bg-[#81D8D0] text-white border-[#81D8D0]' : 'bg-white text-gray-700 border-gray-300'} transition`}
                onClick={() => setVisibleTo(['all'])}
                disabled={loading}
              >
                전체 공개
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded border ${visibleTo.includes('me') ? 'bg-[#81D8D0] text-white border-[#81D8D0]' : 'bg-white text-gray-700 border-gray-300'} transition`}
                onClick={() => setVisibleTo(['me'])}
                disabled={loading}
              >
                나만 보기
              </button>
            </div>
            <div className="mb-1 text-xs text-gray-500">또는 특정인 선택:</div>
            <div className="flex flex-wrap gap-2">
              {users.filter(u => u.email !== user?.email && u.role !== 'admin').map(u => (
                <button
                  key={u.id}
                  type="button"
                  className={`px-3 py-1 rounded border ${visibleTo.includes(u.email) ? 'bg-[#81D8D0] text-white border-[#81D8D0]' : 'bg-white text-gray-700 border-gray-300'} transition`}
                  onClick={() => {
                    let next: string[];
                    if (visibleTo.includes('all')) next = [u.email];
                    else if (visibleTo.includes(u.email)) next = visibleTo.filter(v => v !== u.email);
                    else next = [...visibleTo.filter(v => v !== 'all' && v !== 'me'), u.email];
                    setVisibleTo(next.length === 0 ? ['all'] : next);
                  }}
                  disabled={loading}
                >
                  {u.name}
                  {visibleTo.includes(u.email) && ' ✓'}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-1">(클릭 시 민트색 활성화, 여러 명 선택 가능)</div>
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
            {loading && type === 'image' && (
              <div className="text-xs text-gray-500 mt-2">이미지 업로드 중...</div>
            )}
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