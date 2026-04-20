import { request } from '@/lib/api-client'
import type { Article, ArticleQueueEntry, PaginatedResponse } from '@/types'

export const articlesService = {
  fetchArticles: (
    params: { limit: number; offset: number; status?: string }
  ): Promise<PaginatedResponse<Article>> => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ) as Record<string, string>
    )

    return request(`/articles?${qs}`)
  },

  // fetchArticleQueue: (
  //   limit = 20
  // ): Promise<{ data: ArticleQueueEntry[]; total: number }> =>
  //   request(`/articles?status=pending&limit=${limit}&offset=0`),
  fetchArticleQueue: async (limit = 20) => {
  const res: any = await request(
    `/articles?status=pending&limit=${limit}&offset=0`
  )
  let data, total

  if (Array.isArray(res)) {
    data = res
    total = res.length
  } else if (Array.isArray(res.data)) {
    data = res.data
    total = res.total
  } else if (res.data?.data) {
    data = res.data.data
    total = res.data.total
  }

  return {
    total,
    data: data.map((item: any, index: number) => ({
      position: index + 1,
      articleId: item.article_id,
      queuedAt: item.created_at,
    })),
  }
}
}