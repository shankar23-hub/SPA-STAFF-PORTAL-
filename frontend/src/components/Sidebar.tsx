import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FolderKanban, Inbox, Award,
  User, LogOut, Settings,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import nexaLogo from '@/assets/images/nexa-logo.png'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5002'

const accountLinks = [
  { to: '/profile',  label: 'My Profile', icon: User },
  { to: '/settings', label: 'Settings',   icon: Settings },
]

export default function Sidebar() {
  const { employee, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!employee?.id) return
    const fetchCount = async () => {
      try {
        const res = await fetch(`${API}/api/notifications/employee/${employee.id}`)
        if (res.ok) {
          const data: any[] = await res.json()
          const unread = data.filter(n => !n.read).length
          setUnreadCount(unread + 2)
        } else {
          setUnreadCount(2)
        }
      } catch {
        setUnreadCount(2)
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [employee?.id])

  const mainLinks = [
    { to: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard, badge: null },
    { to: '/projects',       label: 'My Projects',     icon: FolderKanban,    badge: null },
    { to: '/inbox',          label: 'Inbox',           icon: Inbox,           badge: unreadCount > 0 ? String(unreadCount) : null },
    { to: '/certifications', label: 'Certifications',  icon: Award,           badge: null },
  ]

  const initials = employee?.name
    ?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'EE'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <img src={nexaLogo} alt="SPA logo" className="sidebar-logo-image" />
          <div>
            <span className="sidebar-logo-text">SPA</span>
            <div className="sidebar-sub">Employee Portal</div>
          </div>
        </div>
      </div>

      {employee && (
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            {employee.imagePreview
              ? <img src={employee.imagePreview} alt={employee.name} />
              : initials}
          </div>
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">{employee.name}</div>
            <div className="sidebar-profile-role">{employee.role}</div>
          </div>
          <div className="sidebar-status-dot" title="Online" />
        </div>
      )}

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Workspace</div>

        {mainLinks.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }>
            <Icon className="nav-item-icon" size={17} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge && <span className="nav-item-badge">{badge}</span>}
          </NavLink>
        ))}

        <div className="sidebar-section-label">Account</div>

        {accountLinks.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }>
            <Icon className="nav-item-icon" size={17} />
            <span style={{ flex: 1 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {employee && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 10,
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Logged in as</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {employee.email}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="nav-item logout"
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
        >
          <LogOut className="nav-item-icon" size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
