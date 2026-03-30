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
}

export default function Panel({ id, name, ownerEmail, position }: PanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [panelName, setPanelName] = useState(name);
  const [dragging, setDragging] = useState(false);
  const { posts } = usePostStore();
  const { user } = useAuthStore();
  const { updatePanel, swapPanels } = usePanelStore();

  const panelPosts = posts.filter((post) => post.panelId === id);

  const isOwner = user && ownerEmail === user?.email;
  const canCreate = user && (user.role === 'admin' || isOwner);
  const canRename = user && (user.role === 'admin' || isOwner);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isOwner && user?.role !== 'admin') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', id);
    setDragging(true);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
  const onDragLeave = () => { setDragging(false); };
  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const fromId = e.dataTransfer.getData('text/plain');
    if (!fromId || fromId === id) return;
    await swapPanels(fromId, id);
  };

  const savePanelName = async () => {
    setIsEditing(false);
    await updatePanel(id, { name: panelName, ownerEmail: (ownerEmail || user?.email) ?? undefined });
  };

  return (
    <div className="bg-white border-2 border-[#81D8D0] rounded-lg p-4 flex flex-col h-full">
      <div
        className={`flex justify-between items-center mb-4 ${dragging ? 'bg-[#e0f7f5]' : ''}`}
        draggable={Boolean(user && (user.role === 'admin' || isOwner))}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
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
      <div className="flex-1 overflow-y-auto">
        {panelPosts.length === 0 ? (
          <p className="text-gray-500 text-center">게시물이 없습니다</p>
        ) : (
          panelPosts.map(post => (
            <PostItem key={post.id} post={post} />
          ))
        )}
      </div>
      {showCreate && (
        <CreatePost panelId={id} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
