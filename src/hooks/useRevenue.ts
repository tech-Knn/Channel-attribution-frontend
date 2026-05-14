import useSWR from 'swr'
import { revenueService, type SortParams, type PaginationParams } from '@/services/revenue.service'

export function useRevenueSummary(
  range?: { from: string; to: string },
  refreshInterval = 60_000,
) {
  return useSWR(
    range ? ['revenue-summary', range] : 'revenue-summary',
    () => revenueService.fetchSummary(range),
    { refreshInterval },
  )
}

export function useRevenueByArticle(params: SortParams, enabled = true) {
  return useSWR(
    enabled ? ['rev-art', params] : null,
    () => revenueService.fetchByArticle(params),
    { refreshInterval: 60_000 },
  )
}

export function useRevenueByChannel(params: SortParams, enabled = true) {
  return useSWR(
    enabled ? ['rev-ch', params] : null,
    () => revenueService.fetchByChannel(params),
    { refreshInterval: 60_000 },
  )
}

export function useUnattributedRevenue(params: PaginationParams, enabled = true) {
  return useSWR(
    enabled ? ['rev-unattr', params] : null,
    () => revenueService.fetchUnattributed(params),
    { refreshInterval: 60_000 },
  )
}