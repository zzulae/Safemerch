-- ==============================================================================
-- SafeMerch - Official Scammer Intelligence & Incident Database Platform
-- Database Schema & Row Level Security (RLS) Specification
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop existing tables if rebuilding (in correct reverse dependency order)
-- DROP TABLE IF EXISTS public.report_evidences CASCADE;
-- DROP TABLE IF EXISTS public.reports CASCADE;
-- DROP TABLE IF EXISTS public.scammers CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- 2.1 PROFILES TABLE (Extends auth.users 1:1)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Stores user profile metadata extending Supabase auth.users';
COMMENT ON COLUMN public.profiles.role IS 'User permission level: standard user or moderator/admin';

-- 2.2 SCAMMERS TABLE (Main Scammer Database)
CREATE TABLE IF NOT EXISTS public.scammers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    social_handle TEXT,
    platform TEXT NOT NULL CHECK (platform IN ('Twitter', 'Shopee', 'Tokopedia', 'Instagram')),
    risk_level TEXT NOT NULL DEFAULT 'HIGH' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CLEARED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.scammers IS 'Directory of verified or reported fraudster accounts';
COMMENT ON COLUMN public.scammers.account_number IS 'Unique bank account or digital e-wallet number';
COMMENT ON COLUMN public.scammers.risk_level IS 'Severity rating based on verified reports count and losses';

-- 2.3 REPORTS TABLE (Incident Reports N:1 to profiles and scammers)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scammer_id UUID NOT NULL REFERENCES public.scammers(id) ON DELETE CASCADE,
    chronology TEXT NOT NULL,
    loss_amount NUMERIC NOT NULL CHECK (loss_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reports IS 'Incident reports submitted by victims or whistleblowers';
COMMENT ON COLUMN public.reports.status IS 'Review status: pending (under review), approved (verified), rejected';

-- 2.4 REPORT_EVIDENCES TABLE (Evidence Images N:1 to reports)
CREATE TABLE IF NOT EXISTS public.report_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.report_evidences IS 'Screenshots of chat history, transfer receipts, and proof';

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_scammers_account_number ON public.scammers(account_number);
CREATE INDEX IF NOT EXISTS idx_scammers_platform ON public.scammers(platform);
CREATE INDEX IF NOT EXISTS idx_scammers_target_name ON public.scammers(target_name);
CREATE INDEX IF NOT EXISTS idx_reports_scammer_id ON public.reports(scammer_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_evidences_report_id ON public.report_evidences(report_id);

-- ==============================================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================

-- Prevents recursive policy checks when inspecting admin privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Automatically inserts a record into public.profiles upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna SafeMerch'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scammers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidences ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5.1 PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Public can view full_name of reporters (necessary to render reporter names on approved reports)
CREATE POLICY "Public read profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Authenticated users can update their own profile details
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins have full access across profiles
CREATE POLICY "Admins full access on profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5.2 SCAMMERS POLICIES
-- ------------------------------------------------------------------------------
-- Public read access for scammers table (search and lookup)
CREATE POLICY "Public read access for scammers"
  ON public.scammers FOR SELECT
  USING (true);

-- Authenticated users can insert new scammers when filing an incident
CREATE POLICY "Authenticated users can insert scammers"
  ON public.scammers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Admin users have FULL access (SELECT, INSERT, UPDATE, DELETE) on scammers
CREATE POLICY "Admins full access on scammers"
  ON public.scammers FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5.3 REPORTS POLICIES
-- ------------------------------------------------------------------------------
-- Public can view approved reports
CREATE POLICY "Public read access for approved reports"
  ON public.reports FOR SELECT
  USING (status = 'approved');

-- Authenticated users can view their own reports (pending, rejected, approved)
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Authenticated users can insert reports where reporter_id is themselves
CREATE POLICY "Authenticated users can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can update or withdraw their own pending reports
CREATE POLICY "Users can update own pending reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = reporter_id AND status = 'pending')
  WITH CHECK (auth.uid() = reporter_id);

-- Admins have FULL access on reports (view all, update status to approved/rejected, delete)
CREATE POLICY "Admins full access on reports"
  ON public.reports FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5.4 REPORT_EVIDENCES POLICIES
-- ------------------------------------------------------------------------------
-- Public read access for evidences tied to approved reports
CREATE POLICY "Public read access for approved report evidences"
  ON public.report_evidences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_evidences.report_id
        AND reports.status = 'approved'
    )
  );

-- Users can read evidences belonging to their own reports
CREATE POLICY "Users can view own report evidences"
  ON public.report_evidences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_evidences.report_id
        AND reports.reporter_id = auth.uid()
    )
  );

-- Authenticated users can insert evidences for their own reports
CREATE POLICY "Users can insert evidences for own reports"
  ON public.report_evidences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_evidences.report_id
        AND reports.reporter_id = auth.uid()
    )
  );

-- Admins have FULL access on report evidences
CREATE POLICY "Admins full access on report evidences"
  ON public.report_evidences FOR ALL
  USING (public.is_admin());
