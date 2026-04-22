'use client'

import Sidebar from '@/components/common/Sidebar'
import Header from '@/components/common/Header'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#FDF8F4' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
