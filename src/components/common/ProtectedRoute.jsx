import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldAlert } from 'lucide-react'

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Memverifikasi otentikasi...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Akses Dibatasi (Administrator Only)</h2>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed">
          Halaman ini khusus untuk Tim Administrator SafeMerch. Anda saat ini masuk sebagai{' '}
          <strong className="text-slate-900">{profile?.full_name || user.email}</strong> dengan peran{' '}
          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold">
            {profile?.role || 'user'}
          </span>
          .
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Navigate to="/" />
        </div>
      </div>
    )
  }

  return children
}
