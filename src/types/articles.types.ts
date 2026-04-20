export interface Article {
  id: string
  title: string
  status: 'queued' | 'assigned' | 'processing' | 'completed'
  assigned_to: string | null
  created_at: string
  updated_at: string
}

/**
 * Queue entry (same pattern as IdleQueueEntry)
 */
export interface ArticleQueueEntry {
  position: number
  articleId: string
  queuedAt: string
  waitDurationMs: number
}

/**
 * Optional: If you plan to track delays / SLA loss like channels
 */
export interface ArticleQueueDelay {
  article_id: string
  queued_at: string
  wait_time: string
  estimated_delay_cost: string
}