import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { HomePage } from '../features/home/pages/HomePage'
import { SearchPage } from '../features/search/pages/SearchPage'
import { ScammerDetailPage } from '../features/search/pages/ScammerDetailPage'
import { CreateReportPage } from '../features/reports/pages/CreateReportPage'
import { MyReportsPage } from '../features/reports/pages/MyReportsPage'
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ProtectedRoute } from '../components/common/ProtectedRoute'
import { ShieldAlert } from 'lucide-react'

function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto my-20 p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">404 - Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-slate-500">Halaman yang Anda cari tidak tersedia.</p>
      <Link
        to="/"
        className="inline-block px-4 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/scammer/:id" element={<ScammerDetailPage />} />
      <Route path="/reports/create" element={<CreateReportPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User Dashboard */}
      <Route
        path="/my-reports"
        element={
          <ProtectedRoute>
            <MyReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
