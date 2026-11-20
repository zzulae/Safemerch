import React, { useState, useEffect } from 'react'
import { safeMerchApi } from '../../../lib/supabase'
import { StatusBadge, RiskBadge, PlatformBadge } from '../../../components/common/Badge'
import { ReportReviewModal } from '../components/ReportReviewModal'
import { formatRupiah, formatDateTime, formatDate } from '../../../lib/utils'
import { Alert } from '../../../components/common/Alert'
import { Link } from 'react-router-dom'
import { ExternalLink, Edit3, Trash2 } from 'lucide-react'
import { EditReportModal } from '../../reports/components/EditReportModal'

export function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalScammers: 0,
    totalReports: 0,
    approvedReports: 0,
    pendingReports: 0,
    totalLoss: 0,
  })
  const [activeTab, setActiveTab] = useState('reports') // 'reports' | 'scammers'
  const [reportsFilter, setReportsFilter] = useState('ALL')
  const [reports, setReports] = useState([])
  const [scammers, setScammers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReviewReport, setSelectedReviewReport] = useState(null)
  const [editingReport, setEditingReport] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [statsData, reportsData, scammersData] = await Promise.all([
        safeMerchApi.getStatistics(),
        safeMerchApi.getAllReportsAdmin(),
        safeMerchApi.getScammers(),
      ])
      setStats(statsData)
      setReports(reportsData)
      setScammers(scammersData)
    } catch (err) {
      console.error('Error loading admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus(reportId, newStatus, newRiskLevel) {
    try {
      await safeMerchApi.updateReportStatus(reportId, newStatus, newRiskLevel)
      setFeedback({ type: 'success', text: `Status laporan diubah ke ${newStatus}.` })
      await loadData()
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Gagal memperbarui status: ' + err.message })
    }
  }

  async function handleDeleteReport(reportId) {
    try {
      await safeMerchApi.deleteReport(reportId)
      setFeedback({ type: 'success', text: 'Laporan berhasil dihapus.' })
      await loadData()
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Gagal menghapus laporan.' })
    }
  }

  async function handleUpdateScammerRisk(scammerId, newRiskLevel) {
    try {
      await safeMerchApi.updateScammer(scammerId, { risk_level: newRiskLevel })
      setFeedback({ type: 'success', text: `Tingkat risiko scammer diperbarui menjadi ${newRiskLevel}.` })
      await loadData()
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Gagal memperbarui risiko.' })
    }
  }

  const filteredReports =
    reportsFilter === 'ALL'
      ? reports
      : reports.filter((r) => r.status === reportsFilter)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel Admin</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Verifikasi laporan penipuan masuk dan kelola basis data scammer.
        </p>
      </div>

      {feedback && <Alert type={feedback.type} message={feedback.text} />}

      {/* Simple Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Menunggu Verifikasi</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingReports}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Laporan Terverifikasi</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.approvedReports}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total Rekening Terdata</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalScammers}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total Kerugian</span>
          <p className="text-xl font-bold text-rose-600 mt-1">{formatRupiah(stats.totalLoss)}</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Moderasi Laporan ({stats.pendingReports} pending)
        </button>

        <button
          onClick={() => setActiveTab('scammers')}
          className={`px-4 py-2.5 border-b-2 transition ${
            activeTab === 'scammers'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daftar Scammer ({scammers.length})
        </button>
      </div>

      {/* Tab 1: Moderasi Laporan */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'pending', label: 'Menunggu Verifikasi' },
              { id: 'pending_deletion', label: 'Pengajuan Hapus' },
              { id: 'approved', label: 'Disetujui' },
              { id: 'rejected', label: 'Ditolak' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setReportsFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  reportsFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Target Penipu</th>
                  <th className="p-3">Bank & Rekening</th>
                  <th className="p-3">Kerugian</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 block">
                          {report.scammer?.target_name}
                        </span>
                        {report.scammer?.platform && (
                          <span className="text-[10px] text-slate-400">
                            {report.scammer.platform}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {report.scammer?.bank_name} - {report.scammer?.account_number}
                      </td>
                      <td className="p-3 font-bold text-rose-600">
                        {formatRupiah(report.loss_amount)}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReviewReport(report)}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs cursor-pointer"
                          >
                            Tinjau
                          </button>
                          <button
                            onClick={() => setEditingReport(report)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title="Edit data laporan (perlu ditinjau ulang setelah diedit)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      Tidak ada laporan dalam kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Daftar Scammer */}
      {activeTab === 'scammers' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="p-3">Nama Akun/Target</th>
                <th className="p-3">Bank</th>
                <th className="p-3">Nomor Rekening</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Tingkat Risiko</th>
                <th className="p-3 text-right">Profil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scammers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{s.target_name}</td>
                  <td className="p-3">{s.bank_name}</td>
                  <td className="p-3 font-mono">{s.account_number}</td>
                  <td className="p-3">{s.platform}</td>
                  <td className="p-3">
                    <select
                      value={s.risk_level}
                      onChange={(e) => handleUpdateScammerRisk(s.id, e.target.value)}
                      className="p-1 rounded border border-slate-200 text-xs font-medium"
                    >
                      <option value="HIGH">HIGH (Bahaya)</option>
                      <option value="MEDIUM">MEDIUM (Waspada)</option>
                      <option value="LOW">LOW (Rendah)</option>
                      <option value="CLEARED">CLEARED (Selesai)</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/scammer/${s.id}`}
                      className="text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Lihat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedReviewReport && (
        <ReportReviewModal
          report={selectedReviewReport}
          isOpen={Boolean(selectedReviewReport)}
          onClose={() => setSelectedReviewReport(null)}
          onUpdateStatus={handleUpdateStatus}
          onDeleteReport={handleDeleteReport}
          onEditReport={(rep) => setEditingReport(rep)}
        />
      )}

      {/* Edit Report Modal */}
      {editingReport && (
        <EditReportModal
          report={editingReport}
          isOpen={Boolean(editingReport)}
          isAdmin={true}
          onClose={() => setEditingReport(null)}
          onSuccess={(msg) => {
            setFeedback({ type: 'success', text: msg })
            loadData()
          }}
        />
      )}
    </div>
  )
}
