/**
 * SafeMerch Formatting and Utility Helpers
 */

/**
 * Format number to Indonesian Rupiah currency string (e.g. Rp 1.500.000)
 * @param {number|string} amount 
 * @returns {string}
 */
export function formatRupiah(amount) {
  const numeric = Number(amount) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numeric)
}

/**
 * Format ISO date string into readable Indonesian format
 * @param {string|Date} dateString 
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Format ISO date with time
 * @param {string|Date} dateString 
 * @returns {string}
 */
export function formatDateTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Platform badge style mapping
 */
export function getPlatformBadge(platform) {
  switch (platform?.toLowerCase()) {
    case 'twitter':
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
        label: 'Twitter / X',
      }
    case 'shopee':
      return {
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: 'bg-orange-500',
        label: 'Shopee',
      }
    case 'tokopedia':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Tokopedia',
      }
    case 'instagram':
      return {
        bg: 'bg-pink-50 text-pink-700 border-pink-200',
        dot: 'bg-pink-500',
        label: 'Instagram',
      }
    default:
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
        label: platform || 'Other',
      }
  }
}

/**
 * Risk Level styles and badge mapping
 */
export function getRiskLevelBadge(riskLevel) {
  switch (riskLevel?.toUpperCase()) {
    case 'HIGH':
      return {
        bg: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
        text: 'Sangat Berbahaya (HIGH)',
        short: 'HIGH',
        color: 'text-red-600',
      }
    case 'MEDIUM':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        text: 'Waspada (MEDIUM)',
        short: 'MEDIUM',
        color: 'text-amber-600',
      }
    case 'LOW':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        text: 'Risiko Rendah (LOW)',
        short: 'LOW',
        color: 'text-blue-600',
      }
    case 'CLEARED':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        text: 'Terselesaikan (CLEARED)',
        short: 'CLEARED',
        color: 'text-emerald-600',
      }
    default:
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
        text: riskLevel || 'UNKNOWN',
        short: riskLevel || 'UNKNOWN',
        color: 'text-slate-600',
      }
  }
}

/**
 * Report Status styles
 */
export function getReportStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        text: 'Terverifikasi (Approved)',
      }
    case 'rejected':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        text: 'Ditolak (Rejected)',
      }
    case 'pending':
    default:
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        text: 'Menunggu Verifikasi (Pending)',
      }
  }
}
