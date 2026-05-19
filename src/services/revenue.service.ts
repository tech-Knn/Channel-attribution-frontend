import { request } from '@/lib/api-client'
import type {
  RevenueSummary,
  RevenueByArticle,
  RevenueByChannel,
  UnattributedRevenue,
  AssignmentRevenue,
  PaginatedResponse,
} from '@/types'

export interface SortParams {
  limit: number
  offset: number
  sortBy: string
  sortDir: 'ASC' | 'DESC'
  from?: string
  to?: string
}

export interface PaginationParams {
  limit: number
  offset: number
  from?: string
  to?: string
}

export interface AssignmentRevenueParams extends SortParams {
  channelId?: string
  articleId?: string
  status?: 'active' | 'expired' | 'completed'
  hideZero?: boolean
}

function buildQuery(params: Record<string, unknown>): string {
  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = String(v)
  }
  return new URLSearchParams(clean).toString()
}

export const revenueService = {
  fetchSummary: async (range?: { from: string; to: string }): Promise<RevenueSummary> => {
    const qs = range ? `?${buildQuery(range as unknown as Record<string, unknown>)}` : ''
    const res = await request<{ data: RevenueSummary }>(`/revenue/summary${qs}`)
    return res.data
  },

  fetchByArticle: (params: SortParams): Promise<PaginatedResponse<RevenueByArticle>> => {
    return request(`/revenue/by-article?${buildQuery(params as unknown as Record<string, unknown>)}`)
  },

  fetchByChannel: (params: SortParams): Promise<PaginatedResponse<RevenueByChannel>> => {
    return request(`/revenue/by-channel?${buildQuery(params as unknown as Record<string, unknown>)}`)
  },

  fetchUnattributed: (params: PaginationParams): Promise<PaginatedResponse<UnattributedRevenue>> => {
    return request(`/revenue/unattributed?${buildQuery(params as unknown as Record<string, unknown>)}`)
  },

  fetchByAssignment: (params: AssignmentRevenueParams): Promise<PaginatedResponse<AssignmentRevenue>> => {
    return request(`/revenue/by-assignment?${buildQuery(params as unknown as Record<string, unknown>)}`)
  },
}
