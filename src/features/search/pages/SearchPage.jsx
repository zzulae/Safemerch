import React, { useState, useEffect } from 'react'
import { safeMerchApi } from '../../../lib/supabase'
import { ScammerCard } from '../components/ScammerCard'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, RotateCcw, Plus, AlertCircle, ShieldCheck } from 'lucide-react'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialPlatform = searchParams.get('platform') || 'ALL'

  const [query, setQuery] = useState(initialQuery)
  const [platform, setPlatform] = useState(initialPlatform)
  const [bankName, setBankName] = useState('ALL')
  const [scammers, setScammers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScammers()
  }, [platform, bankName])

  async function loadScammers(customQuery = query) {
    setLoading(true)
    try {
      const data = await safeMerchApi.getScammers({
        query: customQuery,
        platform,
        bankName,
      })
      setScammers(data)
    } catch (err) {
      console.error('Error loading scammers:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    setSearchParams({ q: query, platform })
    loadScammers(query)
  }

  function handleReset() {
    setQuery('')
    setPlatform('ALL')
    setBankName('ALL')
    setSearchParams({})
    loadScammers('')
  }

  const platforms = [
    { id: 'ALL', label: 'Semua Platform' },
    { id: 'Twitter', label: 'Twitter / X' },
    { id: 'Shopee', label: 'Shopee' },
    { id: 'Tokopedia', label: 'Tokopedia' },
    { id: 'Instagram', label: 'Instagram' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Cari Rekening Penipu
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Periksa nomor rekening bank atau e-wallet sebelum melakukan transaksi.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              loadScammers(e.target.value)
            }}
            placeholder="Cari nomor rekening, nama pemilik, atau username..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                platform === p.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
          >
            <option value="ALL">Semua Bank / E-Wallet</option>
            <option value="BCA">BCA</option>
            <option value="Mandiri">Mandiri</option>
            <option value="BNI">BNI</option>
            <option value="BRI">BRI</option>
            <option value="DANA">DANA</option>
            <option value="ShopeePay">ShopeePay</option>
            <option value="GoPay">GoPay</option>
          </select>

          {(query || platform !== 'ALL' || bankName !== 'ALL') && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition"
              title="Reset filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <span className="text-xs font-semibold text-slate-500">
          Ditemukan {scammers.length} rekening
        </span>
        <Link
          to="/reports/create"
          className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Laporkan Rekening Baru
        </Link>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Mencari data...
        </div>
      ) : scammers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scammers.map((scammer) => (
            <ScammerCard key={scammer.id} scammer={scammer} />
          ))}
        </div>
      ) : (
        <div className="p-8 border border-slate-200 rounded-xl text-center space-y-3 bg-white">
          <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Rekening Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nomor rekening ini belum terdata di SafeMerch. Tetap berhati-hati saat bertransaksi.
            </p>
          </div>
          <Link
            to={`/reports/create?account=${encodeURIComponent(query)}`}
            className="inline-block px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
          >
            Laporkan Rekening Ini
          </Link>
        </div>
      )}
    </div>
  )
}
