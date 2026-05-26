// apps/frontend/src/lib/auth-context.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api from './api'
import { User } from '@/types'

// Flutter の Riverpod の Provider と同じ概念
// → アプリ全体でログイン状態を共有する

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // アプリ起動時：保存されたトークンでログイン状態を復元
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  const register = async (email: string, password: string, name?: string) => {
    const res = await api.post('/auth/register', { email, password, name })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// カスタムフック（Flutter の ref.watch(authProvider) と同じ感覚）
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}