// src/components/ui/date-range-filter.tsx
'use client'

import { useState } from 'react'
import { type DatePreset, type DateRange, presetToRange } from '@/lib/date-presets'

interface Props {
  value: DateRange
  preset: DatePreset
  onChange: (range: DateRange, preset: DatePreset) => void
}

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  '7d':   'Last 7 days',
  '30d':  'Last 30 days',
  custom: 'Custom',
}

export function DateRangeFilter({ value, preset, onChange }: Props) {
  const [localFrom, setLocalFrom] = useState(value.from)
  const [localTo, setLocalTo] = useState(value.to)

  function handlePresetChange(newPreset: DatePreset) {
    if (newPreset === 'custom') {
      onChange(value, 'custom')
      return
    }
    const range = presetToRange(newPreset)
    setLocalFrom(range.from)
    setLocalTo(range.to)
    onChange(range, newPreset)
  }

  function handleCustomApply() {
    if (!localFrom || !localTo) return
    if (localFrom > localTo) return  // basic validation
    onChange({ from: localFrom, to: localTo }, 'custom')
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
        className="rounded-md border border-white/[0.07] bg-[#161616] px-3 py-1.5 text-sm text-zinc-200 focus:border-white/20 focus:outline-none"
      >
        {(Object.keys(PRESET_LABELS) as DatePreset[]).map((p) => (
          <option key={p} value={p}>{PRESET_LABELS[p]}</option>
        ))}
      </select>

      {preset === 'custom' && (
        <>
          <input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            max={localTo || undefined}
            className="rounded-md border border-white/[0.07] bg-[#161616] px-2 py-1.5 text-sm text-zinc-200 focus:border-white/20 focus:outline-none"
          />
          <span className="text-zinc-500 text-sm">→</span>
          <input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            min={localFrom || undefined}
            className="rounded-md border border-white/[0.07] bg-[#161616] px-2 py-1.5 text-sm text-zinc-200 focus:border-white/20 focus:outline-none"
          />
          <button
            onClick={handleCustomApply}
            disabled={!localFrom || !localTo || localFrom > localTo}
            className="rounded-md bg-white/[0.08] px-3 py-1.5 text-sm font-medium text-white hover:bg-white/[0.12] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </>
      )}
    </div>
  )
}