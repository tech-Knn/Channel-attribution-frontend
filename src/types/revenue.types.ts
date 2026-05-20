export interface RevenueSummary {
  // Legacy (no date filter)
  revenue_today?: string
  impressions_today?: number
  clicks_today?: number
  revenue_7d?: string
  impressions_7d?: number
  clicks_7d?: number
  revenue_30d?: string
  impressions_30d?: number
  clicks_30d?: number

  // Date-filtered response
  revenue_range?: string
  impressions_range?: number
  clicks_range?: number
  last_pulled_at?: string | null
  range?: { from: string; to: string }
}

export interface RevenueByArticle {
  db_id: string
  article_id: string
  url: string | null
  category: string | null
  published_at: string
  // ── current state ──
  article_status: string
  reactivated_at: string | null       // populated when the article has been through a reactivation cycle
  current_channel_id: string | null   // channel currently serving this article (null = no active assignment)
  current_revenue: string             // revenue earned by the current assignment only
  current_impressions: string
  current_clicks: string
  // ── lifetime totals across all assignments ──
  channels_used: string
  total_impressions: string
  total_clicks: string
  total_revenue: string
  rpm: string
  last_pulled_at: string | null
  last_period_end: string | null
}

export interface RevenueByChannel {
  db_id: string
  channel_id: string
  // ── current state ──
  channel_status: string
  current_article_id: string | null   // article currently assigned to this channel (null = idle)
  current_revenue: string             // revenue earned by the current assignment only
  current_impressions: string
  current_clicks: string
  // ── lifetime totals across all articles that ever ran on this channel ──
  articles_served: string
  total_impressions: string
  total_clicks: string
  total_revenue: string
  last_pulled_at: string | null
  last_period_end: string | null
}

export interface UnattributedRevenue {
  id: string
  channel_id: string
  revenue: string
  impressions: number
  period_start: string
  period_end: string
  pulled_at: string
}

// One row per channel-article assignment lifecycle, from v_assignment_revenue.
// Drives the "Timeline" tab on the Revenue page — see /api/revenue/by-assignment.
export interface AssignmentRevenue {
  assignment_id: string
  channel_id: string
  article_id: string
  assigned_at: string
  unassigned_at: string | null
  assignment_status: 'active' | 'expired' | 'completed'
  impressions: number
  clicks: number
  revenue: string
}
