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
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-rose-300 shadow-xs hover:shadow-lg transition-all p-5 flex flex-col justify-between group relative overflow-hidden">
      {/* Top accent line based on risk */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
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
        <div className="flex items-center justify-between gap-2 mb-3">
          <PlatformBadge platform={scammer.platform} />
          <RiskBadge riskLevel={scammer.risk_level} />
        </div>

        {/* Target Name */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors flex items-center gap-1.5">
          {scammer.target_name}
        </h3>

        {/* Social Handle */}
        {scammer.social_handle && (
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            {scammer.social_handle}
          </p>
        )}

        {/* Bank & Account Number */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-2xs">
              <CreditCard className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400 leading-none">
                {scammer.bank_name}
              </p>
              <p className="text-sm font-mono font-bold text-slate-900 tracking-wide mt-0.5">
                {scammer.account_number}
              </p>
            </div>
          </div>
          <button
            onClick={copyAccount}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            title="Salin Nomor Rekening"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Footer Metrics & Detail Link */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Total Kerugian</span>
          <span className="text-sm font-extrabold text-rose-600">
            {totalLoss > 0 ? formatRupiah(totalLoss) : 'Dalam Verifikasi'}
          </span>
        </div>

        <Link
          to={`/scammer/${scammer.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-rose-600 transition-colors shadow-2xs"
        >
          <span>Detail ({reportCount} Lap)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
