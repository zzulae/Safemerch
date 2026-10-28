import { createClient } from '@supabase/supabase-js'
import {
  getStoredScammers,
  saveStoredScammers,
  getStoredReports,
  saveStoredReports,
  getStoredEvidences,
  saveStoredEvidences,
  getStoredProfiles,
  saveStoredProfiles,
} from './mockData'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if credentials exist and are not placeholder values
export const isSupabaseConfigured = Boolean(
  envUrl &&
    envKey &&
    envUrl.startsWith('https://') &&
    !envUrl.includes('your-project-id') &&
    envKey !== 'your-anon-key-here'
)

// Supabase client instance (mock or real)
export const supabase = isSupabaseConfigured
  ? createClient(envUrl, envKey)
  : createClient('https://mock-instance.supabase.co', 'mock-anon-key-placeholder', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

/**
 * High-level Data Service for SafeMerch
 * Bridges Supabase PostgreSQL queries and offline local evaluation store seamlessly.
 */
export const safeMerchApi = {
  /**
   * Fetch all scammers with optional filters
   */
  async getScammers({ query = '', platform = 'ALL', riskLevel = 'ALL', bankName = 'ALL' } = {}) {
    if (isSupabaseConfigured) {
      try {
        let req = supabase
          .from('scammers')
          .select('*, reports(id, loss_amount, status)')
          .order('created_at', { ascending: false })

        if (platform && platform !== 'ALL') req = req.eq('platform', platform)
        if (riskLevel && riskLevel !== 'ALL') req = req.eq('risk_level', riskLevel)
        if (bankName && bankName !== 'ALL') req = req.ilike('bank_name', `%${bankName}%`)

        const { data, error } = await req
        if (error) throw error

        let filtered = data || []
        if (query.trim()) {
          const q = query.toLowerCase().trim()
          filtered = filtered.filter(
            (s) =>
              s.target_name?.toLowerCase().includes(q) ||
              s.account_number?.toLowerCase().includes(q) ||
              s.social_handle?.toLowerCase().includes(q) ||
              s.bank_name?.toLowerCase().includes(q)
          )
        }
        return filtered
      } catch (err) {
        console.warn('Supabase query failed, falling back to local store:', err)
      }
    }

    // Local / Offline fallback
    let list = getStoredScammers()
    const reports = getStoredReports()

    // Attach reports summary
    list = list.map((scammer) => {
      const scammerReports = reports.filter((r) => r.scammer_id === scammer.id)
      return {
        ...scammer,
        reports: scammerReports,
        total_loss: scammerReports
          .filter((r) => r.status === 'approved')
          .reduce((sum, r) => sum + Number(r.loss_amount || 0), 0),
        approved_reports_count: scammerReports.filter((r) => r.status === 'approved').length,
      }
    })

    if (platform && platform !== 'ALL') {
      list = list.filter((s) => s.platform.toLowerCase() === platform.toLowerCase())
    }
    if (riskLevel && riskLevel !== 'ALL') {
      list = list.filter((s) => s.risk_level.toUpperCase() === riskLevel.toUpperCase())
    }
    if (bankName && bankName !== 'ALL') {
      list = list.filter((s) => s.bank_name.toLowerCase().includes(bankName.toLowerCase()))
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      list = list.filter(
        (s) =>
          s.target_name.toLowerCase().includes(q) ||
          s.account_number.toLowerCase().includes(q) ||
          (s.social_handle && s.social_handle.toLowerCase().includes(q)) ||
          s.bank_name.toLowerCase().includes(q)
      )
    }

    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  /**
   * Get single scammer detail with verified reports and evidences
   */
  async getScammerById(scammerId) {
    if (isSupabaseConfigured) {
      try {
        const { data: scammer, error: scammerErr } = await supabase
          .from('scammers')
          .select('*')
          .eq('id', scammerId)
          .single()

        if (scammerErr) throw scammerErr

        const { data: reports, error: reportsErr } = await supabase
          .from('reports')
          .select('*, profiles(full_name), report_evidences(*)')
          .eq('scammer_id', scammerId)
          .order('created_at', { ascending: false })

        if (reportsErr) throw reportsErr

        return {
          ...scammer,
          reports: reports || [],
        }
      } catch (err) {
        console.warn('Supabase getScammerById error:', err)
      }
    }

    const scammers = getStoredScammers()
    const reports = getStoredReports()
    const evidences = getStoredEvidences()
    const profiles = getStoredProfiles()

    const scammer = scammers.find((s) => s.id === scammerId)
    if (!scammer) return null

    const scammerReports = reports
      .filter((r) => r.scammer_id === scammerId)
      .map((r) => {
        const reporter = profiles.find((p) => p.id === r.reporter_id)
        const reportEvidences = evidences.filter((e) => e.report_id === r.id)
        return {
          ...r,
          reporter_name: reporter ? reporter.full_name : 'Pengguna Terverifikasi',
          profiles: reporter ? { full_name: reporter.full_name } : null,
          report_evidences: reportEvidences,
        }
      })

    return {
      ...scammer,
      reports: scammerReports,
    }
  },

  /**
   * Look up scammer by exact account number
   */
  async findScammerByAccount(accountNumber) {
    const cleanAccount = accountNumber.replace(/\s+/g, '').trim()
    if (!cleanAccount) return null

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('scammers')
          .select('*')
          .eq('account_number', cleanAccount)
          .maybeSingle()
        if (error) throw error
        return data
      } catch (err) {
        console.warn('Supabase findScammerByAccount error:', err)
      }
    }

    const scammers = getStoredScammers()
    return scammers.find((s) => s.account_number.replace(/\s+/g, '') === cleanAccount) || null
  },

  /**
   * Create a new Report and link or create Scammer
   */
  async createReport({ scammerData, reportData, evidenceData, reporterId }) {
    if (isSupabaseConfigured) {
      try {
        // 1. Check if scammer exists or insert
        let scammerId = null
        const { data: existingScammer } = await supabase
          .from('scammers')
          .select('id')
          .eq('account_number', scammerData.account_number.trim())
          .maybeSingle()

        if (existingScammer) {
          scammerId = existingScammer.id
        } else {
          const { data: newScammer, error: scError } = await supabase
            .from('scammers')
            .insert({
              target_name: scammerData.target_name.trim(),
              bank_name: scammerData.bank_name.trim(),
              account_number: scammerData.account_number.trim(),
              social_handle: scammerData.social_handle?.trim() || null,
              platform: scammerData.platform,
              risk_level: 'HIGH',
            })
            .select()
            .single()
          if (scError) throw scError
          scammerId = newScammer.id
        }

        // 2. Insert report
        const { data: newReport, error: repError } = await supabase
          .from('reports')
          .insert({
            reporter_id: reporterId,
            scammer_id: scammerId,
            chronology: reportData.chronology.trim(),
            loss_amount: Number(reportData.loss_amount),
            status: 'pending',
          })
          .select()
          .single()

        if (repError) throw repError

        // 3. Insert evidences if any
        if (evidenceData && evidenceData.length > 0) {
          const evidencePayload = evidenceData.map((ev) => ({
            report_id: newReport.id,
            image_url: ev.image_url,
            caption: ev.caption || 'Bukti pendukung',
          }))
          const { error: evError } = await supabase
            .from('report_evidences')
            .insert(evidencePayload)
          if (evError) console.error('Evidence insert warning:', evError)
        }

        return { success: true, reportId: newReport.id, scammerId }
      } catch (err) {
        console.warn('Supabase createReport error:', err)
        throw err
      }
    }

    // Local / Offline fallback
    const scammers = getStoredScammers()
    const reports = getStoredReports()
    const evidences = getStoredEvidences()

    let scammer = scammers.find(
      (s) => s.account_number.replace(/\s+/g, '') === scammerData.account_number.replace(/\s+/g, '')
    )

    if (!scammer) {
      scammer = {
        id: 'scammer-' + Date.now(),
        target_name: scammerData.target_name.trim(),
        bank_name: scammerData.bank_name.trim(),
        account_number: scammerData.account_number.trim(),
        social_handle: scammerData.social_handle?.trim() || null,
        platform: scammerData.platform,
        risk_level: 'HIGH',
        created_at: new Date().toISOString(),
      }
      scammers.unshift(scammer)
      saveStoredScammers(scammers)
    }

    const reportId = 'rep-' + Date.now()
    const newReport = {
      id: reportId,
      reporter_id: reporterId,
      scammer_id: scammer.id,
      chronology: reportData.chronology.trim(),
      loss_amount: Number(reportData.loss_amount),
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    reports.unshift(newReport)
    saveStoredReports(reports)

    if (evidenceData && evidenceData.length > 0) {
      evidenceData.forEach((ev, idx) => {
        evidences.push({
          id: `ev-${Date.now()}-${idx}`,
          report_id: reportId,
          image_url: ev.image_url,
          caption: ev.caption || 'Bukti pendukung',
          created_at: new Date().toISOString(),
        })
      })
      saveStoredEvidences(evidences)
    }

    return { success: true, reportId, scammerId: scammer.id }
  },

  /**
   * Fetch user's own reports
   */
  async getUserReports(userId) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*, scammer:scammers(*), report_evidences(*)')
          .eq('reporter_id', userId)
          .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
      } catch (err) {
        console.warn('Supabase getUserReports error:', err)
      }
    }

    const reports = getStoredReports()
    const scammers = getStoredScammers()
    const evidences = getStoredEvidences()

    return reports
      .filter((r) => r.reporter_id === userId)
      .map((r) => {
        const scammer = scammers.find((s) => s.id === r.scammer_id)
        const repEvidences = evidences.filter((e) => e.report_id === r.id)
        return {
          ...r,
          scammer,
          report_evidences: repEvidences,
        }
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  /**
   * Admin: Get all reports with full reporter and scammer info
   */
  async getAllReportsAdmin({ status = 'ALL' } = {}) {
    if (isSupabaseConfigured) {
      try {
        let req = supabase
          .from('reports')
          .select('*, scammer:scammers(*), reporter:profiles(*), report_evidences(*)')
          .order('created_at', { ascending: false })

        if (status && status !== 'ALL') {
          req = req.eq('status', status)
        }

        const { data, error } = await req
        if (error) throw error
        return data || []
      } catch (err) {
        console.warn('Supabase getAllReportsAdmin error:', err)
      }
    }

    const reports = getStoredReports()
    const scammers = getStoredScammers()
    const profiles = getStoredProfiles()
    const evidences = getStoredEvidences()

    let result = reports.map((r) => {
      const scammer = scammers.find((s) => s.id === r.scammer_id)
      const reporter = profiles.find((p) => p.id === r.reporter_id)
      const repEvidences = evidences.filter((e) => e.report_id === r.id)
      return {
        ...r,
        scammer,
        reporter,
        report_evidences: repEvidences,
      }
    })

    if (status && status !== 'ALL') {
      result = result.filter((r) => r.status === status)
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  /**
   * Admin: Update report status (approved, rejected, pending)
   */
  async updateReportStatus(reportId, newStatus, newRiskLevel = null) {
    if (isSupabaseConfigured) {
      try {
        const { error: repError } = await supabase
          .from('reports')
          .update({ status: newStatus })
          .eq('id', reportId)
        if (repError) throw repError

        if (newRiskLevel) {
          // get scammer_id
          const { data: rep } = await supabase
            .from('reports')
            .select('scammer_id')
            .eq('id', reportId)
            .single()
          if (rep?.scammer_id) {
            await supabase
              .from('scammers')
              .update({ risk_level: newRiskLevel })
              .eq('id', rep.scammer_id)
          }
        }
        return { success: true }
      } catch (err) {
        console.warn('Supabase updateReportStatus error:', err)
        throw err
      }
    }

    const reports = getStoredReports()
    const reportIndex = reports.findIndex((r) => r.id === reportId)
    if (reportIndex === -1) throw new Error('Laporan tidak ditemukan')

    reports[reportIndex].status = newStatus
    saveStoredReports(reports)

    if (newRiskLevel) {
      const scammers = getStoredScammers()
      const scammerIndex = scammers.findIndex((s) => s.id === reports[reportIndex].scammer_id)
      if (scammerIndex !== -1) {
        scammers[scammerIndex].risk_level = newRiskLevel
        saveStoredScammers(scammers)
      }
    }

    return { success: true }
  },

  /**
   * Admin: Update Scammer details
   */
  async updateScammer(scammerId, updates) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('scammers')
          .update(updates)
          .eq('id', scammerId)
        if (error) throw error
        return { success: true }
      } catch (err) {
        console.warn('Supabase updateScammer error:', err)
        throw err
      }
    }

    const scammers = getStoredScammers()
    const idx = scammers.findIndex((s) => s.id === scammerId)
    if (idx === -1) throw new Error('Scammer tidak ditemukan')
    scammers[idx] = { ...scammers[idx], ...updates }
    saveStoredScammers(scammers)
    return { success: true }
  },

  /**
   * Admin: Delete Report
   */
  async deleteReport(reportId) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', reportId)
        if (error) throw error
        return { success: true }
      } catch (err) {
        console.warn('Supabase deleteReport error:', err)
        throw err
      }
    }

    let reports = getStoredReports()
    reports = reports.filter((r) => r.id !== reportId)
    saveStoredReports(reports)
    return { success: true }
  },

  /**
   * Analytics & Transparency Statistics
   */
  async getStatistics() {
    if (isSupabaseConfigured) {
      try {
        const { count: scammerCount } = await supabase
          .from('scammers')
          .select('*', { count: 'exact', head: true })

        const { count: approvedReportsCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')

        const { count: pendingReportsCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        const { data: approvedReports } = await supabase
          .from('reports')
          .select('loss_amount')
          .eq('status', 'approved')

        const totalLoss = (approvedReports || []).reduce(
          (sum, r) => sum + Number(r.loss_amount || 0),
          0
        )

        return {
          totalScammers: scammerCount || 0,
          totalReports: (approvedReportsCount || 0) + (pendingReportsCount || 0),
          approvedReports: approvedReportsCount || 0,
          pendingReports: pendingReportsCount || 0,
          totalLoss,
        }
      } catch (err) {
        console.warn('Supabase getStatistics error:', err)
      }
    }

    const scammers = getStoredScammers()
    const reports = getStoredReports()

    const approvedReports = reports.filter((r) => r.status === 'approved')
    const pendingReports = reports.filter((r) => r.status === 'pending')
    const totalLoss = approvedReports.reduce((sum, r) => sum + Number(r.loss_amount || 0), 0)

    return {
      totalScammers: scammers.length,
      totalReports: reports.length,
      approvedReports: approvedReports.length,
      pendingReports: pendingReports.length,
      totalLoss,
    }
  },
}
