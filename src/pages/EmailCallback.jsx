import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'react-toastify'

const EmailCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleEmailCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          toast.error('Autentikasi gagal')
          navigate('/auth')
          return
        }

        if (data.session?.user) {
          toast.success('Login berhasil!')
          navigate('/dashboard')
        } else {
          navigate('/auth')
        }
      } catch {
        toast.error('Terjadi kesalahan')
        navigate('/auth')
      }
    }

    handleEmailCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Memproses autentikasi...</p>
      </div>
    </div>
  )
}

export default EmailCallback