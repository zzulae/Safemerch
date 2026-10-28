import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  getStoredProfiles,
  saveStoredProfiles,
  getStoredSession,
  saveStoredSession,
} from '../lib/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      setLoading(true)
      if (isSupabaseConfigured) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session?.user) {
            setUser(session.user)
            await fetchSupabaseProfile(session.user.id)
          } else {
            setUser(null)
            setProfile(null)
          }

          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
            if (currentSession?.user) {
              setUser(currentSession.user)
              await fetchSupabaseProfile(currentSession.user.id)
            } else {
              setUser(null)
              setProfile(null)
            }
          })

          return () => {
            subscription?.unsubscribe()
          }
        } catch (err) {
          console.warn('Supabase auth initialization error:', err)
        }
      } else {
        // Fallback to official stored session
        const storedUser = getStoredSession()
        if (storedUser) {
          setUser(storedUser)
          setProfile(storedUser)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  async function fetchSupabaseProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data && !error) {
        setProfile(data)
      } else {
        setProfile({
          id: userId,
          full_name: 'Pengguna SafeMerch',
          role: 'user',
        })
      }
    } catch (err) {
      console.warn('Error fetching Supabase profile:', err)
    }
  }

  // Official Login handler
  async function login(email, password) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (data?.user) {
        setUser(data.user)
        await fetchSupabaseProfile(data.user.id)
      }
      return data
    }

    // Local / Offline Verification
    const cleanEmail = email.trim().toLowerCase()

    // 1. Admin Verification
    if (cleanEmail === 'admin@safemerch.id') {
      if (password !== 'SafeMerchAdmin2026!') {
        throw new Error('Kata sandi administrator salah. Silakan coba kembali.')
      }
      const adminProfile = {
        id: 'b1111111-1111-1111-1111-111111111111',
        full_name: 'Administrator Resmi SafeMerch',
        email: 'admin@safemerch.id',
        role: 'admin',
        created_at: '2026-01-01T00:00:00Z',
      }
      setUser(adminProfile)
      setProfile(adminProfile)
      saveStoredSession(adminProfile)
      return { user: adminProfile }
    }

    // 2. Regular User Verification
    const profiles = getStoredProfiles()
    const found = profiles.find((p) => p.email?.toLowerCase() === cleanEmail)

    if (found) {
      setUser(found)
      setProfile(found)
      saveStoredSession(found)
      return { user: found }
    }

    // If new user email
    const newUser = {
      id: 'usr-' + Date.now(),
      email: cleanEmail,
      full_name: cleanEmail.split('@')[0],
      role: 'user',
      created_at: new Date().toISOString(),
    }
    profiles.push(newUser)
    saveStoredProfiles(profiles)
    setUser(newUser)
    setProfile(newUser)
    saveStoredSession(newUser)
    return { user: newUser }
  }

  // Register handler
  async function register(email, password, fullName) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user',
          },
        },
      })
      if (error) throw error
      return data
    }

    const profiles = getStoredProfiles()
    const cleanEmail = email.trim().toLowerCase()
    const existing = profiles.find((p) => p.email?.toLowerCase() === cleanEmail)
    if (existing) {
      throw new Error('Email sudah terdaftar. Silakan masuk.')
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      email: cleanEmail,
      full_name: fullName.trim(),
      role: 'user',
      created_at: new Date().toISOString(),
    }
    profiles.push(newUser)
    saveStoredProfiles(profiles)
    setUser(newUser)
    setProfile(newUser)
    saveStoredSession(newUser)
    return { user: newUser }
  }

  // Logout handler
  async function logout() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
    saveStoredSession(null)
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        login,
        register,
        logout,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
