import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { reportSchema, INDONESIAN_BANKS } from '../schemas/reportSchema'
import { safeMerchApi } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { formatRupiah } from '../../../lib/utils'
import { Alert } from '../../../components/common/Alert'
import { LogIn } from 'lucide-react'

export function CreateReportPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      target_name: searchParams.get('target_name') || '',
      bank_name: searchParams.get('bank_name') || 'BCA',
      account_number: searchParams.get('account_number') || searchParams.get('account') || '',
      social_handle: searchParams.get('social_handle') || '',
      platform: searchParams.get('platform') || 'Twitter',
      loss_amount: searchParams.get('loss_amount') || '',
      chronology: '',
      primary_evidence_url:
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
      primary_evidence_caption: 'Bukti transfer',
      secondary_evidence_url: '',
      secondary_evidence_caption: '',
    },
  })

  const watchedLoss = watch('loss_amount')

  async function onSubmit(data) {
    if (!user) {
      setErrorMessage('Anda harus masuk terlebih dahulu untuk mengirimkan laporan.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      const scammerData = {
        target_name: data.target_name,
        bank_name: data.bank_name,
        account_number: data.account_number,
        social_handle: data.social_handle,
        platform: data.platform,
      }

      const reportData = {
        chronology: data.chronology,
        loss_amount: data.loss_amount,
      }

      const evidenceData = []
      if (data.primary_evidence_url) {
        evidenceData.push({
          image_url: data.primary_evidence_url,
          caption: data.primary_evidence_caption,
        })
      }
      if (data.secondary_evidence_url) {
        evidenceData.push({
          image_url: data.secondary_evidence_url,
          caption: data.secondary_evidence_caption,
        })
      }

      await safeMerchApi.createReport({
        scammerData,
        reportData,
        evidenceData,
        reporterId: user.id,
      })

      setSuccessMessage('Laporan berhasil dikirim dan akan ditinjau oleh tim moderator.')
      setTimeout(() => {
        navigate('/my-reports')
      }, 1200)
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mengirim laporan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Laporkan Penipuan</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Isi informasi rekening penipu dan kronologi kejadian dengan benar.
        </p>
      </div>

      {!user && (
        <Alert
          type="warning"
          title="Perlu Masuk Akun"
          message="Silakan masuk ke akun Anda terlebih dahulu sebelum membuat laporan."
        >
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold text-xs"
            >
              <LogIn className="w-3.5 h-3.5" /> Masuk Akun
            </Link>
          </div>
        </Alert>
      )}

      {errorMessage && <Alert type="danger" message={errorMessage} />}
      {successMessage && <Alert type="success" message={successMessage} />}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
        {/* Row 1: Target Name & Bank */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Pemilik Rekening / E-Wallet *
            </label>
            <input
              type="text"
              {...register('target_name')}
              placeholder="Contoh: Rizky Maulana"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            {errors.target_name && (
              <p className="text-xs text-rose-500 mt-1">{errors.target_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank / E-Wallet *
            </label>
            <select
              {...register('bank_name')}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              {INDONESIAN_BANKS.map((b) => (
                <option key={b} value={b.split(' ')[0]}>
                  {b}
                </option>
              ))}
            </select>
            {errors.bank_name && (
              <p className="text-xs text-rose-500 mt-1">{errors.bank_name.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Account Number & Social Handle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Rekening / No. HP E-Wallet *
            </label>
            <input
              type="text"
              {...register('account_number')}
              placeholder="Contoh: 8270918231"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            {errors.account_number && (
              <p className="text-xs text-rose-500 mt-1">{errors.account_number.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username Akun / Nama Toko
            </label>
            <input
              type="text"
              {...register('social_handle')}
              placeholder="Contoh: @kpopmerch_jkt"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        </div>

        {/* Row 3: Platform */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Platform Transaksi *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {['Twitter', 'Shopee', 'Tokopedia', 'Instagram'].map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <input type="radio" value={p} {...register('platform')} />
                <span>{p === 'Twitter' ? 'Twitter / X' : p}</span>
              </label>
            ))}
          </div>
          {errors.platform && (
            <p className="text-xs text-rose-500 mt-1">{errors.platform.message}</p>
          )}
        </div>

        {/* Row 4: Loss Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nominal Kerugian (Rupiah) *
          </label>
          <input
            type="number"
            {...register('loss_amount')}
            placeholder="Contoh: 500000"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
          />
          {watchedLoss && Number(watchedLoss) > 0 && (
            <span className="text-xs font-medium text-rose-600 mt-1 block">
              {formatRupiah(watchedLoss)}
            </span>
          )}
          {errors.loss_amount && (
            <p className="text-xs text-rose-500 mt-1">{errors.loss_amount.message}</p>
          )}
        </div>

        {/* Row 5: Chronology */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Kronologi Penipuan *
          </label>
          <textarea
            rows={4}
            {...register('chronology')}
            placeholder="Jelaskan alur transaksi, barang yang dibeli, dan saat kontak diputus/diblokir..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          {errors.chronology && (
            <p className="text-xs text-rose-500 mt-1">{errors.chronology.message}</p>
          )}
        </div>

        {/* Row 6: Evidence Image URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tautan / URL Bukti Foto Transfer *
          </label>
          <input
            type="url"
            {...register('primary_evidence_url')}
            placeholder="https://..."
            className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          {errors.primary_evidence_url && (
            <p className="text-xs text-rose-500 mt-1">
              {errors.primary_evidence_url.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end gap-3">
          <Link
            to="/search"
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border rounded-lg"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting || !user}
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition disabled:opacity-50"
          >
            {submitting ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </div>
      </form>
    </div>
  )
}
