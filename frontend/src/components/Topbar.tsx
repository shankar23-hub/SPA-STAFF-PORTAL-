import { Bell, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import nexaLogo from '@/assets/images/nexa-logo.png'

interface TopbarProps {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { employee } = useAuth()
  const initials = employee?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'EE'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src={nexaLogo} alt="SPA logo" className="topbar-logo" />
        <div>
          <div className="topbar-breadcrumb">SPA Employee Workspace</div>
          <div className="topbar-title">{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <Search size={14} />
          <input placeholder="Search portal..." />
        </div>

        <button className="icon-btn" title="Notifications" style={{ position: 'relative' }}>
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 7, height: 7, borderRadius: '50%',
            background: '#f87171', border: '1px solid #050816',
          }} />
        </button>

        <div className="topbar-avatar" title={employee?.name}>
          {employee?.imagePreview
            ? <img src={employee.imagePreview} alt={employee.name} />
            : initials}
        </div>
      </div>
    </header>
  )
}
