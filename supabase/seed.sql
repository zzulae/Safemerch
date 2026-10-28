-- ==============================================================================
-- SafeMerch - Seed Data for Fraud Intelligence & Verified Reports
-- ==============================================================================

-- 1. Insert Sample Scammers
INSERT INTO public.scammers (id, target_name, bank_name, account_number, social_handle, platform, risk_level, created_at)
VALUES 
  (
    'a1111111-1111-1111-1111-111111111111',
    'Rizky Maulana',
    'BCA',
    '8270918231',
    '@kpopmerch_jkt',
    'Twitter',
    'HIGH',
    NOW() - INTERVAL '14 days'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Amanda Putri Anggraini',
    'Mandiri',
    '1370019283741',
    'AnimeVault.Store',
    'Shopee',
    'HIGH',
    NOW() - INTERVAL '20 days'
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'Hendra Wijaya',
    'BNI',
    '0845928172',
    '@jastipmerch_official',
    'Instagram',
    'HIGH',
    NOW() - INTERVAL '7 days'
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'Gilang Ramadhan Pratama',
    'DANA',
    '081298765432',
    '@wts_nctcards',
    'Twitter',
    'MEDIUM',
    NOW() - INTERVAL '5 days'
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    'Dimas Kurniawan',
    'ShopeePay',
    '085712349988',
    'VintageTee_Official',
    'Tokopedia',
    'MEDIUM',
    NOW() - INTERVAL '3 days'
  ),
  (
    'a6666666-6666-6666-6666-666666666666',
    'Siti Nurhaliza',
    'BRI',
    '012938475619283',
    '@genshin_merch_id',
    'Instagram',
    'CLEARED',
    NOW() - INTERVAL '30 days'
  )
ON CONFLICT (account_number) DO NOTHING;

-- 2. Profiles
INSERT INTO public.profiles (id, full_name, role, created_at)
VALUES
  (
    'b1111111-1111-1111-1111-111111111111',
    'Administrator Resmi SafeMerch',
    'admin',
    NOW() - INTERVAL '60 days'
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'Ahmad Zaki Fauzan',
    'user',
    NOW() - INTERVAL '40 days'
  ),
  (
    'b3333333-3333-3333-3333-333333333333',
    'Clarissa Putri',
    'user',
    NOW() - INTERVAL '25 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Sample Reports
INSERT INTO public.reports (id, reporter_id, scammer_id, chronology, loss_amount, status, created_at)
VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Pelaku menawarkan WTS Photocard SEVENTEEN Mingyu Special Yearbook via Twitter @kpopmerch_jkt. Setelah transfer uang muka sebesar Rp 850.000 ke rekening BCA atas nama Rizky Maulana, akun Twitter langsung memblokir akun saya dan menghapus postingan jualannya.',
    850000,
    'approved',
    NOW() - INTERVAL '12 days'
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'b3333333-3333-3333-3333-333333333333',
    'a2222222-2222-2222-2222-222222222222',
    'Order Pre-Order Scale Figure Jujutsu Kaisen Gojo Satoru 1/7 di toko Shopee AnimeVault.Store. Seller meminta transaksi langsung transfer bank luar aplikasi dengan dalih diskon potongan ongkos kirim. Setelah ditransfer Rp 2.450.000 ke Bank Mandiri Amanda Putri, nomor WhatsApp tidak aktif dan pesanan fiktif.',
    2450000,
    'approved',
    NOW() - INTERVAL '18 days'
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'b2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'Jasa titip merchandise konser Coldplay di Singapura melalui akun Instagram @jastipmerch_official. Dijanjikan kaos exclusive official dan tumblr. Uang ditransfer senilai Rp 3.800.000 ke BNI Hendra Wijaya. Sampai tanggal konser selesai tidak ada resi dan akun berganti username.',
    3800000,
    'approved',
    NOW() - INTERVAL '6 days'
  ),
  (
    'c4444444-4444-4444-4444-444444444444',
    'b3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'Beli photocard NCT Dream Jaemin via DANA. Setelah transfer Rp 450.000 nomor e-wallet Gilang Ramadhan, nomor WhatsApp hanya membaca chat dan tidak mengirimkan nomor resi kurir.',
    450000,
    'pending',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Report Evidences
INSERT INTO public.report_evidences (id, report_id, image_url, caption, created_at)
VALUES
  (
    'd1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
    'Bukti mutasi transfer m-Banking BCA Rp 850.000',
    NOW() - INTERVAL '12 days'
  ),
  (
    'd2222222-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&q=80&w=800',
    'Tangkapan layar chat Twitter DM sebelum akun pelaku di-deactivate',
    NOW() - INTERVAL '12 days'
  ),
  (
    'd3333333-3333-3333-3333-333333333333',
    'c2222222-2222-2222-2222-222222222222',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    'Bukti invoice fiktif Mandiri Livin Rp 2.450.000',
    NOW() - INTERVAL '18 days'
  ),
  (
    'd4444444-4444-4444-4444-444444444444',
    'c3333333-3333-3333-3333-333333333333',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800',
    'Bukti slip transfer BNI dan percakapan DM Instagram',
    NOW() - INTERVAL '6 days'
  )
ON CONFLICT (id) DO NOTHING;
