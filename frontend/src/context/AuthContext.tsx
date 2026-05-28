import { createContext, useContext, useMemo, useState, useCallback } from 'react'

// IMPORTANT: fallback must match the Employee Portal backend port (5002),
// not the generic Flask default 5000.
const API = import.meta.env.VITE_API_URL || 'http://localhost:5002'

export type Employee = {
  id: number
  name: string
  email: string
  empId: string
  department: string
  role: string
  skills: string[]
  certifications: string[]
  availability: string
  imagePreview: string
  experience?: number
  phone?: string
  joinDate?: string
  approvedCertDocs?: any[]
}

type AuthContextValue = {
  isAuthenticated: boolean
  employee: Employee | null
  token: string | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('emp_token')
  )
  const [employee, setEmployee] = useState<Employee | null>(() => {
    try { return JSON.parse(localStorage.getItem('emp_user') || 'null') }
    catch { return null }
  })

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API}/api/employee/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      // Try to read JSON even on error responses
      let data: any = {}
      try { data = await res.json() } catch { /* non-JSON body */ }

      if (!res.ok) {
        return {
          ok: false,
          error: data.message
              || data.error
              || `Login failed (HTTP ${res.status})`,
        }
      }

      setToken(data.token)
      setEmployee(data.employee)
      localStorage.setItem('emp_token', data.token)
      localStorage.setItem('emp_user',  JSON.stringify(data.employee))
      return { ok: true }
    } catch (err: any) {
      return {
        ok: false,
        error: `Cannot reach server at ${API}. ` +
               `Make sure the Employee Portal backend is running on port 5002.`,
      }
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setEmployee(null)
    localStorage.removeItem('emp_token')
    localStorage.removeItem('emp_user')
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/api/employee/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEmployee(data)
        localStorage.setItem('emp_user', JSON.stringify(data))
      }
    } catch { /* offline – keep cached profile */ }
  }, [token])

  const isAuthenticated = Boolean(token && employee)

  const value = useMemo(
    () => ({ isAuthenticated, employee, token, login, logout, refreshProfile }),
    [isAuthenticated, employee, token, login, logout, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
