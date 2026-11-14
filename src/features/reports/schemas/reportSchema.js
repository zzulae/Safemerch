import { z } from 'zod'

export const reportSchema = z.object({
  // Scammer Information
  target_name: z
    .string()
    .min(2, 'Nama pemilik rekening / target minimal 2 karakter')
    .max(120, 'Nama terlalu panjang'),
  bank_name: z
    .string()
    .min(1, 'Pilih atau masukkan nama Bank / E-Wallet'),
  account_number: z
    .string()
    .min(5, 'Nomor rekening / e-wallet minimal 5 digit')
    .max(35, 'Nomor rekening terlalu panjang')
    .regex(/^[0-9A-Za-z\-_.]+$/, 'Format nomor rekening tidak valid'),
  social_handle: z
    .string()
    .max(100, 'Username / nama toko maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  platform: z.enum(['Twitter', 'Shopee', 'Tokopedia', 'Instagram'], {
    errorMap: () => ({ message: 'Pilih salah satu platform transaksi' }),
  }),

  // Incident Details
  loss_amount: z
    .coerce
    .number({ invalid_type_error: 'Nominal kerugian harus berupa angka' })
    .min(1000, 'Nominal kerugian minimal Rp 1.000')
    .max(1000000000, 'Nominal kerugian melebihi batas sistem'),
  chronology: z
    .string()
    .min(25, 'Kronologi penipuan harus dijelaskan minimal 25 karakter agar dapat diverifikasi tim moderator')
    .max(3000, 'Kronologi maksimal 3000 karakter'),

  // Link directly to victim's post/thread (optional)
  post_url: z
    .string()
    .url('Format URL tautan postingan tidak valid (harus diawali http:// atau https://)')
    .optional()
    .or(z.literal('')),

  // Evidence Photos (Direct photo upload, no URL required)
  evidences: z
    .array(
      z.object({
        id: z.string().optional(),
        image_url: z.string().min(1, 'Foto bukti tidak boleh kosong'),
        caption: z.string().max(200, 'Keterangan bukti maksimal 200 karakter').optional(),
        file_name: z.string().optional(),
        file_size: z.number().optional(),
      })
    )
    .min(1, 'Wajib melampirkan minimal 1 bukti foto transfer atau percakapan'),
})

export const INDONESIAN_BANKS = [
  'BCA (Bank Central Asia)',
  'Mandiri',
  'BNI (Bank Negara Indonesia)',
  'BRI (Bank Rakyat Indonesia)',
  'BSI (Bank Syariah Indonesia)',
  'CIMB Niaga',
  'Bank Permata',
  'Bank Danamon',
  'Bank Jago',
  'SeaBank',
  'Blu by BCA Digital',
  'DANA (E-Wallet)',
  'OVO (E-Wallet)',
  'GoPay (E-Wallet)',
  'ShopeePay (E-Wallet)',
  'LinkAja (E-Wallet)',
  'Lainnya',
]
