'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { auth } from '@/firebase/firebaseConfig'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { BLOG_ADMIN_EMAILS, LEGACY_PLACEHOLDER_ADMIN_EMAILS } from '@/lib/adminEmails'

interface AdminContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

// Admin emails live in lib/adminEmails.ts (shared with the server-side
// upload check). This client gate is cosmetic; the server re-checks.
const adminEmails: readonly string[] = [...BLOG_ADMIN_EMAILS, ...LEGACY_PLACEHOLDER_ADMIN_EMAILS]

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? user.email : 'No user')
      setUser(user)
      const isAdminUser = user ? adminEmails.includes(user.email || '') : false
      console.log('Is admin:', isAdminUser, 'Email:', user?.email)
      setIsAdmin(isAdminUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return { user, loading, isAdmin, login, logout }
} 