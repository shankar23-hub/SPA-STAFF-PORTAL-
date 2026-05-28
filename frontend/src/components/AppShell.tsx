import { type ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

interface AppShellProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar title={title} subtitle={subtitle} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
