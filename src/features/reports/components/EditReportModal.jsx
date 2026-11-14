import React, { useState, useRef, useEffect } from 'react'
import { Modal } from '../../../components/common/Modal'
import { INDONESIAN_BANKS } from '../schemas/reportSchema'
import { safeMerchApi } from '../../../lib/supabase'
import { formatRupiah } from '../../../lib/utils'
import { UploadCloud, Trash2, Link2, AlertTriangle, AlertCircle } from 'lucide-react'

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

export function EditReportModal({ report, isOpen, onClose, onSuccess, _isAdmin = false }) {
  const fileInputRef = useRef(null)

  const [targetName, setTargetName] = useState('')
  const [bankName, setBankName] = useState('BCA')
  const [accountNumber, setAccountNumber] = useState('')
  const [socialHandle, setSocialHandle] = useState('')
  const [platform, setPlatform] = useState('Twitter')
  const [lossAmount, setLossAmount] = useState('')
  const [chronology, setChronology] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [evidences, setEvidences] = useState([])

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (report) {
      setTargetName(report.scammer?.target_name || '')
      setBankName(report.scammer?.bank_name || 'BCA')
      setAccountNumber(report.scammer?.account_number || '')
      setSocialHandle(report.scammer?.social_handle || '')
      setPlatform(report.scammer?.platform || 'Twitter')
      setLossAmount(report.loss_amount ? String(report.loss_amount) : '')
      setChronology(report.chronology || '')
      setPostUrl(report.post_url || '')
      setEvidences(
        (report.report_evidences || []).map((ev, idx) => ({
          id: ev.id || `ev-init-${idx}`,
          image_url: ev.image_url,
          caption: ev.caption || `Bukti #${idx + 1}`,
          file_name: ev.file_name || '',
          file_size: ev.file_size || null,
        }))
      )
      setErrorMsg('')
    }
  }, [report, isOpen])

  if (!report) return null

  async function handleFiles(files) {
    if (!files || files.length === 0) return
    setErrorMsg('')
    setUploadingPhotos(true)

    try {
      const fileArray = Array.from(files)
      if (evidences.length + fileArray.length > 8) {
        setErrorMsg('Maksimal dapat melampirkan 8 bukti foto.')
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
            evidences.length + newItems.length === 0
              ? 'Bukti transfer / chat utama'
              : `Bukti pendukung #${evidences.length + newItems.length + 1}`,
          file_name: processed.file_name,
          file_size: processed.file_size,
        })
      }

      setEvidences((prev) => [...prev, ...newItems])
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses gambar.')
    } finally {
      setUploadingPhotos(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleRemoveEvidence(indexToRemove) {
    setEvidences((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  function handleCaptionChange(index, newCaption) {
    setEvidences((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], caption: newCaption }
      return updated
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    if (!targetName.trim() || targetName.trim().length < 2) {
      setErrorMsg('Nama pemilik rekening minimal 2 karakter.')
      return
    }

    if (!accountNumber.trim() || accountNumber.trim().length < 5) {
      setErrorMsg('Nomor rekening minimal 5 karakter.')
      return
    }

    if (!lossAmount || Number(lossAmount) < 1000) {
      setErrorMsg('Nominal kerugian minimal Rp 1.000.')
      return
    }

    if (!chronology.trim() || chronology.trim().length < 25) {
      setErrorMsg('Kronologi kejadian minimal 25 karakter.')
      return
    }

    if (postUrl.trim() && !/^https?:\/\/.+/i.test(postUrl.trim())) {
      setErrorMsg('Format link postingan harus diawali http:// atau https://')
      return
    }

    if (evidences.length === 0) {
      setErrorMsg('Wajib melampirkan minimal 1 bukti foto.')
      return
    }

    setSaving(true)

    try {
      const scammerData = {
        target_name: targetName.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        social_handle: socialHandle.trim() || null,
        platform,
      }

      const reportData = {
        chronology: chronology.trim(),
        loss_amount: Number(lossAmount),
        post_url: postUrl.trim() || null,
      }

      const evidenceData = evidences.map((ev, index) => ({
        image_url: ev.image_url,
        caption: ev.caption?.trim() || `Bukti #${index + 1}`,
      }))

      // Sesuai aturan: setelah diedit, laporan perlu ditinjau ulang (status kembali ke pending)
      await safeMerchApi.updateReport(report.id, {
        scammerData,
        reportData,
        evidenceData,
        resetStatusToPending: true,
      })

      if (onSuccess) {
        onSuccess('Laporan berhasil diperbarui dan dialihkan ke antrean moderasi untuk ditinjau ulang.')
      }
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan perubahan laporan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Hasil Laporan Penipuan"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-800">
        {/* Notice Re-review */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Peninjauan Ulang Otomatis:</span>
            <p className="mt-0.5 text-amber-800">
              {report.status === 'approved'
                ? 'Laporan ini saat ini berstatus Terverifikasi (Approved). Setelah Anda menyimpan hasil edit, statusnya akan otomatis kembali ke "Menunggu Verifikasi (Pending)" agar dapat ditinjau ulang oleh tim moderator sebelum dipublikasikan kembali.'
                : 'Perubahan pada laporan akan langsung diperbarui dan masuk ke antrean verifikasi tim moderator.'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Row 1: Target Name & Bank */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Pemilik Rekening / E-Wallet *
            </label>
            <input
              type="text"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder="Contoh: Rizky Maulana"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank / E-Wallet *
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              {INDONESIAN_BANKS.map((b) => (
                <option key={b} value={b.split(' ')[0]}>
                  {b}
                </option>
              ))}
            </select>
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
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Contoh: 8270918231"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username Akun / Nama Toko
            </label>
            <input
              type="text"
              value={socialHandle}
              onChange={(e) => setSocialHandle(e.target.value)}
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
                className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition ${
                  platform === p ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="edit-platform"
                  value={p}
                  checked={platform === p}
                  onChange={() => setPlatform(p)}
                />
                <span>{p === 'Twitter' ? 'Twitter / X' : p}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Row 4: Loss Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nominal Kerugian (Rupiah) *
          </label>
          <input
            type="number"
            value={lossAmount}
            onChange={(e) => setLossAmount(e.target.value)}
            placeholder="Contoh: 500000"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
          />
          {lossAmount && Number(lossAmount) > 0 && (
            <span className="text-xs font-medium text-rose-600 mt-1 block">
              {formatRupiah(lossAmount)}
            </span>
          )}
        </div>

        {/* Row 5: Chronology */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Kronologi Penipuan * (Minimal 25 karakter)
          </label>
          <textarea
            rows={4}
            value={chronology}
            onChange={(e) => setChronology(e.target.value)}
            placeholder="Jelaskan alur transaksi dan penipuan..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        {/* Row 6: Victim Post Link */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Link Postingan Korban Penipuan (Opsional)
          </label>
          <div className="relative flex items-center">
            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://x.com/username/status/... atau https://instagram.com/p/..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tautan ke utas Twitter/X, Instagram, TikTok, atau status korban di media sosial.
          </p>
        </div>

        {/* Row 7: Evidences */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Bukti Foto (Struk Transfer / Tangkapan Layar Chat) *
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragging(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
              isDragging
                ? 'border-rose-500 bg-rose-50/60'
                : 'border-slate-300 hover:border-rose-400 bg-slate-50/60 hover:bg-rose-50/20'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <UploadCloud className="w-5 h-5 text-rose-600" />
              <p className="text-xs font-semibold text-slate-800">
                <span className="text-rose-600 underline">Pilih foto</span> atau seret file ke sini
              </p>
              <p className="text-[11px] text-slate-400">
                PNG, JPG, WEBP (maks. 10MB per foto, hingga 8 foto)
              </p>
            </div>
          </div>

          {uploadingPhotos && (
            <div className="text-xs text-slate-500 flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <span className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
              <span>Memproses foto...</span>
            </div>
          )}

          {evidences.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {evidences.map((ev, index) => (
                <div
                  key={ev.id || index}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 relative"
                >
                  <img
                    src={ev.image_url}
                    alt={ev.caption || 'Bukti'}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-white"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                        {index === 0 ? 'Bukti Utama' : `Bukti #${index + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-1">
                      <input
                        type="text"
                        value={ev.caption || ''}
                        onChange={(e) => handleCaptionChange(index, e.target.value)}
                        placeholder="Keterangan foto"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Menyimpan & Mengajukan...' : 'Simpan & Ajukan Tinjauan Ulang'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
