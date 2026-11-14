import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { reportSchema, INDONESIAN_BANKS } from '../schemas/reportSchema'
import { safeMerchApi } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { formatRupiah } from '../../../lib/utils'
import { Alert } from '../../../components/common/Alert'
import { LogIn, UploadCloud, Trash2, Plus } from 'lucide-react'

function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error(`File "${file.name}" bukan format gambar yang valid.`))
    }

    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error(`Ukuran foto "${file.name}" melebihi batas 10MB.`))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Gagal membaca file "${file.name}".`))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () =>
        resolve({
          image_url: e.target.result,
          file_name: file.name,
          file_size: file.size,
        })
      img.onload = () => {
        const maxDimension = 1280
        let { width, height } = img

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)

        resolve({
          image_url: compressedDataUrl,
          file_name: file.name,
          file_size: file.size,
        })
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function CreateReportPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      evidences: [],
    },
  })

  useEffect(() => {
    register('evidences')
  }, [register])

  const watchedLoss = watch('loss_amount')
  const watchedEvidences = watch('evidences') || []

  async function handleFiles(files) {
    if (!files || files.length === 0) return
    setUploadError('')
    setUploadingPhotos(true)

    try {
      const currentList = watch('evidences') || []
      const fileArray = Array.from(files)

      if (currentList.length + fileArray.length > 8) {
        setUploadError('Maksimal dapat mengunggah 8 bukti foto.')
        setUploadingPhotos(false)
        return
      }

      const newItems = []
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        const processed = await processImageFile(file)
        newItems.push({
          id: 'ev_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
          image_url: processed.image_url,
          caption:
            currentList.length + newItems.length === 0
              ? 'Bukti transfer / chat utama'
              : `Bukti pendukung #${currentList.length + newItems.length + 1}`,
          file_name: processed.file_name,
          file_size: processed.file_size,
        })
      }

      const updated = [...currentList, ...newItems]
      setValue('evidences', updated, { shouldValidate: true })
    } catch (err) {
      setUploadError(err.message || 'Gagal memproses gambar.')
    } finally {
      setUploadingPhotos(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleRemoveEvidence(indexToRemove) {
    const currentList = watch('evidences') || []
    const updated = currentList.filter((_, idx) => idx !== indexToRemove)
    setValue('evidences', updated, { shouldValidate: true })
  }

  function handleCaptionChange(index, newCaption) {
    const currentList = watch('evidences') || []
    const updated = [...currentList]
    updated[index] = { ...updated[index], caption: newCaption }
    setValue('evidences', updated, { shouldValidate: false })
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  async function onSubmit(data) {
    if (!user) {
      setErrorMessage('Anda harus masuk terlebih dahulu untuk mengirimkan laporan.')
      return
    }

    if (!data.evidences || data.evidences.length === 0) {
      setErrorMessage('Wajib melampirkan minimal 1 bukti foto.')
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

      const evidenceData = data.evidences.map((ev, index) => ({
        image_url: ev.image_url,
        caption: ev.caption?.trim() || `Bukti #${index + 1}`,
      }))

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

        {/* Row 6: Evidence Photos Direct Upload */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Bukti Foto (Struk Transfer / Chat) *
            </label>
            <p className="text-xs text-slate-500">
              Pilih langsung foto bukti dari perangkat Anda. Tidak perlu lagi memasukkan URL atau tautan web.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            className="hidden"
          />

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
              isDragging
                ? 'border-rose-500 bg-rose-50/60'
                : 'border-slate-300 hover:border-rose-400 bg-slate-50/60 hover:bg-rose-50/20'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  <span className="text-rose-600 underline">Klik untuk pilih foto</span> atau seret foto ke sini
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Format: PNG, JPG, JPEG, WEBP (maks. 10MB per foto, hingga 8 foto)
                </p>
              </div>
            </div>
          </div>

          {uploadingPhotos && (
            <div className="text-xs text-slate-500 flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <span className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
              <span>Sedang memproses dan mengompres foto...</span>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
              {uploadError}
            </p>
          )}

          {errors.evidences && (
            <p className="text-xs text-rose-500 mt-1">{errors.evidences.message}</p>
          )}

          {/* Uploaded Photos Preview List */}
          {watchedEvidences.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Foto Terlampir ({watchedEvidences.length})</span>
                {watchedEvidences.length < 8 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Foto Lagi
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {watchedEvidences.map((ev, index) => (
                  <div
                    key={ev.id || index}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 relative group"
                  >
                    <img
                      src={ev.image_url}
                      alt={ev.caption || 'Bukti'}
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-white"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            {index === 0 ? 'Bukti Utama' : `Bukti #${index + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidence(index)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-white transition cursor-pointer"
                            title="Hapus foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {ev.file_name && (
                          <p className="text-[11px] text-slate-500 truncate mt-1" title={ev.file_name}>
                            {ev.file_name} {ev.file_size ? `(${formatFileSize(ev.file_size)})` : ''}
                          </p>
                        )}
                      </div>

                      <div className="mt-1.5">
                        <input
                          type="text"
                          value={ev.caption || ''}
                          onChange={(e) => handleCaptionChange(index, e.target.value)}
                          placeholder="Keterangan bukti (opsional)"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </div>
      </form>
    </div>
  )
}
