/**
 * SafeMerch Data & Persistence Layer
 * Menyimpan data resmi scammers, laporan insiden, dan profil pengguna.
 */

export const INITIAL_PROFILES = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    full_name: 'Administrator Resmi SafeMerch',
    email: 'admin@safemerch.id',
    role: 'admin',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    full_name: 'Ahmad Zaki Fauzan',
    email: 'ahmad.zaki@safemerch.id',
    role: 'user',
    created_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    full_name: 'Clarissa Putri',
    email: 'clarissa.putri@safemerch.id',
    role: 'user',
    created_at: '2026-10-01T08:30:00Z',
  },
]

export const INITIAL_SCAMMERS = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    target_name: 'Rizky Maulana',
    bank_name: 'BCA',
    account_number: '8270918231',
    social_handle: '@kpopmerch_jkt',
    platform: 'Twitter',
    risk_level: 'HIGH',
    created_at: '2026-10-14T09:15:00Z',
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    target_name: 'Amanda Putri Anggraini',
    bank_name: 'Mandiri',
    account_number: '1370019283741',
    social_handle: 'AnimeVault.Store',
    platform: 'Shopee',
    risk_level: 'HIGH',
    created_at: '2026-10-08T14:20:00Z',
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    target_name: 'Hendra Wijaya',
    bank_name: 'BNI',
    account_number: '0845928172',
    social_handle: '@jastipmerch_official',
    platform: 'Instagram',
    risk_level: 'HIGH',
    created_at: '2026-10-21T11:45:00Z',
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    target_name: 'Gilang Ramadhan Pratama',
    bank_name: 'DANA',
    account_number: '081298765432',
    social_handle: '@wts_nctcards',
    platform: 'Twitter',
    risk_level: 'MEDIUM',
    created_at: '2026-10-23T16:10:00Z',
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    target_name: 'Dimas Kurniawan',
    bank_name: 'ShopeePay',
    account_number: '085712349988',
    social_handle: 'VintageTee_Official',
    platform: 'Tokopedia',
    risk_level: 'MEDIUM',
    created_at: '2026-10-25T13:00:00Z',
  },
  {
    id: 'a6666666-6666-6666-6666-666666666666',
    target_name: 'Siti Nurhaliza',
    bank_name: 'BRI',
    account_number: '012938475619283',
    social_handle: '@genshin_merch_id',
    platform: 'Instagram',
    risk_level: 'CLEARED',
    created_at: '2026-09-28T10:00:00Z',
  },
]

export const INITIAL_REPORTS = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    reporter_id: 'b2222222-2222-2222-2222-222222222222',
    scammer_id: 'a1111111-1111-1111-1111-111111111111',
    chronology:
      'Pelaku menawarkan WTS Photocard SEVENTEEN Mingyu Special Yearbook via Twitter @kpopmerch_jkt. Setelah transfer uang muka sebesar Rp 850.000 ke rekening BCA atas nama Rizky Maulana, akun Twitter langsung memblokir akun saya dan menghapus postingan jualannya.',
    loss_amount: 850000,
    status: 'approved',
    created_at: '2026-10-16T10:30:00Z',
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    reporter_id: 'b3333333-3333-3333-3333-333333333333',
    scammer_id: 'a2222222-2222-2222-2222-222222222222',
    chronology:
      'Order Pre-Order Scale Figure Jujutsu Kaisen Gojo Satoru 1/7 di toko Shopee AnimeVault.Store. Seller meminta transaksi langsung transfer bank luar aplikasi dengan dalih diskon potongan ongkos kirim. Setelah ditransfer Rp 2.450.000 ke Bank Mandiri Amanda Putri, nomor WhatsApp tidak aktif dan pesanan fiktif.',
    loss_amount: 2450000,
    status: 'approved',
    created_at: '2026-10-10T15:45:00Z',
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    reporter_id: 'b2222222-2222-2222-2222-222222222222',
    scammer_id: 'a3333333-3333-3333-3333-333333333333',
    chronology:
      'Jasa titip merchandise konser Coldplay di Singapura melalui akun Instagram @jastipmerch_official. Dijanjikan kaos exclusive official dan tumblr. Uang ditransfer senilai Rp 3.800.000 ke BNI Hendra Wijaya. Sampai tanggal konser selesai tidak ada resi dan akun berganti username.',
    loss_amount: 3800000,
    status: 'approved',
    created_at: '2026-10-22T08:15:00Z',
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    reporter_id: 'b3333333-3333-3333-3333-333333333333',
    scammer_id: 'a4444444-4444-4444-4444-444444444444',
    chronology:
      'Beli photocard NCT Dream Jaemin via DANA. Setelah transfer Rp 450.000 nomor e-wallet Gilang Ramadhan, nomor WhatsApp hanya membaca chat dan tidak mengirimkan nomor resi kurir.',
    loss_amount: 450000,
    status: 'pending',
    created_at: '2026-10-27T17:20:00Z',
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    reporter_id: 'b2222222-2222-2222-2222-222222222222',
    scammer_id: 'a5555555-5555-5555-5555-555555555555',
    chronology:
      'Membeli kaos vintage rock band di Tokopedia tetapi penjual meminta pembayaran DP via ShopeePay. Setelah ditransfer Rp 1.150.000 tidak ada pengiriman.',
    loss_amount: 1150000,
    status: 'pending',
    created_at: '2026-10-28T09:00:00Z',
  },
]

export const INITIAL_EVIDENCES = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    report_id: 'c1111111-1111-1111-1111-111111111111',
    image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
    caption: 'Bukti transfer m-Banking BCA Rp 850.000 ke Rizky Maulana',
    created_at: '2026-10-16T10:31:00Z',
  },
  {
    id: 'd2222222-2222-2222-2222-222222222222',
    report_id: 'c1111111-1111-1111-1111-111111111111',
    image_url: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&q=80&w=800',
    caption: 'Screenshot direct message Twitter dan tanda pemblokiran akun',
    created_at: '2026-10-16T10:32:00Z',
  },
  {
    id: 'd3333333-3333-3333-3333-333333333333',
    report_id: 'c2222222-2222-2222-2222-222222222222',
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    caption: 'Bukti invoice fiktif Mandiri Livin Rp 2.450.000',
    created_at: '2026-10-10T15:46:00Z',
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    report_id: 'c3333333-3333-3333-3333-333333333333',
    image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800',
    caption: 'Slip transfer Bank BNI dan bukti percakapan DM Instagram',
    created_at: '2026-10-22T08:16:00Z',
  },
  {
    id: 'd5555555-5555-5555-5555-555555555555',
    report_id: 'c4444444-4444-4444-4444-444444444444',
    image_url: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&q=80&w=800',
    caption: 'Bukti transfer DANA ke nomor 081298765432',
    created_at: '2026-10-27T17:21:00Z',
  },
]

// LocalStorage Persistence Keys
const STORAGE_KEYS = {
  SCAMMERS: 'safemerch_scammers_prod_v2',
  REPORTS: 'safemerch_reports_prod_v2',
  EVIDENCES: 'safemerch_evidences_prod_v2',
  PROFILES: 'safemerch_profiles_prod_v2',
  CURRENT_USER: 'safemerch_session_prod_v2',
}

export function getStoredScammers() {
  const data = localStorage.getItem(STORAGE_KEYS.SCAMMERS)
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.SCAMMERS, JSON.stringify(INITIAL_SCAMMERS))
    return INITIAL_SCAMMERS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_SCAMMERS
  }
}

export function saveStoredScammers(scammers) {
  localStorage.setItem(STORAGE_KEYS.SCAMMERS, JSON.stringify(scammers))
}

export function getStoredReports() {
  const data = localStorage.getItem(STORAGE_KEYS.REPORTS)
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS))
    return INITIAL_REPORTS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_REPORTS
  }
}

export function saveStoredReports(reports) {
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports))
}

export function getStoredEvidences() {
  const data = localStorage.getItem(STORAGE_KEYS.EVIDENCES)
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.EVIDENCES, JSON.stringify(INITIAL_EVIDENCES))
    return INITIAL_EVIDENCES
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_EVIDENCES
  }
}

export function saveStoredEvidences(evidences) {
  localStorage.setItem(STORAGE_KEYS.EVIDENCES, JSON.stringify(evidences))
}

export function getStoredProfiles() {
  const data = localStorage.getItem(STORAGE_KEYS.PROFILES)
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES))
    return INITIAL_PROFILES
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_PROFILES
  }
}

export function saveStoredProfiles(profiles) {
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles))
}

export function getStoredSession() {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function saveStoredSession(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
  }
}
