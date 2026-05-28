import AppShell from '@/components/AppShell'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import { Bell, Shield, Moon, Globe, Eye, Lock, ChevronRight } from 'lucide-react'

export default function Settings() {
  const { employee } = useAuth()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    certUpdates: true,
    projectAlerts: true,
    inboxDigest: false,
    darkMode: true,
    language: 'English',
    twoFactor: false,
    profileVisibility: 'team',
  })

  const [toast, setToast] = useState<string | null>(null)

  const toggle = (key: keyof typeof settings) => {
    setSettings(s => ({ ...s, [key]: !s[key as keyof typeof settings] }))
    setToast('Settings saved')
    setTimeout(() => setToast(null), 2000)
  }

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'rgba(255,255,255,0.1)',
      border: 'none', cursor: 'pointer',
      position: 'relative', transition: 'background 0.25s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute',
        top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="card card-lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{ color: '#818cf8' }}>{icon}</div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </div>
    </div>
  )

  const Row = ({
    label, desc, children,
  }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 14px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 10,
      gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  )

  return (
    <AppShell title="Settings" subtitle="Manage your portal preferences">
      {toast && (
        <div className="toast toast-success">✅ {toast}</div>
      )}

      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Account Overview */}
        <div className="card card-lg" style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.07), transparent)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#818cf8', overflow: 'hidden',
            }}>
              {employee?.imagePreview
                ? <img src={employee.imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (employee?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'EE')}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{employee?.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{employee?.email}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{employee?.empId} · {employee?.role}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 20,
                background: 'rgba(0,200,150,0.12)', color: '#00c896',
                fontSize: 11, fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c896', boxShadow: '0 0 5px #00c896' }} />
                Active Account
              </div>
            </div>
          </div>
        </div>

        {/* 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Notifications */}
          <Section title="Notifications" icon={<Bell size={15} />}>
            <Row label="Email Notifications" desc="Receive updates to your email">
              <Toggle on={settings.emailNotifications} onClick={() => toggle('emailNotifications')} />
            </Row>
            <Row label="Certificate Updates" desc="Status changes for your submissions">
              <Toggle on={settings.certUpdates} onClick={() => toggle('certUpdates')} />
            </Row>
            <Row label="Project Alerts" desc="Notify me when projects are updated">
              <Toggle on={settings.projectAlerts} onClick={() => toggle('projectAlerts')} />
            </Row>
            <Row label="Weekly Inbox Digest" desc="Summary email every Monday">
              <Toggle on={settings.inboxDigest} onClick={() => toggle('inboxDigest')} />
            </Row>
          </Section>

          {/* Security */}
          <Section title="Security" icon={<Shield size={15} />}>
            <Row label="Two-Factor Authentication" desc="Requires Admin to enable">
              <Toggle on={settings.twoFactor} onClick={() => toggle('twoFactor')} />
            </Row>
            <Row label="Change Password" desc="Contact your Admin to reset">
              <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <Lock size={12} /> Reset
              </button>
            </Row>
            <Row label="Active Sessions" desc="You are signed in on 1 device">
              <span style={{ fontSize: 12, color: '#00c896', fontWeight: 600 }}>1 active</span>
            </Row>
            <Row label="Last Login">
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Today, {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </Row>
          </Section>

          {/* Appearance */}
          <Section title="Appearance" icon={<Moon size={15} />}>
            <Row label="Dark Mode" desc="Portal dark theme (default)">
              <Toggle on={settings.darkMode} onClick={() => toggle('darkMode')} />
            </Row>
            <Row label="Language" desc="Portal display language">
              <select value={settings.language} onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', borderRadius: 7, padding: '5px 10px', fontSize: 12, outline: 'none',
                }}>
                <option>English</option>
                <option>Tamil</option>
                <option>Hindi</option>
              </select>
            </Row>
          </Section>

          {/* Privacy */}
          <Section title="Privacy" icon={<Eye size={15} />}>
            <Row label="Profile Visibility" desc="Who can see your profile">
              <select value={settings.profileVisibility}
                onChange={e => setSettings(s => ({ ...s, profileVisibility: e.target.value }))}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', borderRadius: 7, padding: '5px 10px', fontSize: 12, outline: 'none',
                }}>
                <option value="team">My Team</option>
                <option value="org">Entire Org</option>
                <option value="admin">Admin Only</option>
              </select>
            </Row>
            <Row label="Show Online Status" desc="Visible to team members">
              <Toggle on={true} onClick={() => {}} />
            </Row>
          </Section>

        </div>

        {/* Portal Info */}
        <div style={{
          padding: '14px 18px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            SPA Employee Portal v2.0 · Built on React + Flask + MongoDB
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} SPA Technologies
          </div>
        </div>

      </div>
    </AppShell>
  )
}
