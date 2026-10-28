import React, { useState, useEffect } from 'react'
import { safeMerchApi } from '../../../lib/supabase'
import { StatusBadge, RiskBadge, PlatformBadge } from '../../../components/common/Badge'
import { ReportReviewModal } from '../components/ReportReviewModal'
import { formatRupiah, formatDateTime, formatDate } from '../../../lib/utils'
import { Alert } from '../../../components/common/Alert'
import { Link } from 'react-router-dom'
import { Check, Copy, ExternalLink, Edit3, Trash2 } from 'lucide-react'

export function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalScammers: 0,
    totalReports: 0,
    approvedReports: 0,
    pendingReports: 0,
    totalLoss: 0,
  })
  const [activeTab, setActiveTab] = useState('reports') // 'reports' | 'scammers' | 'schema'
  const [reportsFilter, setReportsFilter] = useState('ALL')
  const [reports, setReports] = useState([])
  const [scammers, setScammers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReviewReport, setSelectedReviewReport] = useState(null)
  const [copiedSql, setCopiedSql] = useState(false)
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

  const copySqlSchema = () => {
    const sql = `-- SafeMerch Core Database Schema (PostgreSQL)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scammers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  social_handle TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('Twitter', 'Shopee', 'Tokopedia', 'Instagram')),
  risk_level TEXT NOT NULL DEFAULT 'HIGH' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CLEARED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scammer_id UUID NOT NULL REFERENCES public.scammers(id) ON DELETE CASCADE,
  chronology TEXT NOT NULL,
  loss_amount NUMERIC NOT NULL CHECK (loss_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
    navigator.clipboard.writeText(sql)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

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

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2.5 border-b-2 transition ${
            activeTab === 'schema'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Skema SQL Supabase
        </button>
      </div>

      {/* Tab 1: Moderasi Laporan */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setReportsFilter(f)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  reportsFilter === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'ALL' ? 'Semua' : f}
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
                        <button
                          onClick={() => setSelectedReviewReport(report)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs"
                        >
                          Tinjau
                        </button>
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

      {/* Tab 3: Skema SQL Supabase */}
      {activeTab === 'schema' && (
        <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Skema SQL Supabase (4 Tabel Utama & RLS)
              </h3>
              <p className="text-xs text-slate-500">
                Salin dan jalankan di SQL Editor Supabase untuk inisialisasi basis data.
              </p>
            </div>
            <button
              onClick={copySqlSchema}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium text-xs flex items-center gap-1.5"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Tersalin' : 'Salin SQL'}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto space-y-1">
            <p>-- Tabel: profiles, scammers, reports, report_evidences</p>
            <p>-- File lengkap: supabase/schema.sql & supabase/seed.sql</p>
          </div>
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
        />
      )}
    </div>
  )
}
