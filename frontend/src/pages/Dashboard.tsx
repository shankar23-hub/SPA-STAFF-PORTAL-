import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/context/AuthContext'
import { TrendingUp, Briefcase, Award, Brain, Calendar, Clock, Bell } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5002'

export default function Dashboard() {
  const { employee, token } = useAuth()
  const [dashData, setDashData] = useState<{
    announcements: any[]
    notifications: any[]
    tasks: any[]
  }>({ announcements: [], notifications: [], tasks: [] })
  const [loadingDash, setLoadingDash] = useState(true)

  // Fetch dashboard data from API
  useEffect(() => {
    if (!token) { setLoadingDash(false); return }
    fetch(`${API}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setDashData(d))
      .catch(() => {
        // API not reachable — keep empty arrays
      })
      .finally(() => setLoadingDash(false))
  }, [token])

  const stats = [
    {
      label: 'Department',
      value: employee?.department || '—',
      icon: <Briefcase size={18} />,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
    },
    {
      label: 'Experience',
      value: employee?.experience != null ? `${employee.experience} yrs` : '—',
      icon: <TrendingUp size={18} />,
      color: '#00c896',
      bg: 'rgba(0,200,150,0.12)',
    },
    {
      label: 'Skills',
      value: String(employee?.skills?.length ?? 0),
      icon: <Brain size={18} />,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.12)',
    },
    {
      label: 'Certifications',
      value: String(employee?.certifications?.length ?? 0),
      icon: <Award size={18} />,
      color: '#ff9f43',
      bg: 'rgba(255,159,67,0.12)',
    },
  ]

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const activityColor: Record<string, string> = {
    login: '#6366f1', cert: '#ff9f43', project: '#00c896',
    inbox: '#38bdf8', profile: '#a78bfa', Allocation: '#e63946',
  }

  // Combine API notifications with default activity entries
  const activityItems = dashData.notifications.length > 0
    ? dashData.notifications.slice(0, 5).map((n: any) => ({
        time: n.sentAt ? new Date(n.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
        event: n.message || `Project: ${n.projectName}`,
        type: 'Allocation',
      }))
    : [
        { time: '09:00 AM', event: 'Logged in to Employee Portal', type: 'login' },
        { time: '10:30 AM', event: 'Certificate submission reviewed', type: 'cert' },
        { time: '12:00 PM', event: 'Project status updated', type: 'project' },
        { time: '02:15 PM', event: 'Inbox message from HR Department', type: 'inbox' },
        { time: '04:00 PM', event: 'Profile refreshed by Admin', type: 'profile' },
      ]

  return (
    <AppShell title="Dashboard" subtitle={today}>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Welcome Banner */}
        <div style={{
          borderRadius: 18,
          border: '1px solid rgba(99,102,241,0.2)',
          background: 'linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(124,58,237,0.1) 60%, transparent 100%)',
          padding: '22px 26px',
          display: 'flex', alignItems: 'center', gap: 18,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -30, top: -40,
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, overflow: 'hidden', flexShrink: 0,
          }}>
            {employee?.imagePreview
              ? <img src={employee.imagePreview} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '👤'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Welcome back, {employee?.name?.split(' ')[0] || 'Employee'}! 👋
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>
              {employee?.role} · {employee?.staffId || employee?.empId}
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(0,200,150,0.15)', color: '#00c896',
              fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00c896', boxShadow: '0 0 6px #00c896' }} />
              {employee?.availability || 'Available'}
            </span>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 4 }}>
              <Calendar size={13} /> Joined
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {employee?.joinDate
                ? new Date(employee.joinDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : '—'}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card" style={{ textAlign: 'center', padding: '20px 14px' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: s.bg, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Announcements (from API) */}
        {dashData.announcements.length > 0 && (
          <div className="card card-lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Bell size={16} style={{ color: '#38bdf8' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Announcements</h2>
            </div>
            {dashData.announcements.map((a: any, i: number) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                background: 'rgba(56,189,248,0.06)',
                border: '1px solid rgba(56,189,248,0.12)',
                fontSize: 13, color: 'rgba(255,255,255,0.75)',
              }}>
                <strong style={{ color: '#38bdf8' }}>{a.title}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>{a.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Skills + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Skills */}
          <div className="card card-lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Brain size={16} style={{ color: '#818cf8' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>My Skills</h2>
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                padding: '2px 8px', borderRadius: 20,
              }}>{employee?.skills?.length ?? 0}</span>
            </div>
            {(employee?.skills?.length ?? 0) > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {employee!.skills.map(sk => (
                  <span key={sk} className="skill-tag">{sk}</span>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                No skills on record yet
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card card-lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Clock size={16} style={{ color: '#38bdf8' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {dashData.notifications.length > 0 ? 'Recent Notifications' : "Today's Activity"}
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activityItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', marginTop: 5,
                    background: activityColor[item.type] || '#888', flexShrink: 0,
                    boxShadow: `0 0 6px ${activityColor[item.type] || '#888'}`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{item.event}</div>
                    {item.time && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.time}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certifications */}
        {(employee?.certifications?.length ?? 0) > 0 && (
          <div className="card card-lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Award size={16} style={{ color: '#ff9f43' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Approved Certifications</h2>
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                background: 'rgba(0,200,150,0.12)', color: '#00c896',
                padding: '2px 8px', borderRadius: 20,
              }}>{employee!.certifications.length} verified</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {employee!.certifications.map(c => (
                <div key={c} className="cert-tag">✅ {c}</div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Submit Certificate', desc: 'Upload & get it verified', icon: '🎓', to: '/certifications', color: '#ff9f43' },
            { label: 'View Projects',      desc: 'Track your assigned work', icon: '📁', to: '/projects',       color: '#6366f1' },
            { label: 'Check Inbox',        desc: `${dashData.notifications.length || 2} messages`, icon: '📬', to: '/inbox', color: '#38bdf8' },
          ].map(q => (
            <a key={q.label} href={q.to} style={{
              display: 'block', padding: '16px 18px', borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              cursor: 'pointer', textDecoration: 'none',
              transition: 'border-color 0.2s, background 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${q.color}40`
                ;(e.currentTarget as HTMLElement).style.background = `${q.color}08`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
              }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{q.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{q.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{q.desc}</div>
            </a>
          ))}
        </div>

      </div>
    </AppShell>
  )
}
