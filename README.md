# SafeMerch 🛡️
> **Platform Resmi Pemantauan, Investigasi & Basis Data Penipuan Transaksi Merchandise Indonesia**  
> *Sistem Intelijen Siber & Verifikasi Rekening Penipu Terintegrasi AI*

---

## 📌 Ringkasan Platform (Overview)

**SafeMerch** adalah platform resmi intelijen siber yang dirancang untuk memantau, mendeteksi, dan memverifikasi kasus penipuan jual-beli merchandise pop-culture di Indonesia (seperti *photocard* K-Pop, *action figure / scale figure* anime pre-order, *lightstick*, merchandise konser, dan pakaian koleksi). 

Platform ini mengintegrasikan **AI Social Intelligence Radar** yang secara otonom memantau platform **Twitter/X**, serta basis data nomor rekening & akun penipu di **Instagram**, **Shopee**, dan **Tokopedia**.

---

## ⚡ Fitur Utama & Inovasi: AI Radar Twitter/X Otonom

SafeMerch dilengkapi dengan **AI Threat Ingestion Engine** di halaman `/radar`:
1. **Autonomous Social Stream**: Memantau tagar dan percakapan peringatan penipuan di Twitter/X secara real-time (`#PenipuanKpop`, `#WTS_Scam`, `#BlacklistSeller`, dll).
2. **NLP Entity Extraction**: Model kecerdasan buatan mengekstrak entitas penting secara otomatis dari bahasa gaul/slang media sosial:
   - Nama target / pemilik rekening
   - Bank atau nama *e-wallet* (BCA, Mandiri, BRI, BNI, DANA, ShopeePay, GoPay)
   - Nomor rekening / nomor e-wallet
   - Akun media sosial pelaku
   - Estimasi kerugian korban
   - *AI Confidence Score* (tingkat keyakinan deteksi)
3. **One-Click Ingestion**: Mengintegrasikan temuan ancaman Twitter ke dalam basis data publik tanpa memerlukan korban mengisi formulir manual dari awal.
4. **Interactive Text & Tweet Analyzer**: Petugas maupun masyarakat dapat menempelkan teks atau tautan utas keluhan untuk langsung dianalisis dan diekstraksi oleh AI.

---

## 🚀 Tech Stack

- **Frontend**: React 19 (`react`, `react-dom`), Vite
- **Routing**: React Router DOM (`v6+`)
- **Styling**: Tailwind CSS (`v4`), Modern Clean Architecture
- **Forms & Data Validation**: React Hook Form (`react-hook-form`) + Zod Schema Validation (`@hookform/resolvers/zod`, `zod`)
- **Social Intelligence & AI Engine**: Autonomous Pattern Recognition & NLP Entity Extraction
- **Icons**: Lucide React (`lucide-react`)
- **Backend & Database**: 
  - Supabase JS Client (`@supabase/supabase-js`)
  - Supabase Auth (Email & Password, Session management)
  - PostgreSQL Database
  - PostgreSQL Row Level Security (RLS) & Security Definer Functions

---

## 🗄️ Arsitektur Data & Skema Database (PostgreSQL)

Database dirancang dengan **4 tabel inti**:

### 1. `profiles` (Extends `auth.users` 1:1)
Menyimpan profil pengguna dan peran hak akses (*role*).
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. `scammers` (Direktori Utama Penipu)
Basis data rekening bank / *e-wallet* terverifikasi yang dapat diakses publik.
```sql
CREATE TABLE public.scammers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    social_handle TEXT,
    platform TEXT NOT NULL CHECK (platform IN ('Twitter', 'Shopee', 'Tokopedia', 'Instagram')),
    risk_level TEXT NOT NULL DEFAULT 'HIGH' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CLEARED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3. `reports` (Laporan Insiden Penipuan N:1 ke Profiles dan Scammers)
Menyimpan riwayat laporan, nominal kerugian, dan kronologi kejadian dari korban atau hasil AI radar.
```sql
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scammer_id UUID NOT NULL REFERENCES public.scammers(id) ON DELETE CASCADE,
    chronology TEXT NOT NULL,
    loss_amount NUMERIC NOT NULL CHECK (loss_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4. `report_evidences` (Bukti Tangkapan Layar N:1 ke Reports)
Menyimpan URL tangkapan layar bukti transfer m-Banking, struk ATM, atau riwayat pesan/blokir.
```sql
CREATE TABLE public.report_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🔒 Kebijakan Row Level Security (RLS)

1. **RLS Diaktifkan di Keempat Tabel**:
   - `profiles`, `scammers`, `reports`, `report_evidences`.
2. **Security Definer Function `is_admin()`**:
   Mencegah *infinite recursion* saat query RLS mengecek role admin di tabel `profiles`.
3. **Public Read Access**:
   - Publik dapat mencari dan melihat data `scammers`.
   - Publik hanya dapat melihat `reports` dan `report_evidences` yang berstatus `approved`.
4. **User Permissions**:
   - Pengguna terdaftar dapat mengirim laporan baru (`reporter_id = auth.uid()`).
   - Pengguna dapat melihat seluruh status laporannya sendiri (`pending`, `approved`, `rejected`).
   - Pengguna dapat membatalkan laporan miliknya yang masih berstatus `pending`.
5. **Admin Permissions**:
   - Akun administrator (`profiles.role = 'admin'`) memiliki hak akses penuh (**SELECT, INSERT, UPDATE, DELETE**) untuk memoderasi laporan, menyesuaikan tingkat risiko, atau memvalidasi temuan radar.

---

## 💻 Panduan Instalasi & Menjalankan Platform

```bash
cd safemerch
npm install
npm run dev
```
Akses platform di peramban: `http://localhost:5173`.

---

## 🔑 Akun Kredensial Administrator

Gunakan akun resmi berikut pada portal **Masuk** (`/login`):

- **Email**: `admin@safemerch.id`
- **Kata Sandi**: `SafeMerchAdmin2026!`
- **Peran**: `admin` (Akses Penuh Panel Kontrol Administrator di `/admin`)
