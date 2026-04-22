'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAdminModeStore } from '@/store/adminModeStore'
import { useUserStore } from '@/store/userStore'
import Avatar from '@/components/common/Avatar'
import ProfileEditModal from '@/components/common/ProfileEditModal'

const buttonStyle: React.CSSProperties = {
  padding: '4px 12px',
  border: '1px solid #C17B6B',
  borderRadius: 2,
  background: '#fff',
  color: '#C17B6B',
  fontSize: 12,
  letterSpacing: '0.05em',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
}

const nameTriggerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  border: 'none',
  background: 'transparent',
  color: '#2C1810',
  fontSize: 13,
  cursor: 'pointer',
  borderRadius: 2,
  transition: 'background 0.15s ease',
}

export default function Header() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const adminMode = useAdminModeStore((s) => s.adminMode)
  const toggleAdminMode = useAdminModeStore((s) => s.toggle)
  const users = useUserStore((s) => s.users)
  const currentUser = users.find((u) => u.email === user?.email) || null
  const [profileOpen, setProfileOpen] = useState(false)

  const showAdminToggle = pathname === '/' && user?.role === 'admin'
  const displayName = currentUser?.name || user?.displayName || user?.email || ''

  const handleHover = (e: React.MouseEvent<HTMLButtonElement>, bg: string) => {
    e.currentTarget.style.background = bg
  }

  return (
    <header
      style={{
        minHeight: 72,
        background: '#FDF8F4',
        borderBottom: '1px solid #EDE5DC',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 32,
        paddingRight: 32,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 500, color: '#2C1810' }}>
        Hizzi is happy, and you?
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          data-testid="header-profile-trigger"
          onClick={() => setProfileOpen(true)}
          style={nameTriggerStyle}
          onMouseEnter={(e) => handleHover(e, '#F5F0EE')}
          onMouseLeave={(e) => handleHover(e, 'transparent')}
        >
          <Avatar photoURL={currentUser?.photoURL} name={displayName} size={28} />
          <span>{displayName}</span>
        </button>
        {showAdminToggle && (
          <button
            onClick={() => toggleAdminMode()}
            style={buttonStyle}
            onMouseEnter={(e) => handleHover(e, '#FDF8F4')}
            onMouseLeave={(e) => handleHover(e, '#fff')}
          >
            {adminMode ? '관리자 모드 닫기' : '관리자 모드'}
          </button>
        )}
        <button
          onClick={async () => {
            try {
              await signOut()
            } catch (e) {
              console.error('로그아웃 실패:', e)
            }
          }}
          style={buttonStyle}
          onMouseEnter={(e) => handleHover(e, '#FDF8F4')}
          onMouseLeave={(e) => handleHover(e, '#fff')}
        >
          로그아웃
        </button>
      </div>
      <ProfileEditModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        currentUser={currentUser}
      />
    </header>
  )
}
