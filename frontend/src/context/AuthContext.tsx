import { createContext, useContext, useMemo, useState, useCallback } from 'react'

// Employee Portal backend URL.
// Set VITE_API_URL in your .env / Vercel env vars.
const API = import.meta.env.VITE_API_URL || 'http://localhost:5002'

export type Employee = {
  staffId: string
  employeeId?: number
  name: string
  email: string
  department: string
  role: string
  skills: string[]
  certifications: string[]
  availability: string
  imagePreview: string
  experience?: number
  phone?: string
  joinDate?: string
  avatar?: string
  // empId kept for backward compat
  empId?: string
}

type AuthContextValue = {
  isAuthenticated: boolean
  employee: Employee | null
  token: string | null
  /**
   * Login using Staff ID + Password.
   * staffId example: "SPA10001"
   * password example: "SPA@10001"
   */
  login: (staffId: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'spa_emp_token'
const USER_KEY  = 'spa_emp_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  )
  const [employee, setEmployee] = useState<Employee | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    } catch {
      return null
    }
  })

  const login = useCallback(async (staffId: string, password: string) => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ staffId: staffId.trim(), password }),
      })

      let data: any = {}
      try { data = await res.json() } catch { /* non-JSON body */ }

      if (!res.ok) {
        return {
          ok: false,
          error:
            data.message || data.error || `Login failed (HTTP ${res.status})`,
        }
      }

      const emp: Employee = data.user || data.employee
      const tok: string   = data.token

      setToken(tok)
      setEmployee(emp)
      localStorage.setItem(TOKEN_KEY, tok)
      localStorage.setItem(USER_KEY,  JSON.stringify(emp))
      return { ok: true }
    } catch {
      return {
        ok: false,
        error: `Cannot reach server at ${API}. Check that VITE_API_URL is set correctly.`,
      }
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setEmployee(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEmployee(data)
        localStorage.setItem(USER_KEY, JSON.stringify(data))
      }
    } catch {
      // offline — keep cached profile
    }
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
