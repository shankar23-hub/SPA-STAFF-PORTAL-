import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/context/AuthContext'
import { User, Mail, Hash, Building2, Briefcase, Activity, Phone, Calendar, RefreshCw } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5002'

export default function Profile() {
  const { employee, token, refreshProfile } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch from /api/profile (JWT-protected)
  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`${API}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setProfile(d); setLoading(false) })
      .catch(() => {
        // Fallback: try /api/auth/me
        fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => { setProfile(d); setLoading(false) })
          .catch(() => { setProfile(employee); setLoading(false) })
      })
  }, [token])

  const handleRefresh = async () => {
    await refreshProfile()
    setProfile(JSON.parse(localStorage.getItem('spa_emp_user') || 'null'))
    showToast('Profile refreshed!')
  }

  const infoFields = profile ? [
    { label: 'Full Name',    value: profile.name       || '—', icon: <User size={14} />,       color: '#6366f1' },
    { label: 'Staff ID',     value: profile.staffId || profile.empId || '—', icon: <Hash size={14} />, color: '#a78bfa' },
    { label: 'Email',        value: profile.email      || '—', icon: <Mail size={14} />,       color: '#38bdf8' },
    { label: 'Department',   value: profile.department || '—', icon: <Building2 size={14} />,  color: '#ff9f43' },
    { label: 'Role',         value: profile.role       || '—', icon: <Briefcase size={14} />,  color: '#00c896' },
    { label: 'Availability', value: profile.availability || '—', icon: <Activity size={14} />, color: '#f87171' },
    { label: 'Phone',        value: profile.phone      || '—', icon: <Phone size={14} />,      color: '#818cf8' },
    {
      label: 'Experience',
      value: profile.experience != null ? `${profile.experience} years` : '—',
      icon: <Calendar size={14} />,
      color: '#00c896',
    },
  ] : []

  const initials = profile?.name
    ?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'EE'

  return (
    <AppShell title="My Profile" subtitle="View your personal and professional details">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'rgba(255,255,255,0.4)' }}>
          ⏳ Loading profile...
        </div>
      ) : (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Profile Header Card */}
          <div style={{
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.2)',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(124,58,237,0.08) 60%, transparent 100%)',
            padding: '28px 30px',
            display: 'flex', alignItems: 'center', gap: 22,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', right: -50, top: -60,
              width: 240, height: 240, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: 22,
              background: 'rgba(99,102,241,0.15)',
              border: '2px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#818cf8',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {profile?.imagePreview
                ? <img src={profile.imagePreview} alt={profile?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{profile?.name}</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
                {profile?.role} · {profile?.department}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(0,200,150,0.12)', color: '#00c896',
                  fontSize: 12, fontWeight: 600,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00c896', boxShadow: '0 0 6px #00c896' }} />
                  {profile?.availability || 'Available'}
                </span>
                <span style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(129,140,248,0.12)', color: '#818cf8',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {profile?.staffId || profile?.empId}
                </span>
              </div>
            </div>

            <button onClick={handleRefresh} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Info Grid */}
          <div className="card card-lg">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Profile Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {infoFields.map(f => (
                <div key={f.label} style={{
                  padding: '13px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: `${f.color}1a`, color: f.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{f.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                      {f.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', wordBreak: 'break-all' }}>{f.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills + Certs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card card-lg">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 15 }}>🧠</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Skills</h3>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                  background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                  padding: '2px 8px', borderRadius: 20,
                }}>{profile?.skills?.length ?? 0}</span>
              </div>
              {(profile?.skills?.length ?? 0) > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {profile.skills.map((sk: string) => (
                    <span key={sk} className="skill-tag">{sk}</span>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                  No skills listed yet
                </div>
              )}
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>
                ℹ️ Skills are auto-updated when certificates are approved
              </p>
            </div>

            <div className="card card-lg">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 15 }}>🎓</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Certifications</h3>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                  background: 'rgba(0,200,150,0.12)', color: '#00c896',
                  padding: '2px 8px', borderRadius: 20,
                }}>{profile?.certifications?.length ?? 0}</span>
              </div>
              {(profile?.certifications?.length ?? 0) > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.certifications.map((c: string) => (
                    <div key={c} className="cert-tag">✅ {c}</div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                  No certifications yet
                </div>
              )}
            </div>
          </div>

          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.12)',
            fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center',
          }}>
            ℹ️ Profile details are managed by your Admin. Contact HR to request changes.
          </div>

        </div>
      )}
    </AppShell>
  )
}
