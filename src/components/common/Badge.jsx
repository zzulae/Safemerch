import React from 'react'
import { getPlatformBadge, getRiskLevelBadge, getReportStatusBadge } from '../../lib/utils'
import { AlertTriangle, CheckCircle, ShieldAlert, Clock, XCircle } from 'lucide-react'

export function RiskBadge({ riskLevel, showIcon = true, size = 'md' }) {
  const badge = getRiskLevelBadge(riskLevel)
  const isLg = size === 'lg'
  const isSm = size === 'sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${badge.bg} ${
        isLg ? 'px-3.5 py-1 text-sm' : isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
      {showIcon && riskLevel === 'HIGH' && <AlertTriangle className="w-3.5 h-3.5" />}
      {showIcon && riskLevel === 'CLEARED' && <CheckCircle className="w-3.5 h-3.5" />}
      <span>{badge.short}</span>
    </span>
  )
}

export function PlatformBadge({ platform }) {
  const badge = getPlatformBadge(platform)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
      {badge.label}
    </span>
  )
}

export function StatusBadge({ status }) {
  const badge = getReportStatusBadge(status)
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
      {status === 'approved' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
      {status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
      {status === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
      {badge.text}
    </span>
  )
}
