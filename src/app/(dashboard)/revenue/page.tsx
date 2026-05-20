'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { TableWrap, Table } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { SkeletonRows } from '@/components/ui/skeleton'
import { DateRangeFilter } from '@/components/ui/date-range-filter'
import {
  useRevenueByArticle,
  useRevenueByChannel,
  useUnattributedRevenue,
  useRevenueByAssignment,
} from '@/hooks/useRevenue'
import { currency, number, shortDate, timeAgo } from '@/lib/formatters'
import { type DatePreset, presetToRange } from '@/lib/date-presets'
import type {
  RevenueByArticle,
  RevenueByChannel,
  UnattributedRevenue,
  AssignmentRevenue,
} from '@/types'

const LIMIT = 20

type Tab = 'timeline' | 'article' | 'channel' | 'unattributed'

export default function RevenuePage() {
  // Timeline tab is the default — it's the most informative view (one row per
  // channel-article-window with revenue) and answers the "which assignment
  // earned what during which window" question directly. The other tabs are
  // rollup summaries kept for drill-up.
  const [tab, setTab] = useState<Tab>('timeline')

  // Date filter state — default to "Today"
  const [preset, setPreset] = useState<DatePreset>('today')
  const [range, setRange] = useState(() => presetToRange('today'))

  // "Hide zero-revenue rows" toggle — applies to all tabs except Unattributed.
  // Defaults to true to keep the dashboard scannable; users can flip it off
  // to see every row (expired articles with no revenue, idle channels, etc.).
  const [hideZero, setHideZero] = useState(true)

  // ── Timeline tab state ────────────────────────────────────────────────
  const [tlPage, setTlPage] = useState(1)
  const [tlSort, setTlSort] = useState<'revenue' | 'assigned_at' | 'impressions' | 'clicks'>('revenue')
  const [tlDir,  setTlDir]  = useState<'ASC' | 'DESC'>('DESC')
  // Timeline filters: empty string = no filter. Server-side, so total/pagination
  // reflect the filtered subset.
  const [tlChannel, setTlChannel] = useState('')
  const [tlArticle, setTlArticle] = useState('')

  // ── Article tab state ─────────────────────────────────────────────────
  const [artPage, setArtPage] = useState(1)
  const [artSort, setArtSort] = useState('total_revenue')
  const [artDir,  setArtDir]  = useState<'ASC' | 'DESC'>('DESC')

  // ── Channel tab state ─────────────────────────────────────────────────
  const [chPage, setChPage] = useState(1)
  const [chSort, setChSort] = useState('total_revenue')
  const [chDir,  setChDir]  = useState<'ASC' | 'DESC'>('DESC')

  // ── Unattributed tab state ────────────────────────────────────────────
  const [uPage, setUPage] = useState(1)

  const { data: tlData, isLoading: tlLoading } = useRevenueByAssignment(
    {
      limit: LIMIT, offset: (tlPage - 1) * LIMIT,
      sortBy: tlSort, sortDir: tlDir,
      hideZero, from: range.from, to: range.to,
      channelId: tlChannel.trim() || undefined,
      articleId: tlArticle.trim() || undefined,
    },
    tab === 'timeline',
  )

  const { data: artData, isLoading: artLoading } = useRevenueByArticle(
    { limit: LIMIT, offset: (artPage - 1) * LIMIT, sortBy: artSort, sortDir: artDir, from: range.from, to: range.to },
    tab === 'article',
  )

  const { data: chData, isLoading: chLoading } = useRevenueByChannel(
    { limit: LIMIT, offset: (chPage - 1) * LIMIT, sortBy: chSort, sortDir: chDir, from: range.from, to: range.to },
    tab === 'channel',
  )

  const { data: uData, isLoading: uLoading } = useUnattributedRevenue(
    { limit: LIMIT, offset: (uPage - 1) * LIMIT, from: range.from, to: range.to },
    tab === 'unattributed',
  )

  function toggleSort<S extends string>(
    col: S,
    current: S,
    dir: 'ASC' | 'DESC',
    setSort: (s: S) => void,
    setDir: (d: 'ASC' | 'DESC') => void,
    setPage: (p: number) => void,
  ) {
    if (current === col) setDir(dir === 'DESC' ? 'ASC' : 'DESC')
    else { setSort(col); setDir('DESC') }
    setPage(1)
  }

  function handleRangeChange(newRange: { from: string; to: string }, newPreset: DatePreset) {
    setRange(newRange)
    setPreset(newPreset)
    setTlPage(1)
    setArtPage(1)
    setChPage(1)
    setUPage(1)
  }

  // Click an article id or channel id anywhere on the page → switch to
  // Timeline tab pre-filtered to that entity. Lets users drill from the
  // rollup view into the per-assignment breakdown in one click.
  function drillToArticle(articleId: string) {
    setTlArticle(articleId)
    setTlChannel('')
    setTlPage(1)
    setTab('timeline')
  }
  function drillToChannel(channelId: string) {
    setTlChannel(channelId)
    setTlArticle('')
    setTlPage(1)
    setTab('timeline')
  }

  // ── Client-side zero-revenue filter for rollup tabs ─────────────────────
  // Timeline endpoint applies hideZero server-side. By Article / By Channel
  // endpoints don't yet accept the flag, so filter client-side for parity.
  //
  // hideZero only hides CLOSED entities with $0. Currently-live rows
  // (article assigned/active, channel assigned) always show because they
  // represent live state — e.g. an article that was just reactivated to a
  // new channel hasn't earned anything yet but must be visible.
  const visibleArticles = (artData?.data ?? []).filter(
    (r: RevenueByArticle) =>
      !hideZero ||
      Number(r.total_revenue) > 0 ||
      r.article_status === 'assigned' ||
      r.article_status === 'active',
  )
  const visibleChannels = (chData?.data ?? []).filter(
    (r: RevenueByChannel) =>
      !hideZero ||
      Number(r.total_revenue) > 0 ||
      r.channel_status === 'assigned',
  )

  // ── Column defs ────────────────────────────────────────────────────────

  const tlCols = [
    {
      key: 'channel_id', label: 'Channel',
      render: (r: AssignmentRevenue) => (
        <button
          onClick={() => { setTlChannel(r.channel_id); setTlPage(1) }}
          className="font-mono text-xs text-zinc-400 hover:text-emerald-400 hover:underline cursor-pointer"
          title="Filter timeline by this channel"
        >{r.channel_id}</button>
      ),
    },
    {
      key: 'article_id', label: 'Article',
      render: (r: AssignmentRevenue) => (
        <button
          onClick={() => { setTlArticle(r.article_id); setTlPage(1) }}
          className="font-mono text-xs text-zinc-300 hover:text-emerald-400 hover:underline cursor-pointer text-left"
          title="Filter timeline by this article"
        >{r.article_id}</button>
      ),
    },
    { key: 'assigned_at',       label: 'From',        sortable: true, render: (r: AssignmentRevenue) => <span className="text-xs text-zinc-400">{shortDate(r.assigned_at)}</span> },
    { key: 'unassigned_at',     label: 'To',          render: (r: AssignmentRevenue) => r.unassigned_at ? <span className="text-xs text-zinc-400">{shortDate(r.unassigned_at)}</span> : <Badge status="active" /> },
    { key: 'assignment_status', label: 'Status',      render: (r: AssignmentRevenue) => <Badge status={r.assignment_status} /> },
    { key: 'impressions',       label: 'Impressions', sortable: true, render: (r: AssignmentRevenue) => <span className="tabular-nums">{number(r.impressions)}</span> },
    { key: 'clicks',            label: 'Clicks',      sortable: true, render: (r: AssignmentRevenue) => <span className="tabular-nums">{number(r.clicks)}</span> },
    { key: 'revenue',           label: 'Revenue',     sortable: true, render: (r: AssignmentRevenue) => <span className="tabular-nums font-semibold text-emerald-400">{currency(r.revenue)}</span> },
  ]

  // "Lifetime" qualifier on impressions/clicks/revenue makes it unambiguous
  // that these are summed across every assignment the article has ever had.
  // Per-assignment breakdowns live on the Timeline tab.
  // Two cohorts of columns:
  //   CURRENT   — live state of this entity right now (current article/channel + its revenue)
  //   LIFETIME  — accumulated history across every assignment the entity has ever had
  // The cohorts are positioned in column order so a reader scans current state first,
  // then lifetime totals. Lifetime values get a muted color + tooltip pointing to Timeline
  // for the per-assignment breakdown.
  const currentHint  = 'Revenue earned by the assignment currently live on this entity.'
  const lifetimeHint = 'Summed across every channel this article has ever run on. Click the article id to see the per-assignment breakdown in Timeline.'
  const artCols = [
    {
      key: 'article_id', label: 'Article',
      render: (r: RevenueByArticle) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => drillToArticle(r.article_id)}
            className="font-mono text-xs text-zinc-300 hover:text-emerald-400 hover:underline cursor-pointer text-left"
            title="Open in Timeline — see this article's per-channel revenue history"
          >{r.article_id}</button>
          {r.reactivated_at && (
            <span
              className="inline-flex items-center gap-0.5 rounded bg-amber-500/[0.15] px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 leading-none"
              title={`Reactivated ${new Date(r.reactivated_at).toLocaleString()} — this article was re-assigned to a channel after expiring.`}
            >↻ REACTIVATED</span>
          )}
        </div>
      ),
    },
    { key: 'url',                 label: 'URL',                  render: (r: RevenueByArticle) => r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="max-w-[220px] truncate block text-blue-400 hover:underline text-xs">{r.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 45)}</a> : <span className="text-zinc-600">—</span> },
    // ── current cohort ──
    { key: 'article_status',      label: 'Current Status',       render: (r: RevenueByArticle) => <Badge status={r.article_status} /> },
    {
      key: 'current_channel_id', label: 'Current Channel',
      render: (r: RevenueByArticle) =>
        r.current_channel_id
          ? <button onClick={() => drillToChannel(r.current_channel_id!)} className="font-mono text-xs text-zinc-300 hover:text-emerald-400 hover:underline cursor-pointer">{r.current_channel_id}</button>
          : <span className="text-zinc-600">—</span>,
    },
    { key: 'current_revenue',   label: 'Current Revenue',      render: (r: RevenueByArticle) => Number(r.current_revenue) > 0 ? <span className="tabular-nums font-semibold text-emerald-400" title={currentHint}>{currency(r.current_revenue)}</span> : <span className="tabular-nums text-zinc-600" title={currentHint}>$0.00</span> },
    // ── lifetime cohort ──
    { key: 'total_impressions', label: 'Lifetime Impressions', sortable: true, headerTitle: lifetimeHint, render: (r: RevenueByArticle) => <span className="tabular-nums text-zinc-500" title={lifetimeHint}>{number(r.total_impressions)}</span> },
    { key: 'total_clicks',      label: 'Lifetime Clicks',      sortable: true, headerTitle: lifetimeHint, render: (r: RevenueByArticle) => <span className="tabular-nums text-zinc-500" title={lifetimeHint}>{number(r.total_clicks)}</span> },
    { key: 'total_revenue',     label: 'Lifetime Revenue',     sortable: true, headerTitle: lifetimeHint, render: (r: RevenueByArticle) => <span className="tabular-nums font-semibold text-emerald-500/80" title={lifetimeHint}>{currency(r.total_revenue)}</span> },
    { key: 'rpm',               label: 'RPM',                  sortable: true, render: (r: RevenueByArticle) => <span className="tabular-nums text-zinc-400">{r.rpm !== '0' ? currency(r.rpm) : '—'}</span> },
  ]

  const channelLifetimeHint = 'Summed across every article that has ever run on this channel. Click the channel id to see the per-assignment breakdown in Timeline.'
  const chCols = [
    {
      key: 'channel_id', label: 'Channel',
      render: (r: RevenueByChannel) => (
        <button onClick={() => drillToChannel(r.channel_id)} className="font-mono text-xs text-zinc-300 hover:text-emerald-400 hover:underline cursor-pointer" title="Open in Timeline — see which articles earned this channel's revenue">{r.channel_id}</button>
      ),
    },
    // ── current cohort ──
    { key: 'channel_status',    label: 'Current Status',       render: (r: RevenueByChannel) => <Badge status={r.channel_status} /> },
    {
      key: 'current_article_id', label: 'Current Article',
      render: (r: RevenueByChannel) =>
        r.current_article_id
          ? <button onClick={() => drillToArticle(r.current_article_id!)} className="font-mono text-xs text-zinc-300 hover:text-emerald-400 hover:underline cursor-pointer text-left">{r.current_article_id}</button>
          : <span className="text-zinc-600">—</span>,
    },
    { key: 'current_revenue',   label: 'Current Revenue',      render: (r: RevenueByChannel) => Number(r.current_revenue) > 0 ? <span className="tabular-nums font-semibold text-emerald-400" title={currentHint}>{currency(r.current_revenue)}</span> : <span className="tabular-nums text-zinc-600" title={currentHint}>$0.00</span> },
    // ── lifetime cohort ──
    { key: 'articles_served',   label: 'Articles Served',      sortable: true, render: (r: RevenueByChannel) => <span className="tabular-nums text-zinc-500">{number(r.articles_served)}</span> },
    { key: 'total_impressions', label: 'Lifetime Impressions', sortable: true, headerTitle: channelLifetimeHint, render: (r: RevenueByChannel) => <span className="tabular-nums text-zinc-500" title={channelLifetimeHint}>{number(r.total_impressions)}</span> },
    { key: 'total_clicks',      label: 'Lifetime Clicks',      sortable: true, headerTitle: channelLifetimeHint, render: (r: RevenueByChannel) => <span className="tabular-nums text-zinc-500" title={channelLifetimeHint}>{number(r.total_clicks)}</span> },
    { key: 'total_revenue',     label: 'Lifetime Revenue',     sortable: true, headerTitle: channelLifetimeHint, render: (r: RevenueByChannel) => <span className="tabular-nums font-semibold text-emerald-500/80" title={channelLifetimeHint}>{currency(r.total_revenue)}</span> },
  ]

  const uCols = [
    { key: 'channel',      label: 'Channel',      render: (r: UnattributedRevenue) => <span className="font-mono text-xs text-zinc-400">{r.channel_id}</span> },
    { key: 'revenue',      label: 'Revenue',      render: (r: UnattributedRevenue) => <span className="tabular-nums font-semibold text-red-400">{currency(r.revenue)}</span> },
    { key: 'impressions',  label: 'Impressions',  render: (r: UnattributedRevenue) => <span className="tabular-nums">{number(r.impressions)}</span> },
    { key: 'period_start', label: 'Period Start', render: (r: UnattributedRevenue) => <span className="text-xs text-zinc-400">{shortDate(r.period_start)}</span> },
    { key: 'period_end',   label: 'Period End',   render: (r: UnattributedRevenue) => <span className="text-xs text-zinc-400">{shortDate(r.period_end)}</span> },
    { key: 'pulled_at',    label: 'Pulled',       render: (r: UnattributedRevenue) => <span className="text-xs text-zinc-500">{timeAgo(r.pulled_at)}</span> },
  ]

  const tabs: { id: Tab; label: string }[] = [
    { id: 'timeline',     label: 'Timeline' },
    { id: 'article',      label: 'By Article' },
    { id: 'channel',      label: 'By Channel' },
    { id: 'unattributed', label: 'Unattributed' },
  ]

  return (
    <div>
      <Header title="Revenue" subtitle="Materialized views refresh every 15 minutes" />
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1 rounded-lg border border-white/[0.07] bg-[#161616] p-1 w-fit">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.id ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {tab !== 'unattributed' && (
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideZero}
                  onChange={(e) => setHideZero(e.target.checked)}
                  className="accent-emerald-500 h-3.5 w-3.5"
                />
                Hide $0 rows
              </label>
            )}
            <DateRangeFilter preset={preset} value={range} onChange={handleRangeChange} />
          </div>
        </div>

        {tab === 'timeline' && (
          <>
            {/* Bifurcation controls — server-side filter by channel and/or article. */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={tlChannel}
                  onChange={(e) => { setTlChannel(e.target.value); setTlPage(1) }}
                  placeholder="Filter by channel id…"
                  className="w-56 rounded-md border border-white/[0.07] bg-[#161616] px-3 py-1.5 pr-7 text-xs text-zinc-200 placeholder-zinc-600 focus:border-white/[0.2] focus:outline-none font-mono"
                />
                {tlChannel && (
                  <button
                    onClick={() => { setTlChannel(''); setTlPage(1) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs"
                    aria-label="Clear channel filter"
                  >×</button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={tlArticle}
                  onChange={(e) => { setTlArticle(e.target.value); setTlPage(1) }}
                  placeholder="Filter by article id…"
                  className="w-72 rounded-md border border-white/[0.07] bg-[#161616] px-3 py-1.5 pr-7 text-xs text-zinc-200 placeholder-zinc-600 focus:border-white/[0.2] focus:outline-none font-mono"
                />
                {tlArticle && (
                  <button
                    onClick={() => { setTlArticle(''); setTlPage(1) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs"
                    aria-label="Clear article filter"
                  >×</button>
                )}
              </div>
              {(tlChannel || tlArticle) && (
                <button
                  onClick={() => { setTlChannel(''); setTlArticle(''); setTlPage(1) }}
                  className="text-xs text-zinc-500 hover:text-zinc-200 px-2 py-1.5"
                >
                  Clear all
                </button>
              )}
            </div>
            <TableWrap title="Channel × Article Timeline">
              {tlLoading ? (
                <table className="w-full"><tbody><SkeletonRows cols={8} /></tbody></table>
              ) : (
                <>
                  <Table
                    columns={tlCols}
                    data={tlData?.data ?? []}
                    sortBy={tlSort}
                    sortDir={tlDir}
                    onSort={(col) => toggleSort(col as typeof tlSort, tlSort, tlDir, setTlSort, setTlDir, setTlPage)}
                    emptyMessage={
                      tlChannel || tlArticle
                        ? 'No assignments match the current filter.'
                        : hideZero
                          ? 'No revenue-earning assignments in range. Toggle "Hide $0 rows" off to see all assignments.'
                          : 'No assignments in the selected range.'
                    }
                  />
                  {tlData && <Pagination page={tlPage} totalPages={Math.ceil(tlData.total / LIMIT)} total={tlData.total} limit={LIMIT} onPage={setTlPage} />}
                </>
              )}
            </TableWrap>
          </>
        )}

        {tab === 'article' && (
          <TableWrap title="Revenue by Article">
            {artLoading ? (
              <table className="w-full"><tbody><SkeletonRows cols={7} /></tbody></table>
            ) : (
              <>
                <Table
                  columns={artCols}
                  data={visibleArticles}
                  sortBy={artSort}
                  sortDir={artDir}
                  onSort={(col) => toggleSort(col, artSort, artDir, setArtSort, setArtDir, setArtPage)}
                  emptyMessage="No revenue data"
                />
                {artData && <Pagination page={artPage} totalPages={Math.ceil(artData.total / LIMIT)} total={artData.total} limit={LIMIT} onPage={setArtPage} />}
              </>
            )}
          </TableWrap>
        )}

        {tab === 'channel' && (
          <TableWrap title="Revenue by Channel">
            {chLoading ? (
              <table className="w-full"><tbody><SkeletonRows cols={6} /></tbody></table>
            ) : (
              <>
                <Table
                  columns={chCols}
                  data={visibleChannels}
                  sortBy={chSort}
                  sortDir={chDir}
                  onSort={(col) => toggleSort(col, chSort, chDir, setChSort, setChDir, setChPage)}
                  emptyMessage="No revenue data"
                />
                {chData && <Pagination page={chPage} totalPages={Math.ceil(chData.total / LIMIT)} total={chData.total} limit={LIMIT} onPage={setChPage} />}
              </>
            )}
          </TableWrap>
        )}

        {tab === 'unattributed' && (
          <TableWrap title="Unattributed Revenue Events">
            {uLoading ? (
              <table className="w-full"><tbody><SkeletonRows cols={6} /></tbody></table>
            ) : (
              <>
                <Table columns={uCols} data={uData?.data ?? []} emptyMessage="No unattributed revenue" />
                {uData && <Pagination page={uPage} totalPages={Math.ceil(uData.total / LIMIT)} total={uData.total} limit={LIMIT} onPage={setUPage} />}
              </>
            )}
          </TableWrap>
        )}
      </div>
    </div>
  )
}
