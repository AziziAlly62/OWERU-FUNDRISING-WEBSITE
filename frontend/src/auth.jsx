import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loginRequest, registerRequest, logoutRequest, getToken, setToken } from './api'

export const ROLES = {
  admin: { label: 'Admin', labelSw: 'Msimamizi Mkuu', path: '/portal/dashboard' },
  manager: { label: 'Manager', labelSw: 'Meneja', path: '/portal/dashboard' },
  reviewer: { label: 'Board Review', labelSw: 'Bodi', path: '/portal/review' },
  donor: { label: 'Donor', labelSw: 'Mfadhili', path: '/portal/donor' },
  endorser: { label: 'Church', labelSw: 'Kanisa', path: '/portal/church' },
  applicant: { label: 'Applicant', labelSw: 'Mwombaji', path: '/portal/applicant' },
}

const AuthContext = createContext(null)

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  reviewer: 'Board Member',
  donor: 'Donor',
  endorser: 'Church',
  applicant: 'Applicant',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('oweru_user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) localStorage.setItem('oweru_user', JSON.stringify(user))
    else localStorage.removeItem('oweru_user')
  }, [user])

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null)
    }
    window.addEventListener('oweru:unauthorized', onUnauthorized)
    return () => window.removeEventListener('oweru:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const u = await loginRequest(email, password)
      const userObj = { ...u, role: u.role || 'admin', loginAt: Date.now() }
      setUser(userObj)
      return userObj
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async ({ name, email, password, role, organization_id, church_name, church_region }) => {
    setLoading(true)
    try {
      const u = await registerRequest({ name, email, password, role, organization_id, church_name, church_region })
      const userObj = { ...u, role: u.role || role, loginAt: Date.now() }
      setUser(userObj)
      return userObj
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const demoLogin = useCallback((role, name) => {
    const u = { role, name: name || ROLE_LABELS[role] || role, demo: true, loginAt: Date.now() }
    setUser(u)
    return u
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, demoLogin, loading, getToken, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
