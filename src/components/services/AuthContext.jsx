import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-toastify'
import { AuthContext } from '../../contexts/AuthContext'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN') {
        toast.success('Login berhasil!')
      } else if (event === 'SIGNED_OUT') {
        toast.info('Anda telah logout')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    try {
      console.log('Attempting login with:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        
        // Handle email confirmation error specifically
        if (error.message.includes('Email not confirmed')) {
          toast.error('Email belum dikonfirmasi. Silakan cek email Anda untuk link konfirmasi.')
        } else {
          toast.error(error.message)
        }
        
        return { error }
      }

      console.log('Login successful:', data)
      return { data }
    } catch (error) {
      console.error('Login exception:', error)
      toast.error('Terjadi kesalahan saat login. Periksa koneksi internet dan konfigurasi Supabase.')
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message)
      }
    } catch {
      toast.error('Terjadi kesalahan saat logout')
    }
  }


  const isAdmin = () => {
    // All authenticated users are considered admins for simplicity
    return !!user
  }

  const isUser = () => {
    return !!user
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: isAdmin(),
    isUser: isUser(),
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}