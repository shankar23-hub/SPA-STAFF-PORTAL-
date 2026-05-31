import AppShell from '@/components/AppShell'
import { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5002'

// Static messages always shown when API is empty
const STATIC_MESSAGES = [
  {
    id: 's1',
    sender: 'HR Department',
    avatar: 'HR',
    color: '#6366f1',
    subject: 'Profile update reminder',
    body: 'Please verify your contact details and personal information in the Employee Portal. Keeping your profile up-to-date ensures smooth HR processes and payroll accuracy.',
    time: '09:30 AM',
    date: 'Today',
    read: false,
    starred: false,
    category: 'HR',
    static: true,
  },
  {
    id: 's2',
    sender: 'Learning Team',
    avatar: 'LT',
    color: '#ff9f43',
    subject: 'New certification batch available',
    body: 'A new certification course is now open for enrollment. Submit your certificates via the Certifications section for admin approval.',
    time: '02:15 PM',
    date: 'Today',
    read: false,
    starred: false,
    category: 'Learning',
    static: true,
  },
]

const categoryColors: Record<string, string> = {
  HR: '#6366f1', Projects: '#00c896', Learning: '#ff9f43',
  System: '#38bdf8', Certifications: '#a78bfa', Allocation: '#e63946',
}

type Message = {
  id: string | number
  sender: string
  avatar: string
  color: string
  subject: string
  body: string
  time: string
  date: string
  read: boolean
  starred: boolean
  category: string
  static?: boolean
  notifId?: number
}

function formatRelativeTime(iso: string): string {
  try {
    const d   = new Date(iso)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 1000
    if (diff < 60)    return 'Just now'
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 172800) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  } catch { return '' }
}

export default function Inbox() {
  const { token } = useAuth()
  const [msgs, setMsgs]         = useState<Message[]>(STATIC_MESSAGES)
  const [selected, setSelected] = useState<Message | null>(null)
  const [filter, setFilter]     = useState('All')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!token) return
    loadInbox()
  }, [token])

  const loadInbox = async () => {
    setLoading(true)
    try {
      // Call the protected /api/inbox endpoint
      const res = await fetch(`${API}/api/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const apiMessages: Message[] = (data.messages || []).map((m: any) => ({
        id:       `api_${m.id}`,
        notifId:  m.id,
        sender:   m.sender || 'Admin — Project Allocation',
        avatar:   'AD',
        color:    '#e63946',
        subject:  m.subject || `Project: ${m.projectName || ''}`,
        body:     m.body || m.message || '',
        time:     m.createdAt ? formatRelativeTime(m.createdAt) : '',
        date:     m.createdAt
          ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '',
        read:     m.read || false,
        starred:  false,
        category: m.category || 'Allocation',
      }))

      setMsgs(apiMessages.length > 0 ? [...apiMessages, ...STATIC_MESSAGES] : STATIC_MESSAGES)
    } catch {
      setMsgs(STATIC_MESSAGES)
    }
    setLoading(false)
  }

  const toggleStar = (id: string | number) =>
    setMsgs(m => m.map(msg => msg.id === id ? { ...msg, starred: !msg.starred } : msg))

  const markRead = async (msg: Message) => {
    setMsgs(m => m.map(x => x.id === msg.id ? { ...x, read: true } : x))
    if (msg.notifId) {
      try {
        await fetch(`${API}/api/notifications/${msg.notifId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch { /* ignore */ }
    }
  }

  const openMsg = (msg: Message) => {
    setSelected(msg)
    markRead(msg)
  }

  const unreadCount = msgs.filter(m => !m.read).length
  const categories  = ['All', 'Allocation', 'HR', 'Projects', 'Learning', 'System', 'Certifications']
  const filtered    = filter === 'All' ? msgs : msgs.filter(m => m.category === filter)

  return (
    <AppShell title="Inbox" subtitle={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}>
      <div className="fade-up" style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)', minHeight: 400 }}>

        {/* Sidebar list */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Category filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1px solid',
                borderColor: filter === c ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
                background: filter === c ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: filter === c ? '#818cf8' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
              }}>{c}</button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              ⏳ Loading messages...
            </div>
          )}

          {/* Message list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                No messages in this category
              </div>
            )}
            {filtered.map(msg => (
              <div key={msg.id} onClick={() => openMsg(msg)} style={{
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                background: selected?.id === msg.id ? 'rgba(99,102,241,0.15)'
                  : msg.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${selected?.id === msg.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${msg.color}22`, color: msg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                    {msg.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: msg.read ? 500 : 700, color: msg.read ? 'rgba(255,255,255,0.5)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{msg.sender}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{msg.time}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: msg.read ? 400 : 600, color: msg.read ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.subject}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: `${categoryColors[msg.category] || '#888'}18`, color: categoryColors[msg.category] || '#888', fontWeight: 600 }}>
                        {msg.category}
                      </span>
                      {!msg.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', marginTop: 2 }} />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message detail */}
        <div className="card card-lg" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)', gap: 12 }}>
              <Mail size={40} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>Select a message to read</div>
            </div>
          ) : (
            <div style={{ padding: 28, height: '100%', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{selected.subject}</h2>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${selected.color}22`, color: selected.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{selected.avatar}</div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{selected.sender}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{selected.date} · {selected.time}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${categoryColors[selected.category] || '#888'}18`, color: categoryColors[selected.category] || '#888', fontWeight: 600 }}>
                      {selected.category}
                    </span>
                  </div>
                </div>
                <button onClick={() => toggleStar(selected.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: selected.starred ? '#ffd166' : 'rgba(255,255,255,0.2)', fontSize: 20, flexShrink: 0 }}>
                  ★
                </button>
              </div>

              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>
                {selected.body}
              </div>

              {selected.category === 'Allocation' && (
                <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 600, marginBottom: 4 }}>📁 Action Required</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    Go to <strong style={{ color: '#818cf8' }}>My Projects</strong> to view your assigned project details, track progress, and collaborate with your team.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
