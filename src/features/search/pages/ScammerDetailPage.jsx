import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { safeMerchApi } from '../../../lib/supabase'
import { RiskBadge, PlatformBadge } from '../../../components/common/Badge'
import { formatRupiah, formatDate, formatDateTime } from '../../../lib/utils'
import { Modal } from '../../../components/common/Modal'
import { Copy, Check, ArrowLeft, Plus } from 'lucide-react'

export function ScammerDetailPage() {
  const { id } = useParams()
  const [scammer, setScammer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    loadScammerDetail()
  }, [id])

  async function loadScammerDetail() {
    setLoading(true)
    try {
      const data = await safeMerchApi.getScammerById(id)
      setScammer(data)
    } catch (err) {
      console.error('Error loading scammer detail:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyAccount = () => {
    if (!scammer) return
    navigator.clipboard.writeText(scammer.account_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Memuat profil...
      </div>
    )
  }

  if (!scammer) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 border border-slate-200 rounded-xl text-center space-y-3 bg-white">
        <h2 className="text-base font-bold text-slate-900">Data Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">Rekening ini tidak ada atau telah dihapus.</p>
        <Link
          to="/search"
          className="inline-block px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium"
        >
          Kembali ke Pencarian
        </Link>
      </div>
    )
  }

  const approvedReports = (scammer.reports || []).filter((r) => r.status === 'approved')
  const totalLoss = approvedReports.reduce((sum, r) => sum + Number(r.loss_amount || 0), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/search"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Pencarian
      </Link>

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PlatformBadge platform={scammer.platform} />
              <RiskBadge riskLevel={scammer.risk_level} size="sm" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {scammer.target_name}
            </h1>
            {scammer.social_handle && (
              <p className="text-xs font-mono text-slate-500">
                Akun / Toko: {scammer.social_handle}
              </p>
            )}
          </div>

          <Link
            to={`/reports/create?target_name=${encodeURIComponent(scammer.target_name)}&bank_name=${encodeURIComponent(scammer.bank_name)}&account_number=${encodeURIComponent(scammer.account_number)}&platform=${encodeURIComponent(scammer.platform)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Laporkan Korban Baru
          </Link>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between text-slate-500">
              <span>Nomor Rekening</span>
              <button onClick={copyAccount} className="hover:text-slate-900">
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="font-mono font-bold text-slate-900 text-sm mt-1">
              {scammer.bank_name} - {scammer.account_number}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block">Total Kerugian Terverifikasi</span>
            <p className="font-bold text-rose-600 text-sm mt-1">
              {formatRupiah(totalLoss)}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block">Tanggal Terdata</span>
            <p className="font-medium text-slate-800 text-sm mt-1">
              {formatDate(scammer.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Reports Timeline */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Riwayat Laporan Korban ({approvedReports.length})
        </h2>

        {approvedReports.length > 0 ? (
          <div className="space-y-3">
            {approvedReports.map((report) => (
              <div
                key={report.id}
                className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">
                    Dilaporkan {formatDateTime(report.created_at)}
                  </span>
                  <span className="font-bold text-rose-600">
                    Kerugian: {formatRupiah(report.loss_amount)}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {report.chronology}
                </p>

                {report.report_evidences && report.report_evidences.length > 0 && (
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-1">Bukti Transfer:</span>
                    <div className="flex gap-2 overflow-x-auto">
                      {report.report_evidences.map((ev) => (
                        <img
                          key={ev.id}
                          src={ev.image_url}
                          alt="Bukti"
                          onClick={() => setSelectedImage(ev)}
                          className="w-24 h-16 object-cover rounded cursor-pointer border border-slate-200"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            Belum ada laporan terverifikasi untuk rekening ini.
          </div>
        )}
      </div>

      {/* Modal View Image */}
      <Modal
        isOpen={Boolean(selectedImage)}
        onClose={() => setSelectedImage(null)}
        title="Bukti Transfer"
        maxWidth="max-w-lg"
      >
        {selectedImage && (
          <div className="space-y-2">
            <img
              src={selectedImage.image_url}
              alt="Bukti"
              className="w-full max-h-96 object-contain rounded-lg"
            />
            {selectedImage.caption && (
              <p className="text-xs text-slate-500">{selectedImage.caption}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
