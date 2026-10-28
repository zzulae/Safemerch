import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '../schemas/authSchema'
import { useAuth } from '../../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, UserPlus, User, Lock, Mail } from 'lucide-react'
import { Alert } from '../../../components/common/Alert'

export function RegisterPage() {
  const { register: registerAuth, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data) {
    setLoading(true)
    setErrorMessage('')
    try {
      await registerAuth(data.email, data.password, data.fullName)
      setSuccessNotice('Akun berhasil didaftarkan! Mengalihkan...')
      setTimeout(() => {
        navigate('/')
      }, 1200)
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mendaftar akun.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-rose-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Buat Akun Safe<span className="text-rose-600">Merch</span>
          </h1>
          <p className="text-xs text-slate-500">
            Bergabung untuk melaporkan dan memantau penipuan merchandise
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
          {errorMessage && <Alert type="danger" message={errorMessage} />}
          {successNotice && <Alert type="success" message={successNotice} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  {...register('fullName')}
                  placeholder="Contoh: Budi Pratama"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition"
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-rose-500 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="budi@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Ulangi kata sandi"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akun Baru</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-bold text-rose-600 hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
