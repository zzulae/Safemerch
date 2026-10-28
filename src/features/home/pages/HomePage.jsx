import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { safeMerchApi } from '../../../lib/supabase'
import { ScammerCard } from '../../search/components/ScammerCard'
import { formatRupiah } from '../../../lib/utils'
import { Search, Plus, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react'

export function HomePage() {
  const [query, setQuery] = useState('')
  const [stats, setStats] = useState({
    totalScammers: 0,
    totalReports: 0,
    approvedReports: 0,
    totalLoss: 0,
  })
  const [recentScammers, setRecentScammers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, scammersData] = await Promise.all([
          safeMerchApi.getStatistics(),
          safeMerchApi.getScammers(),
        ])
        setStats(statsData)
        setRecentScammers(scammersData.slice(0, 4))
      } catch (err) {
        console.error('Error loading home data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    } else {
      navigate('/search')
    }
  }

  return (
    <div className="space-y-12 py-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* 1. Hero Search Section */}
      <section className="text-center py-10 sm:py-14 space-y-5">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Periksa Rekening Sebelum Bertransaksi
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Cek nomor rekening bank atau e-wallet penjual merchandise, photocard, dan jastip
          untuk menghindari penipuan online.
        </p>

        {/* Clean Search Bar */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-6">
          <div className="relative flex items-center shadow-xs">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masukkan nomor rekening, nama pemilik, atau username..."
              className="w-full pl-11 pr-28 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition"
            >
              Cari Rekening
            </button>
          </div>
        </form>

        {/* Quick Tag Pills */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
          <span>Contoh:</span>
          {['8270918231', 'Amanda Putri', 'Mandiri', 'Twitter'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag)
                navigate(`/search?q=${encodeURIComponent(tag)}`)
              }}
              className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Simple Numbers Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-200 py-6 text-center">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Rekening Terdata
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stats.totalScammers}
          </p>
        </div>
        <div className="border-t sm:border-t-0 sm:border-x border-slate-200 pt-4 sm:pt-0">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Total Kerugian Terverifikasi
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {formatRupiah(stats.totalLoss)}
          </p>
        </div>
        <div className="border-t sm:border-t-0 border-slate-200 pt-4 sm:pt-0">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Laporan Valid
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {stats.approvedReports}
          </p>
        </div>
      </section>

      {/* 3. Recent Scammers List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Rekening Penipuan Terkini
          </h2>
          <Link
            to="/search"
            className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
          >
            Lihat Semua ({stats.totalScammers}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Memuat data...
          </div>
        ) : recentScammers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentScammers.map((scammer) => (
              <ScammerCard key={scammer.id} scammer={scammer} />
            ))}
          </div>
        ) : (
          <div className="p-8 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            Belum ada rekening penipu terdata.
          </div>
        )}
      </section>

      {/* 4. Simple Report CTA */}
      <section className="p-6 sm:p-8 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Pernah Menjadi Korban Penipuan?</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporkan nomor rekening penipu untuk membantu melindungi pembeli lainnya.
          </p>
        </div>
        <Link
          to="/reports/create"
          className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shrink-0 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Laporan Baru</span>
        </Link>
      </section>
    </div>
  )
}
