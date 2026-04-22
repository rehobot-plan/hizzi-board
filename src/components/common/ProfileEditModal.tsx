'use client';

import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import type { AppUser } from '@/store/userStore';
import { getCroppedJpegBlob } from '@/lib/cropImage';
import { useEscClose } from '@/hooks/useEscClose';
import Avatar from '@/components/common/Avatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
}

export default function ProfileEditModal({ isOpen, onClose, currentUser }: Props) {
  const authUser = useAuthStore((s) => s.user);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEscClose(onClose, isOpen);

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    setName(currentUser.name || '');
    setDepartment(currentUser.department || '');
    setPosition(currentUser.position || '');
    setPhotoURL(currentUser.photoURL || '');
    setCropSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const onPickFile = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCropSrc(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCropComplete = (_: Area, px: Area) => setCroppedArea(px);

  const onCancelCrop = () => {
    setCropSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    if (!currentUser || !authUser) return;
    setIsSaving(true);
    try {
      const patch: Record<string, string> = {};
      let newPhotoURL = photoURL;

      if (cropSrc && croppedArea) {
        const blob = await getCroppedJpegBlob(cropSrc, croppedArea);
        const r = storageRef(storage, `profiles/${authUser.uid}.jpg`);
        await uploadBytes(r, blob, { contentType: 'image/jpeg' });
        newPhotoURL = await getDownloadURL(r);
        patch.photoURL = newPhotoURL;
      }

      if (name !== currentUser.name) patch.name = name;
      if (department !== (currentUser.department || '')) patch.department = department;
      if (position !== (currentUser.position || '')) patch.position = position;

      if (Object.keys(patch).length === 0) {
        onClose();
        return;
      }

      await updateDoc(doc(db, 'users', currentUser.id), patch);
      setPhotoURL(newPhotoURL);
      useToastStore.getState().addToast({ message: '프로필 저장 완료', type: 'success' });
      onClose();
    } catch (e) {
      console.error('프로필 저장 실패:', e);
      useToastStore.getState().addToast({ message: '프로필 저장에 실패했습니다.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-testid="profile-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        data-testid="profile-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', border: '1px solid #EDE5DC', borderRadius: 4,
          width: '100%', maxWidth: 480, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', zIndex: 1001,
        }}
      >
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #EDE5DC', background: '#5C1F1F', color: '#FDF8F4', borderRadius: '4px 4px 0 0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>프로필 수정</h2>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', minHeight: 0 }}>
          {cropSrc ? (
            <div>
              <div style={{ position: 'relative', width: '100%', height: 280, background: '#2C1810' }}>
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: '#9E8880' }}>확대</span>
                <input
                  type="range" min={1} max={3} step={0.01} value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={onCancelCrop}
                  style={{ fontSize: 11, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  크롭 취소
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar photoURL={photoURL} name={name} size={64} />
              <button
                type="button"
                onClick={onPickFile}
                style={{
                  fontSize: 11, padding: '6px 14px',
                  border: '1px solid #C17B6B', color: '#C17B6B',
                  background: '#fff', borderRadius: 2, cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FDF8F4')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                사진 변경
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}

          <label style={{ display: 'block', fontSize: 11, color: '#9E8880', marginBottom: 4, marginTop: 16 }}>이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="profile-name"
            style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', fontSize: 13, padding: '6px 0', outline: 'none', background: 'transparent' }}
          />

          <label style={{ display: 'block', fontSize: 11, color: '#9E8880', marginBottom: 4, marginTop: 16 }}>부서</label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            data-testid="profile-department"
            style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', fontSize: 13, padding: '6px 0', outline: 'none', background: 'transparent' }}
          />

          <label style={{ display: 'block', fontSize: 11, color: '#9E8880', marginBottom: 4, marginTop: 16 }}>직책</label>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            data-testid="profile-position"
            style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', fontSize: 13, padding: '6px 0', outline: 'none', background: 'transparent' }}
          />
        </div>

        <div style={{ padding: '12px 24px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 4px 4px' }}>
          <button
            onClick={onClose}
            style={{ fontSize: 11, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            data-testid="profile-save"
            style={{
              fontSize: 11, padding: '8px 20px', border: 'none', borderRadius: 2,
              background: isSaving ? '#EDE5DC' : '#2C1810',
              color: isSaving ? '#9E8880' : '#FDF8F4',
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
