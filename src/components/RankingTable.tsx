'use client'

import { calculateChange, formatChange } from '@/lib/ranking-calc'

interface RankingEntry {
  rank_date: string
  rank_value: number | null
}

interface StoreWithRankings {
  id: number
  name: string
  status: string
  rankings: RankingEntry[]
}

interface RankingTableProps {
  stores: StoreWithRankings[]
}

export default function RankingTable({ stores }: RankingTableProps) {
  if (stores.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        データがありません。「データ更新」ボタンを押してください。
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-600">店舗名</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">ステータス</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">現在</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">1日変動</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">1週間変動</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">1ヶ月変動</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => {
            const daily = calculateChange(store.rankings, 1)
            const weekly = calculateChange(store.rankings, 7)
            const monthly = calculateChange(store.rankings, 30)

            const dailyFmt = formatChange(daily.change)
            const weeklyFmt = formatChange(weekly.change)
            const monthlyFmt = formatChange(monthly.change)

            // 最新のランキング値
            const latestRanking =
              store.rankings.length > 0
                ? [...store.rankings].sort(
                    (a, b) =>
                      new Date(b.rank_date).getTime() - new Date(a.rank_date).getTime()
                  )[0]?.rank_value
                : null

            return (
              <tr key={store.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-800">{store.name}</span>
                </td>
                <td className="text-center py-3 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      store.status === '新規'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {store.status}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  <span className="font-bold text-gray-900">
                    {latestRanking !== null ? `${latestRanking}位` : '-'}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  <span className={`font-medium ${dailyFmt.color}`}>
                    {dailyFmt.arrow} {dailyFmt.text}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  <span className={`font-medium ${weeklyFmt.color}`}>
                    {weeklyFmt.arrow} {weeklyFmt.text}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  <span className={`font-medium ${monthlyFmt.color}`}>
                    {monthlyFmt.arrow} {monthlyFmt.text}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
