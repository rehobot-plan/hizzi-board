import AppShell from '@/components/common/AppShell'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
