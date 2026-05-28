import { Navigate, Route, Routes } from 'react-router-dom'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import Inbox from '@/pages/Inbox'
import Certifications from '@/pages/Certifications'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import { useAuth } from '@/context/AuthContext'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"            element={<Navigate to="/login" replace />} />
      <Route path="/login"       element={<Login />} />
      <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projects"    element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/inbox"       element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
      <Route path="/certifications" element={<ProtectedRoute><Certifications /></ProtectedRoute>} />
      <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings"    element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*"            element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
