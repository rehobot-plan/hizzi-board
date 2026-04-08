'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useEscClose } from '@/hooks/useEscClose';

interface ImageViewerProps {
  url: string;
  onClose: () => void;
}

export default function ImageViewer({ url, onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(5, Math.max(0.5, prev - e.deltaY * 0.001)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragPos.x, y: e.clientY - dragPos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setDragPos({ x: 0, y: 0 });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => { onClose(); setZoom(1); setDragPos({ x: 0, y: 0 }); }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
        <span onClick={handleReset} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
          초기화
        </span>
      </div>
      <div style={{ overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh' }}
        onWheel={handleWheel}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={url}
          alt="확대 이미지"
          style={{ transform: `scale(${zoom}) translate(${dragPos.x / zoom}px, ${dragPos.y / zoom}px)`, transition: isDragging ? 'none' : 'transform 0.1s', cursor: isDragging ? 'grabbing' : 'grab', display: 'block', maxWidth: '90vw', maxHeight: '90vh' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          draggable={false}
        />
      </div>
    </div>
  );
}
