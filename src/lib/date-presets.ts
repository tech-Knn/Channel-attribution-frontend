// src/lib/date-presets.ts

export type DatePreset = 'today' | '7d' | '30d' | 'custom'

export interface DateRange {
  from: string  // 'YYYY-MM-DD'
  to: string    // 'YYYY-MM-DD'
}

/** Format a Date as 'YYYY-MM-DD' in the browser's local timezone. */
export function toISODate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Calendar day arithmetic — subtract N days from a Date, returns new Date. */
function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

/** Convert a preset to {from, to} in local calendar terms. */
export function presetToRange(preset: Exclude<DatePreset, 'custom'>): DateRange {
  const today = new Date()
  const todayStr = toISODate(today)
  switch (preset) {
    case 'today':
      return { from: todayStr, to: todayStr }
    case '7d':
      return { from: toISODate(addDays(today, -6)), to: todayStr }
    case '30d':
      return { from: toISODate(addDays(today, -29)), to: todayStr }
  }
}