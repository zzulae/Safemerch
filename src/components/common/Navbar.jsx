import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Search, Plus, FileText, LayoutDashboard, LogOut, LogIn, Menu, X } from 'lucide-react'

export function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-rose-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
    }`

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Safe<span className="text-rose-600">Merch</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={linkClass}>
            Beranda
          </NavLink>
          <NavLink to="/search" className={linkClass}>
            Cari Rekening
          </NavLink>
          <NavLink to="/reports/create" className={linkClass}>
            Laporkan Penipu
          </NavLink>
          {user && (
            <NavLink to="/my-reports" className={linkClass}>
              Laporan Saya
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Panel Admin
            </NavLink>
          )}
        </nav>

        {/* Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">
                <span className="font-semibold text-slate-900">{profile?.full_name || user.email}</span>
                {isAdmin && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-medium text-slate-700">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 rounded-lg transition"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-600 md:hidden"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block text-sm font-medium text-slate-700"
          >
            Beranda
          </Link>
          <Link
            to="/search"
            onClick={() => setIsOpen(false)}
            className="block text-sm font-medium text-slate-700"
          >
            Cari Rekening
          </Link>
          <Link
            to="/reports/create"
            onClick={() => setIsOpen(false)}
            className="block text-sm font-medium text-slate-700"
          >
            Laporkan Penipu
          </Link>
          {user && (
            <Link
              to="/my-reports"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-medium text-slate-700"
            >
              Laporan Saya
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-medium text-slate-700 font-semibold text-rose-600"
            >
              Panel Admin
            </Link>
          )}
          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <button
                onClick={() => {
                  handleLogout()
                  setIsOpen(false)
                }}
                className="w-full text-left text-sm font-medium text-rose-600"
              >
                Keluar
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold border rounded-lg"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
