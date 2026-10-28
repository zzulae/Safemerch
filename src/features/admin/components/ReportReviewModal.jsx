import React, { useState } from 'react'
import { Modal } from '../../../components/common/Modal'
import { StatusBadge, RiskBadge, PlatformBadge } from '../../../components/common/Badge'
import { formatRupiah, formatDateTime } from '../../../lib/utils'
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react'

export function ReportReviewModal({
  report,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteReport,
}) {
  const [targetStatus, setTargetStatus] = useState(report?.status || 'approved')
  const [targetRiskLevel, setTargetRiskLevel] = useState(report?.scammer?.risk_level || 'HIGH')
  const [processing, setProcessing] = useState(false)

  if (!report) return null

  async function handleSave() {
    setProcessing(true)
    try {
      await onUpdateStatus(report.id, targetStatus, targetRiskLevel)
      onClose()
    } catch (err) {
      alert('Gagal memperbarui laporan: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Hapus laporan ini secara permanen dari basis data?')) return
    setProcessing(true)
    try {
      await onDeleteReport(report.id)
      onClose()
    } catch (err) {
      alert('Gagal menghapus laporan: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Moderasi & Verifikasi Laporan Penipuan"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-sm">
        {/* Scammer & Reporter Info Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Rekening Terlapor</span>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              {report.scammer?.target_name}
            </h4>
            <p className="text-xs font-mono text-slate-600">
              {report.scammer?.bank_name} - {report.scammer?.account_number}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <PlatformBadge platform={report.scammer?.platform} />
              <RiskBadge riskLevel={report.scammer?.risk_level} size="sm" />
            </div>
          </div>

          <div className="sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Pelapor & Kerugian</span>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {report.reporter?.full_name || 'Pengguna'} ({report.reporter?.role || 'user'})
            </p>
            <p className="text-xs text-slate-400">
              Tanggal Lapor: {formatDateTime(report.created_at)}
            </p>
            <p className="text-base font-extrabold text-rose-600 mt-2">
              Kerugian: {formatRupiah(report.loss_amount)}
            </p>
          </div>
        </div>

        {/* Chronology */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Kronologi Kejadian</h4>
          <p className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 text-sm whitespace-pre-line leading-relaxed">
            {report.chronology}
          </p>
        </div>

        {/* Evidences */}
        {report.report_evidences && report.report_evidences.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
              Bukti Yang Dilampirkan ({report.report_evidences.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.report_evidences.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100"
                >
                  <img
                    src={ev.image_url}
                    alt={ev.caption || 'Bukti'}
                    className="w-full h-44 object-cover"
                  />
                  {ev.caption && (
                    <p className="p-2 text-xs text-slate-600 bg-white border-t border-slate-100">
                      {ev.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Decision Form */}
        <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-4">
          <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Keputusan Moderator SafeMerch
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Laporan
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="approved">Approved (Setujui & Publikasikan)</option>
                <option value="rejected">Rejected (Tolak Laporan / Bukti Kurang)</option>
                <option value="pending">Pending (Kembalikan ke Antrean)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Perbarui Tingkat Risiko Scammer
              </label>
              <select
                value={targetRiskLevel}
                onChange={(e) => setTargetRiskLevel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="HIGH">HIGH (Sangat Berbahaya - Bukti Valid)</option>
                <option value="MEDIUM">MEDIUM (Waspada)</option>
                <option value="LOW">LOW (Risiko Rendah)</option>
                <option value="CLEARED">CLEARED (Terselesaikan / Mediasi Berhasil)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDelete}
            disabled={processing}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Laporan
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={processing}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
            >
              {processing ? 'Menyimpan...' : 'Terapkan Keputusan'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
