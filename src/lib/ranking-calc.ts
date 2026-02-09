// ランキング計算ユーティリティ

export interface RankingEntry {
  rank_date: string
  rank_value: number | null
}

export interface RankingChange {
  current: number | null
  previous: number | null
  change: number | null // 正の値 = 上昇（ランクが下がった = 改善）
  changePercent: number | null
}

// 指定日数前のランキングとの変動を計算
// ランキングは数字が小さいほど上位。変動は「前の値 - 現在の値」で計算。
// 正の値 = 上昇（改善）, 負の値 = 下降（悪化）
export function calculateChange(
  rankings: RankingEntry[],
  daysBack: number
): RankingChange {
  if (rankings.length === 0) {
    return { current: null, previous: null, change: null, changePercent: null }
  }

  // 日付でソート（新しい順）
  const sorted = [...rankings].sort(
    (a, b) => new Date(b.rank_date).getTime() - new Date(a.rank_date).getTime()
  )

  const current = sorted[0]?.rank_value ?? null
  if (current === null) {
    return { current: null, previous: null, change: null, changePercent: null }
  }

  // daysBack日前に最も近いデータを検索
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - daysBack)

  let previous: number | null = null
  let closestDiff = Infinity

  for (const entry of sorted) {
    if (entry.rank_value === null) continue
    const entryDate = new Date(entry.rank_date)
    const diff = Math.abs(entryDate.getTime() - targetDate.getTime())
    if (diff < closestDiff) {
      closestDiff = diff
      previous = entry.rank_value
    }
  }

  if (previous === null) {
    return { current, previous: null, change: null, changePercent: null }
  }

  const change = previous - current // 正 = 上昇
  const changePercent = previous !== 0 ? (change / previous) * 100 : null

  return { current, previous, change, changePercent }
}

// 代理店全体の平均変動を計算
export function calculateAgencyAverage(
  storeChanges: RankingChange[]
): RankingChange {
  const validChanges = storeChanges.filter((c) => c.change !== null)

  if (validChanges.length === 0) {
    return { current: null, previous: null, change: null, changePercent: null }
  }

  const avgCurrent =
    validChanges.reduce((sum, c) => sum + (c.current ?? 0), 0) / validChanges.length
  const avgPrevious =
    validChanges.reduce((sum, c) => sum + (c.previous ?? 0), 0) / validChanges.length
  const avgChange =
    validChanges.reduce((sum, c) => sum + (c.change ?? 0), 0) / validChanges.length
  const avgChangePercent =
    validChanges.reduce((sum, c) => sum + (c.changePercent ?? 0), 0) / validChanges.length

  return {
    current: Math.round(avgCurrent * 10) / 10,
    previous: Math.round(avgPrevious * 10) / 10,
    change: Math.round(avgChange * 10) / 10,
    changePercent: Math.round(avgChangePercent * 10) / 10,
  }
}

// 変動の表示用フォーマット
export function formatChange(change: number | null): {
  text: string
  color: string
  arrow: string
} {
  if (change === null) {
    return { text: '-', color: 'text-gray-400', arrow: '' }
  }

  if (change > 0) {
    return {
      text: `+${change.toFixed(1)}`,
      color: 'text-green-600',
      arrow: '↑',
    }
  } else if (change < 0) {
    return {
      text: `${change.toFixed(1)}`,
      color: 'text-red-600',
      arrow: '↓',
    }
  } else {
    return { text: '±0', color: 'text-gray-500', arrow: '→' }
  }
}
