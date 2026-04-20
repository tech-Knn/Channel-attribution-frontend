'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { TableWrap, Table } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { SkeletonRows } from '@/components/ui/skeleton'
import { useArticles, useArticleQueue } from '@/hooks/useArticles'
import { timeAgo, duration, shortDate } from '@/lib/formatters'
import type { Article, ArticleQueueEntry } from '@/types'

const LIMIT = 20

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Queued' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
]

export default function ArticlesPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useArticles({
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
    status: status || undefined,
  })

  const { data: queue } = useArticleQueue(20)

  // ---------------------------
  // TABLE: Articles
  // ---------------------------
  const articleCols = [
    {
      key: 'id',
      label: 'ID',
      render: (a: Article) => (
        <span className="font-mono text-xs text-zinc-500">{a.id}</span>
      ),
    },
    {
      key: 'AticleId',
      label: 'Article Id',
      render: (a: Article) => (
        <span className="text-sm text-zinc-200">{a.article_id}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (a: Article) => <Badge status={a.status} />,
    },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      render: () =>
          <span className="font-mono text-xs text-zinc-400">
          </span>
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (a: Article) => (
        <span className="text-xs text-zinc-400">
          {timeAgo(a.created_at)}
        </span>
      ),
    },
    {
      key: 'updated_at',
      label: 'Updated',
      render: (a: Article) => (
        <span className="text-xs text-zinc-500">
        </span>
      ),
    },
  ]

  // ---------------------------
  // TABLE: Queue
  // ---------------------------
  const queueCols = [
    {
      key: 'position',
      label: 'Position',
      render: (q: ArticleQueueEntry) => (
        <span className="tabular-nums text-zinc-400">
          #{q.position}
        </span>
      ),
    },
    {
      key: 'articleId',
      label: 'Article ID',
      render: (q: ArticleQueueEntry) => (
        <span className="font-mono text-xs text-zinc-300">
          {q.articleId}
        </span>
      ),
    },
    {
      key: 'queuedAt',
      label: 'Queued At',
      render: (q: ArticleQueueEntry) => (
        <span className="text-xs text-zinc-400">
          {shortDate(q.queuedAt)}
        </span>
      ),
    },
    {
      key: 'duration',
      label: 'Waiting',
      render: (q: ArticleQueueEntry) => (
        <span className="tabular-nums text-amber-400/80">
          {duration(q.queuedAt)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <Header
        title="Articles"
        subtitle={`${data?.total ?? '—'} total articles`}
      />

      <div className="space-y-6 p-6">
        {/* --------------------------- */}
        {/* ALL ARTICLES */}
        {/* --------------------------- */}
        <TableWrap
          title="All Articless"
          action={
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-md border border-white/[0.1] bg-[#111] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500/60"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          }
        >
          {isLoading ? (
            <table className="w-full">
              <tbody>
                <SkeletonRows cols={6} />
              </tbody>
            </table>
          ) : (
            <>
              <Table
                columns={articleCols}
                data={data?.data ?? []}
                emptyMessage="No articles found"
              />

              {data && (
                <Pagination
                  page={page}
                  totalPages={Math.ceil(data.total / LIMIT)}
                  total={data.total}
                  limit={LIMIT}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </TableWrap>

        {/* --------------------------- */}
        {/* QUEUE */}
        {/* --------------------------- */}
        <TableWrap
          title={`Article Queue${queue ? ` — ${queue.total} waiting` : ''}`}
        >
          {!queue ? (
            <table className="w-full">
              <tbody>
                <SkeletonRows cols={4} rows={4} />
              </tbody>
            </table>
          ) : (
            <Table
              columns={queueCols}
              data={queue.data}
              emptyMessage="No articles in queue"
            />
          )}
        </TableWrap>
      </div>
    </div>
  )
}