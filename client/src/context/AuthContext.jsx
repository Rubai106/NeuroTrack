import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nt_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('nt_token')
    if (!token) { setLoading(false); return }
    authApi.getMe()
      .then(r => { setUser(r.data.user); localStorage.setItem('nt_user', JSON.stringify(r.data.user)) })
      .catch(() => { localStorage.removeItem('nt_token'); localStorage.removeItem('nt_user') })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('nt_token', data.token)
    localStorage.setItem('nt_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await authApi.register({ name, email, password })
    localStorage.setItem('nt_token', data.token)
    localStorage.setItem('nt_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nt_token')
    localStorage.removeItem('nt_user')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await authApi.getMe()
    setUser(data.user)
    localStorage.setItem('nt_user', JSON.stringify(data.user))
    return data.user
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
