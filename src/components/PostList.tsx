'use client';

import { Post } from '@/store/postStore';
import PostItem from './PostItem';
import { useState } from 'react';

interface PostListProps {
  posts: Post[];
  activeCategory: string;
}

export default function PostList({ posts, activeCategory }: PostListProps) {
  const [showAllPosts, setShowAllPosts] = useState(false);

  if (posts.length === 0) {
    return <p className="text-[#C1B6A6] text-center text-xs py-4 leading-relaxed">게시물이 없습니다</p>;
  }

  const visiblePosts = showAllPosts ? posts : posts.slice(0, 5);

  return (
    <>
      {visiblePosts.map((post) => (
        <div key={post.id} style={{ position: 'relative' }}>
          {activeCategory === '전체' && post.category && post.category !== '전체' && (
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
      {posts.length > 5 && (
        <button
          onClick={() => setShowAllPosts(v => !v)}
          style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'center' }}
        >
          {showAllPosts ? '▲ 접기' : `▼ 더보기 (${posts.length - 5}개 더)`}
        </button>
      )}
    </>
  );
}
