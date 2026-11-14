import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { safeMerchApi } from '../../../lib/supabase'
import { StatusBadge } from '../../../components/common/Badge'
import { formatRupiah, formatDateTime } from '../../../lib/utils'
import { Modal } from '../../../components/common/Modal'
import { Alert } from '../../../components/common/Alert'
import { EditReportModal } from '../components/EditReportModal'
import { Plus, Eye, Trash2, Edit3, RotateCcw, ExternalLink } from 'lucide-react'

export function MyReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [editingReport, setEditingReport] = useState(null)
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

  async function handleDeleteOrRequestWithdraw(report) {
    if (report.status === 'approved') {
      const confirmed = window.confirm(
        'Laporan ini sudah berstatus Terverifikasi (Approved) dan dipublikasikan.\n\nSesuai aturan keamanan, penghapusan laporan yang telah dipublikasikan harus ditinjau ulang oleh tim moderator.\n\nApakah Anda ingin mengajukan penghapusan laporan ini?'
      )
      if (!confirmed) return

      try {
        await safeMerchApi.requestReportDeletion(report.id)
        setFeedback({
          type: 'success',
          text: 'Pengajuan penghapusan berhasil dikirim. Status laporan kini "Pengajuan Hapus" dan akan ditinjau ulang oleh moderator.',
        })
        await loadMyReports()
        if (selectedReport?.id === report.id) setSelectedReport(null)
      } catch (err) {
        setFeedback({ type: 'danger', text: 'Gagal mengajukan penghapusan: ' + err.message })
      }
    } else if (report.status === 'pending_deletion') {
      const confirmed = window.confirm(
        'Batalkan pengajuan penghapusan ini?\n\nStatus laporan akan dikembalikan ke Terverifikasi (Approved).'
      )
      if (!confirmed) return

      try {
        await safeMerchApi.cancelReportDeletion(report.id)
        setFeedback({
          type: 'success',
          text: 'Pengajuan penghapusan dibatalkan. Laporan kembali aktif berstatus Terverifikasi.',
        })
        await loadMyReports()
        if (selectedReport?.id === report.id) setSelectedReport(null)
      } catch (err) {
        setFeedback({ type: 'danger', text: 'Gagal membatalkan pengajuan: ' + err.message })
      }
    } else {
      // pending or rejected
      const confirmed = window.confirm('Hapus laporan ini secara permanen?')
      if (!confirmed) return

      try {
        await safeMerchApi.deleteReport(report.id)
        setReports((prev) => prev.filter((r) => r.id !== report.id))
        setFeedback({ type: 'success', text: 'Laporan berhasil dihapus.' })
        if (selectedReport?.id === report.id) setSelectedReport(null)
      } catch (err) {
        setFeedback({ type: 'danger', text: 'Gagal menghapus laporan.' })
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Saya</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Daftar laporan penipuan yang telah Anda kirimkan. Anda dapat mengedit atau menghapus laporan kapan saja.
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
                  {/* Button Detail */}
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="p-1 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Detail
                  </button>

                  {/* Button Edit (Bisa untuk pending, approved, maupun rejected) */}
                  <button
                    onClick={() => setEditingReport(report)}
                    className="p-1 text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Edit laporan (perlu ditinjau ulang setelah diedit)"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>

                  {/* Button Hapus / Ajukan Hapus */}
                  {report.status === 'pending_deletion' ? (
                    <button
                      onClick={() => handleDeleteOrRequestWithdraw(report)}
                      className="p-1 text-amber-600 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Batalkan pengajuan hapus"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Batal Hapus
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeleteOrRequestWithdraw(report)}
                      className="p-1 text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title={
                        report.status === 'approved'
                          ? 'Ajukan penghapusan laporan (perlu ditinjau ulang oleh moderator)'
                          : 'Hapus laporan'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {report.status === 'approved' ? 'Ajukan Hapus' : 'Hapus'}
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

            {selectedReport.post_url && (
              <div>
                <span className="text-slate-400 block mb-1">Link Postingan Korban:</span>
                <a
                  href={selectedReport.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:underline font-medium break-all bg-rose-50/50 p-2.5 rounded-lg border border-rose-100"
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{selectedReport.post_url}</span>
                </a>
              </div>
            )}

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

            {/* Action buttons inside detail modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const rep = selectedReport
                  setSelectedReport(null)
                  setEditingReport(rep)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Laporan Ini</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteOrRequestWithdraw(selectedReport)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {selectedReport.status === 'approved'
                    ? 'Ajukan Hapus Laporan'
                    : selectedReport.status === 'pending_deletion'
                    ? 'Batalkan Pengajuan Hapus'
                    : 'Hapus Laporan'}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      {editingReport && (
        <EditReportModal
          report={editingReport}
          isOpen={Boolean(editingReport)}
          onClose={() => setEditingReport(null)}
          onSuccess={(msg) => {
            setFeedback({ type: 'success', text: msg })
            loadMyReports()
          }}
        />
      )}
    </div>
  )
}
