// Visual indicator for articles that have churned through the
// active → expired → reactivated cycle. Color escalates with the count
// so high-churn articles stand out as candidates for investigation
// (intermittent traffic, mis-configured tracking, etc.) vs an article
// that bounced back once.
//
//   count 1     → amber  ("noticed, no action needed")
//   count 2-3   → orange ("watch this")
//   count 4+    → red    ("investigate — this article is unhealthy")

interface Props {
  count: number
  lastAt?: string | null
}

export function ReactivationBadge({ count, lastAt }: Props) {
  if (count <= 0) return null

  const tone =
    count >= 4
      ? { bg: 'bg-red-500/[0.15]',    text: 'text-red-300' }
      : count >= 2
        ? { bg: 'bg-orange-500/[0.15]', text: 'text-orange-300' }
        : { bg: 'bg-amber-500/[0.15]',  text: 'text-amber-300' }

  const tooltip = [
    `Reactivated ${count} time${count === 1 ? '' : 's'}.`,
    lastAt ? `Most recent: ${new Date(lastAt).toLocaleString()}.` : '',
    'This article has churned through expired → active cycles.',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded ${tone.bg} px-1.5 py-0.5 text-[10px] font-semibold ${tone.text} leading-none tabular-nums`}
      title={tooltip}
    >
      ↻ ×{count}
    </span>
  )
}
