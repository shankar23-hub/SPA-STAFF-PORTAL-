import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import nexaLogo from '@/assets/images/nexa-logo.png'

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [staffId,  setStaffId]  = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPw,   setShowPw]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!staffId || !password) {
      setError('Please enter your Staff ID and password')
      return
    }
    setLoading(true)
    // login(staffId, password) — Staff ID + Password authentication
    const result = await login(staffId.trim(), password)
    setLoading(false)
    if (result.ok) navigate('/dashboard')
    else setError(result.error || 'Login failed')
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `
        radial-gradient(ellipse 80% 60% at 20% 0%, rgba(23,224,217,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 100%, rgba(10,184,174,0.12) 0%, transparent 50%),
        linear-gradient(160deg, #020507 0%, #07131a 55%, #041017 100%)
      `,
      padding: 24,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '15%', left: '8%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(23,224,217,0.10) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,184,174,0.08) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={nexaLogo} alt="SPA logo" className="login-logo" />
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 30, fontWeight: 700, color: '#fff',
            letterSpacing: '0.08em', lineHeight: 1, marginTop: 12,
          }}>SPA</div>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 6,
          }}>Employee Portal</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '14px 0 0' }}>
            Sign in with your Staff ID and password
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          padding: '36px 32px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 40px rgba(23,224,217,0.08)',
        }}>
          <form onSubmit={handleSubmit}>
            {/* Staff ID Field */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'rgba(255,255,255,0.6)', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Staff ID</label>
              <input
                type="text"
                value={staffId}
                onChange={e => setStaffId(e.target.value)}
                placeholder="SPA10001"
                className="form-input"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'rgba(255,255,255,0.6)', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="SPA@10001"
                  className="form-input"
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center',
                  }}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 18,
                padding: '11px 14px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
                fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary nexa-btn" style={{ width: '100%' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Info hint */}
          <div style={{
            marginTop: 20,
            padding: '12px 14px',
            background: 'rgba(23,224,217,0.07)',
            border: '1px solid rgba(23,224,217,0.15)',
            borderRadius: 10,
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
          }}>
            Your Staff ID and password are generated by your Admin in the SPA Admin Portal
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          SPA Employee Portal v3.0 · {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
