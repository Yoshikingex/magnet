'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface RankingEntry {
  rank_date: string
  rank_value: number | null
}

interface StoreWithRankings {
  id: number
  name: string
  rankings: RankingEntry[]
}

interface RankingChartProps {
  stores: StoreWithRankings[]
  title?: string
}

// カラーパレット
const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#84CC16',
]

export default function RankingChart({ stores, title }: RankingChartProps) {
  if (stores.length === 0) return null

  // 全日付を収集してソート
  const allDates = new Set<string>()
  stores.forEach((store) => {
    store.rankings.forEach((r) => allDates.add(r.rank_date))
  })
  const sortedDates = Array.from(allDates).sort()

  // チャートデータを作成
  const chartData = sortedDates.map((date) => {
    const entry: Record<string, string | number | null> = {
      date: date.substring(5), // MM-DD表示
      fullDate: date,
    }
    stores.forEach((store) => {
      const ranking = store.rankings.find((r) => r.rank_date === date)
      entry[store.name] = ranking?.rank_value ?? null
    })
    return entry
  })

  // 店舗名の短縮
  const shortStoreName = (name: string): string => {
    if (name.length > 15) {
      return name.substring(0, 15) + '...'
    }
    return name
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            reversed
            tick={{ fontSize: 11 }}
            label={{ value: 'ランキング', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value: unknown, name: unknown) => [
              `${value}位`,
              shortStoreName(String(name)),
            ]}
            labelFormatter={(label) => `日付: ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => shortStoreName(value)}
          />
          {stores.map((store, index) => (
            <Line
              key={store.id}
              type="monotone"
              dataKey={store.name}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
