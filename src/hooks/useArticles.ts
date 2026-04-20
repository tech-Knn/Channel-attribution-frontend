import useSWR from 'swr'
import { articlesService } from '@/services/articles.service'

// -----------------------------
// Articles list
// -----------------------------
export function useArticles(params: {
  limit: number
  offset: number
  status?: string
}) {
  return useSWR(
    ['articles', params],
    () => articlesService.fetchArticles(params),
    { refreshInterval: 30_000 },
  )
}

// -----------------------------
// Article Queue
// -----------------------------
export function useArticleQueue(limit = 20) {
  return useSWR(
    ['article-queue', limit],
    () => articlesService.fetchArticleQueue(limit),
    { refreshInterval: 30_000 },
  )
}