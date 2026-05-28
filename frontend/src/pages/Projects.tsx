import AppShell from '@/components/AppShell'
import { useState, useEffect } from 'react'
import { FolderKanban, Clock, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5002'

const statusConfig: Record<string, { label: string; badge: string; color: string }> = {
  'In Progress': { label: 'In Progress', badge: 'badge-info',    color: '#4cc9f0' },
  'Planning':    { label: 'Planning',    badge: 'badge-warning', color: '#a78bfa' },
  'Review':      { label: 'Review',      badge: 'badge-purple',  color: '#ffd166' },
  'Completed':   { label: 'Completed',   badge: 'badge-success', color: '#00c896' },
  'On Hold':     { label: 'On Hold',     badge: 'badge-warning', color: '#fb8500' },
}

const priorityConfig: Record<string, string> = {
  'Critical': '#e63946',
  'High':     '#f87171',
  'Medium':   '#ff9f43',
  'Low':      '#00c896',
}

type Project = {
  id: number
  name: string
  status: string
  priority: string
  endDate?: string
  deadline?: string
  tech: string[]
  completion: number
  progress?: number
  teamSize?: number
  head?: any
  team?: any[]
  description?: string
  icon?: string
  color?: string
  myRole?: string
}

export default function Projects() {
  const { employee, token } = useAuth()
  const [projects, setProjects]   = useState<Project[]>([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState<'grid' | 'table'>('grid')
  const [filter, setFilter]       = useState('All')
  const statuses = ['All', 'In Progress', 'Planning', 'Review', 'Completed', 'On Hold']

  useEffect(() => {
    if (!employee) return
    loadProjects()
  }, [employee])

  const loadProjects = async () => {
    setLoading(true)
    try {
      // Load all projects from Admin backend
      const res = await fetch(`${API}/api/projects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load projects')
      const all: Project[] = await res.json()

      // Filter: only show projects where this employee is head or team member
      const myName = (employee?.name || '').toLowerCase().trim()
      const myId   = employee?.id

      const mine = all.filter(p => {
        // Check head
        const headName = typeof p.head === 'string'
          ? p.head.toLowerCase()
          : (p.head?.name || '').toLowerCase()
        if (headName === myName) return true

        // Check team array
        const team = Array.isArray(p.team) ? p.team : []
        if (team.some((m: any) => (m?.name || '').toLowerCase() === myName)) return true

        // Check assignedEmployees array
        const assigned = Array.isArray((p as any).assignedEmployees) ? (p as any).assignedEmployees : []
        if (assigned.some((n: any) => (typeof n === 'string' ? n : n?.name || '').toLowerCase() === myName)) return true

        return false
      })

      // Annotate with myRole
      const annotated = mine.map(p => {
        const headName = typeof p.head === 'string'
          ? p.head.toLowerCase()
          : (p.head?.name || '').toLowerCase()
        const myRole = headName === myName ? 'Project Head' : 'Team Member'
        return {
          ...p,
          completion: p.completion ?? p.progress ?? 0,
          endDate: p.endDate || p.deadline || '',
          tech: Array.isArray(p.tech) ? p.tech : [],
          team: Array.isArray(p.team) ? p.team : [],
          myRole,
        }
      })

      setProjects(annotated)
    } catch {
      // Fallback: empty
      setProjects([])
    }
    setLoading(false)
  }

  const filtered = filter === 'All' ? projects : projects.filter(p => p.status === filter)

  return (
    <AppShell title="My Projects" subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''} assigned to you`}>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: '1px solid',
                borderColor: filter === s ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
                background: filter === s ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                color: filter === s ? '#818cf8' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: 3 }}>
            {(['grid', 'table'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                background: view === v ? 'rgba(99,102,241,0.2)' : 'none',
                color: view === v ? '#818cf8' : 'rgba(255,255,255,0.4)',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}>{v === 'grid' ? '⊞ Grid' : '☰ Table'}</button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'rgba(255,255,255,0.4)', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 32 }}>⏳</div>
            <div>Loading your projects...</div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, flexDirection: 'column', gap: 12, color: 'rgba(255,255,255,0.3)' }}>
            <FolderKanban size={40} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>No projects assigned yet</div>
            <div style={{ fontSize: 12 }}>
              {projects.length === 0
                ? 'Your admin will allocate projects to you via the AI Allocation engine.'
                : 'No projects match the selected filter.'}
            </div>
          </div>
        )}

        {/* Grid View */}
        {!loading && view === 'grid' && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(p => {
              const sc = statusConfig[p.status] || statusConfig['Planning']
              const completion = p.completion ?? 0
              return (
                <div key={p.id} className="card card-lg" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${p.color || '#6366f1'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                      {p.icon || <FolderKanban size={18} style={{ color: '#818cf8' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{p.description.slice(0, 80)}{p.description.length > 80 ? '...' : ''}</div>}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`badge ${sc.badge}`}>{p.status}</span>
                    {p.priority && (
                      <span className="badge" style={{ background: `${priorityConfig[p.priority] || '#888'}1a`, color: priorityConfig[p.priority] || '#888' }}>
                        {p.priority}
                      </span>
                    )}
                    {/* My Role badge */}
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      background: p.myRole === 'Project Head' ? 'rgba(230,57,70,0.15)' : 'rgba(76,201,240,0.12)',
                      color: p.myRole === 'Project Head' ? '#e63946' : '#4cc9f0' }}>
                      {p.myRole === 'Project Head' ? '👑' : '👤'} {p.myRole}
                    </span>
                  </div>

                  {/* Progress */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Progress</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{completion}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${completion}%` }} />
                    </div>
                  </div>

                  {/* Tech Stack */}
                  {p.tech.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {p.tech.slice(0, 4).map(t => (
                        <span key={t} style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>{t}</span>
                      ))}
                      {p.tech.length > 4 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>+{p.tech.length - 4}</span>}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      <Clock size={12} /> {p.endDate || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      <Users size={12} /> {(p.team?.length || 0) + 1} members
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Table View */}
        {!loading && view === 'table' && filtered.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>My Role</th>
                  <th>Priority</th>
                  <th>Progress</th>
                  <th>Tech Stack</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const sc = statusConfig[p.status] || statusConfig['Planning']
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{p.icon} {p.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          Head: {typeof p.head === 'string' ? p.head : p.head?.name || 'TBD'}
                        </div>
                      </td>
                      <td><span className={`badge ${sc.badge}`}>{p.status}</span></td>
                      <td>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20,
                          background: p.myRole === 'Project Head' ? 'rgba(230,57,70,0.15)' : 'rgba(76,201,240,0.12)',
                          color: p.myRole === 'Project Head' ? '#e63946' : '#4cc9f0', fontWeight: 700 }}>
                          {p.myRole === 'Project Head' ? '👑' : '👤'} {p.myRole}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: priorityConfig[p.priority] || '#888', fontWeight: 600, fontSize: 12 }}>
                          ● {p.priority || '—'}
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${p.completion ?? 0}%` }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{p.completion ?? 0}%</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {p.tech.slice(0, 3).map(t => (
                            <span key={t} style={{ padding: '2px 7px', borderRadius: 5, fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{p.endDate || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
