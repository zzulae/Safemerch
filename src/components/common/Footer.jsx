import React from 'react'
import { Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-rose-600 text-white flex items-center justify-center font-bold">
            <Shield className="w-3 h-3" />
          </div>
          <span className="font-bold text-slate-900">SafeMerch</span>
          <span className="text-slate-400">|</span>
          <span>Basis Data & Pelaporan Penipuan Merchandise</span>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <Link to="/" className="hover:text-slate-900 transition">
            Beranda
          </Link>
          <Link to="/search" className="hover:text-slate-900 transition">
            Cari Rekening
          </Link>
          <Link to="/reports/create" className="hover:text-slate-900 transition">
            Laporkan Penipu
          </Link>
          <Link to="/login" className="hover:text-slate-900 transition">
            Masuk
          </Link>
        </div>
      </div>
    </footer>
  )
}
