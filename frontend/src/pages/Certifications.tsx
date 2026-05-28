import { useState, useRef, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/context/AuthContext'
import { Upload, FileText, CheckCircle, XCircle, Clock, Award } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5002'

type Certification = {
  id: number
  certificateName: string
  courseName: string
  codeSkills: string
  status: string
  fileName?: string
  submittedAt?: string
  analysisResult?: any
  rejectionReason?: string
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  Pending:  { icon: Clock,        color: '#ff9f43', bg: 'rgba(255,159,67,0.12)' },
  Approved: { icon: CheckCircle,  color: '#00c896', bg: 'rgba(0,200,150,0.12)'  },
  Rejected: { icon: XCircle,      color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  Submitted:{ icon: Clock,        color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
}

export default function Certifications() {
  const { employee, token, refreshProfile } = useAuth()
  const [certs, setCerts] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [form, setForm] = useState({ certificateName: '', courseName: '', codeSkills: '' })
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadCerts = async () => {
    if (!employee?.id) { setLoading(false); return }
    try {
      const res = await fetch(`${API}/api/certifications/employee/${employee.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setCerts(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadCerts() }, [employee?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.certificateName) { showToast('Certificate name is required', 'error'); return }
    if (!employee?.id) { showToast('Not logged in', 'error'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('employeeId', String(employee.id))
      fd.append('employeeName', employee.name)
      fd.append('certificateName', form.certificateName)
      fd.append('courseName', form.courseName)
      fd.append('codeSkills', form.codeSkills)
      if (file) fd.append('file', file)
      const res = await fetch(`${API}/api/certifications/upload`, { method: 'POST', body: fd })
      if (res.ok) {
        showToast('Certificate submitted! Awaiting admin review.')
        setForm({ certificateName: '', courseName: '', codeSkills: '' })
        setFile(null)
        if (fileRef.current) fileRef.current.value = ''
        loadCerts()
        refreshProfile()
      } else {
        const d = await res.json()
        showToast(d.error || 'Upload failed', 'error')
      }
    } catch {
      showToast('Failed to submit. Check your connection.', 'error')
    }
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
    else showToast('Please upload a PDF file', 'error')
  }

  const approved = certs.filter(c => c.status === 'Approved')
  const pending  = certs.filter(c => c.status === 'Pending' || c.status === 'Submitted')
  const rejected = certs.filter(c => c.status === 'Rejected')

  return (
    <AppShell title="Certifications" subtitle="Upload and track your certification submissions">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Approved', count: approved.length, icon: <CheckCircle size={18} />, color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
            { label: 'Pending Review', count: pending.length, icon: <Clock size={18} />, color: '#ff9f43', bg: 'rgba(255,159,67,0.12)' },
            { label: 'Rejected', count: rejected.length, icon: <XCircle size={18} />, color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

          {/* Upload Form */}
          <div className="card card-lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Upload size={16} style={{ color: '#818cf8' }} />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Upload Certificate</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Certificate Name *</label>
                <input type="text" value={form.certificateName}
                  onChange={e => setForm(f => ({ ...f, certificateName: e.target.value }))}
                  placeholder="e.g. AWS Solutions Architect"
                  className="form-input" />
              </div>
              <div>
                <label className="form-label">Course / Issuer</label>
                <input type="text" value={form.courseName}
                  onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))}
                  placeholder="e.g. Amazon Web Services"
                  className="form-input" />
              </div>
              <div>
                <label className="form-label">Related Skills (comma-separated)</label>
                <input type="text" value={form.codeSkills}
                  onChange={e => setForm(f => ({ ...f, codeSkills: e.target.value }))}
                  placeholder="e.g. AWS, Cloud, Python"
                  className="form-input" />
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 12,
                  padding: '22px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                }}>
                <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files?.[0] ?? null)} />
                {file ? (
                  <div>
                    <FileText size={28} style={{ color: '#818cf8', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{(file.size / 1024).toFixed(0)} KB</div>
                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                      style={{ marginTop: 8, fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} style={{ color: 'rgba(255,255,255,0.25)', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                      Drag & drop or click to upload PDF
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>PDF only · Max 10 MB</div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={uploading} className="btn-primary">
                {uploading ? '⏳ Uploading...' : '🚀 Submit Certificate'}
              </button>
            </form>
          </div>

          {/* Submission Status */}
          <div className="card card-lg" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Award size={16} style={{ color: '#ff9f43' }} />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Submission History</h2>
            </div>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                ⏳ Loading...
              </div>
            ) : certs.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <Award size={42} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No submissions yet</div>
                <div style={{ fontSize: 12 }}>Submit your first certificate using the form</div>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {certs.map(cert => {
                  const sc = statusConfig[cert.status] || statusConfig.Pending
                  const Icon = sc.icon
                  return (
                    <div key={cert.id} style={{
                      padding: '14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                        <Icon size={15} style={{ color: sc.color, flexShrink: 0, marginTop: 1 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{cert.certificateName}</div>
                          {cert.courseName && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{cert.courseName}</div>}
                        </div>
                        <span style={{
                          padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                          background: sc.bg, color: sc.color, whiteSpace: 'nowrap',
                        }}>{cert.status}</span>
                      </div>
                      {cert.codeSkills && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          {cert.codeSkills.split(',').map(s => (
                            <span key={s} className="skill-tag" style={{ fontSize: 10, padding: '2px 7px' }}>{s.trim()}</span>
                          ))}
                        </div>
                      )}
                      {cert.status === 'Approved' && cert.analysisResult?.skills_detected?.length > 0 && (
                        <div style={{ fontSize: 11, color: '#00c896', marginTop: 4 }}>
                          ✅ {cert.analysisResult.skills_detected.length} skills added to profile
                        </div>
                      )}
                      {cert.status === 'Rejected' && cert.rejectionReason && (
                        <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>❌ {cert.rejectionReason}</div>
                      )}
                      {cert.submittedAt && (
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                          {new Date(cert.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Approved certifications banner */}
        {(employee?.certifications?.length ?? 0) > 0 && (
          <div className="card card-lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <CheckCircle size={16} style={{ color: '#00c896' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                My Verified Certifications
              </h2>
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

      </div>
    </AppShell>
  )
}
