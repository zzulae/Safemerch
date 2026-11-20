import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { RiskBadge, PlatformBadge } from '../../../components/common/Badge'
import { formatRupiah, formatDate } from '../../../lib/utils'
import { CreditCard, ExternalLink, Copy, Check, AlertCircle, FileText } from 'lucide-react'

export function ScammerCard({ scammer }) {
  const [copied, setCopied] = useState(false)

  const copyAccount = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(scammer.account_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate loss and count from reports if available
  const approvedReports = (scammer.reports || []).filter((r) => r.status === 'approved')
  const totalLoss =
    scammer.total_loss !== undefined
      ? scammer.total_loss
      : approvedReports.reduce((sum, r) => sum + Number(r.loss_amount || 0), 0)
  const reportCount =
    scammer.approved_reports_count !== undefined
      ? scammer.approved_reports_count
      : approvedReports.length

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 hover:border-rose-300 shadow-xs hover:shadow-lg transition-all p-3 sm:p-5 flex flex-col justify-between group relative overflow-hidden">
      {/* Top accent line based on risk */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 sm:h-1 ${
          scammer.risk_level === 'HIGH'
            ? 'bg-rose-500'
            : scammer.risk_level === 'MEDIUM'
            ? 'bg-amber-500'
            : scammer.risk_level === 'CLEARED'
            ? 'bg-emerald-500'
            : 'bg-blue-500'
        }`}
      />

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <PlatformBadge platform={scammer.platform} />
          <RiskBadge riskLevel={scammer.risk_level} />
        </div>

        {/* Target Name */}
        <h3 className="text-sm sm:text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors leading-tight">
          {scammer.target_name}
        </h3>

        {/* Social Handle */}
        {scammer.social_handle && (
          <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
            {scammer.social_handle}
          </p>
        )}

        {/* Bank & Account Number */}
        <div className="mt-2 p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[11px] font-bold uppercase text-slate-400 leading-none">
                {scammer.bank_name}
              </p>
              <p className="text-[11px] sm:text-sm font-mono font-bold text-slate-900 tracking-wide mt-0.5 truncate">
                {scammer.account_number}
              </p>
            </div>
          </div>
          <button
            onClick={copyAccount}
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors shrink-0"
            title="Salin Nomor Rekening"
          >
            {copied ? <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>

      {/* Footer Metrics & Detail Link */}
      <div className="mt-2 sm:mt-5 pt-2 sm:pt-4 border-t border-slate-100 flex items-center justify-between gap-1">
        <div>
          <span className="text-[9px] sm:text-[11px] text-slate-400 block font-medium">Total Kerugian</span>
          <span className="text-[11px] sm:text-sm font-extrabold text-rose-600">
            {totalLoss > 0 ? formatRupiah(totalLoss) : 'Verifikasi'}
          </span>
        </div>

        <Link
          to={`/scammer/${scammer.id}`}
          className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900 text-white text-[9px] sm:text-xs font-bold hover:bg-rose-600 transition-colors"
        >
          <span>Detail ({reportCount})</span>
          <ExternalLink className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
        </Link>
      </div>
    </div>
  )
}
