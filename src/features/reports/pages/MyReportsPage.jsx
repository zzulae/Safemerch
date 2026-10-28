import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { safeMerchApi } from '../../../lib/supabase'
import { StatusBadge, PlatformBadge } from '../../../components/common/Badge'
import { formatRupiah, formatDateTime } from '../../../lib/utils'
import { Modal } from '../../../components/common/Modal'
import { Alert } from '../../../components/common/Alert'
import { Plus, Eye, Trash2, Clock, CheckCircle } from 'lucide-react'

export function MyReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadMyReports()
    }
  }, [user])

  async function loadMyReports() {
    setLoading(true)
    try {
      const data = await safeMerchApi.getUserReports(user.id)
      setReports(data)
    } catch (err) {
      console.error('Error fetching user reports:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleWithdraw(reportId) {
    if (!window.confirm('Batalkan laporan ini?')) return
    try {
      await safeMerchApi.deleteReport(reportId)
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      setFeedback({ type: 'success', text: 'Laporan berhasil dibatalkan.' })
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Gagal membatalkan laporan.' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Saya</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Daftar laporan penipuan yang telah Anda kirimkan.
          </p>
        </div>
        <Link
          to="/reports/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Laporan Baru</span>
        </Link>
      </div>

      {feedback && <Alert type={feedback.type} message={feedback.text} />}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Memuat data laporan...
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-white rounded-xl border border-slate-200 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <StatusBadge status={report.status} />
                  <span className="text-slate-400">• {formatDateTime(report.created_at)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="p-1 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Detail
                  </button>
                  {report.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(report.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1"
                      title="Batalkan laporan"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Batal
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <div>
                  <h4 className="font-bold text-slate-900">
                    {report.scammer?.target_name || 'Target Penipuan'}
                  </h4>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    {report.scammer?.bank_name} - {report.scammer?.account_number}
                  </p>
                </div>
                <div className="text-sm font-bold text-rose-600">
                  {formatRupiah(report.loss_amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 border border-slate-200 rounded-xl text-center space-y-3 bg-white">
          <p className="text-xs text-slate-500">Anda belum pernah mengirimkan laporan penipuan.</p>
          <Link
            to="/reports/create"
            className="inline-block px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
          >
            Kirim Laporan Sekarang
          </Link>
        </div>
      )}

      {/* Modal Detail */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title="Detail Laporan"
        maxWidth="max-w-xl"
      >
        {selectedReport && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-400 block">Status:</span>
                <StatusBadge status={selectedReport.status} />
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Kerugian:</span>
                <span className="font-bold text-sm text-rose-600">{formatRupiah(selectedReport.loss_amount)}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block">Rekening Terlapor:</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {selectedReport.scammer?.target_name} ({selectedReport.scammer?.bank_name} - {selectedReport.scammer?.account_number})
              </p>
            </div>

            <div>
              <span className="text-slate-400 block">Kronologi Kejadian:</span>
              <p className="p-3 bg-slate-50 rounded-lg text-slate-700 leading-relaxed mt-1 whitespace-pre-line">
                {selectedReport.chronology}
              </p>
            </div>

            {selectedReport.report_evidences && selectedReport.report_evidences.length > 0 && (
              <div>
                <span className="text-slate-400 block mb-1">Bukti Foto / Struk:</span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedReport.report_evidences.map((ev) => (
                    <img
                      key={ev.id}
                      src={ev.image_url}
                      alt="Bukti"
                      className="w-full h-32 object-cover rounded-lg border border-slate-200"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
