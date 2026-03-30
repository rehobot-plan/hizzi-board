import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import PostItem from './PostItem';

export default function NoticeArea() {
  const { posts } = usePostStore();
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null as null | string);

  // 최신순 공지 3개
  const notices = posts
    .filter(p => p.category === '공지')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, expanded ? 10 : 3);

  if (notices.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded px-0 py-6 mb-4 mt-6">
      <div className="flex items-center justify-between mb-3 px-6">
        <span className="font-bold text-xs text-yellow-800 uppercase tracking-widest">공지사항</span>
        <button
          className="text-xs text-yellow-700 underline ml-auto"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? '접기' : '더보기'}
        </button>
      </div>
      <ul className="divide-y divide-yellow-200">
        {notices.map(notice => (
          <li key={notice.id} className="py-3 px-6 cursor-pointer hover:bg-yellow-100 text-xs flex justify-between items-center">
            <span onClick={() => setDetail(notice.id)} className="flex-1 truncate leading-relaxed">
              [{notice.panelId}] {notice.content.slice(0, 30)}
            </span>
            <span className="ml-2 text-[11px] text-yellow-700 mt-1">{notice.author}</span>
            <span className="ml-2 text-[11px] text-yellow-500 mt-1">{notice.createdAt.toLocaleDateString()}</span>
            {user?.role === 'admin' && (
              <button
                className="ml-2 text-[11px] text-red-400 hover:text-red-600 mt-1"
                onClick={e => { e.stopPropagation(); usePostStore.getState().deletePost(notice.id); }}
              >삭제</button>
            )}
          </li>
        ))}
      </ul>
      {/* 상세 모달 */}
      {detail && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setDetail(null)}>
          <div className="bg-white rounded p-4 min-w-[260px] max-w-xs" onClick={e => e.stopPropagation()}>
            <PostItem post={notices.find(n => n.id === detail)!} />
            <button className="mt-2 px-2 py-1 bg-yellow-100 rounded text-xs w-full" onClick={() => setDetail(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
