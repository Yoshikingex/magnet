'use client'

import RankingTable from './RankingTable'
import RankingChart from './RankingChart'
import { calculateChange, calculateAgencyAverage, formatChange } from '@/lib/ranking-calc'

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

interface AgencyCardProps {
  agencyName: string
  stores: StoreWithRankings[]
}

export default function AgencyCard({ agencyName, stores }: AgencyCardProps) {
  // 代理店全体の平均変動を計算
  const dailyChanges = stores.map((s) => calculateChange(s.rankings, 1))
  const weeklyChanges = stores.map((s) => calculateChange(s.rankings, 7))
  const monthlyChanges = stores.map((s) => calculateChange(s.rankings, 30))

  const avgDaily = calculateAgencyAverage(dailyChanges)
  const avgWeekly = calculateAgencyAverage(weeklyChanges)
  const avgMonthly = calculateAgencyAverage(monthlyChanges)

  const avgDailyFmt = formatChange(avgDaily.change)
  const avgWeeklyFmt = formatChange(avgWeekly.change)
  const avgMonthlyFmt = formatChange(avgMonthly.change)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-lg font-bold text-white">{agencyName}</h2>
        <p className="text-blue-100 text-sm mt-1">{stores.length} 店舗</p>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">1日平均変動</p>
          <p className={`text-lg font-bold ${avgDailyFmt.color}`}>
            {avgDailyFmt.arrow} {avgDailyFmt.text}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">1週間平均変動</p>
          <p className={`text-lg font-bold ${avgWeeklyFmt.color}`}>
            {avgWeeklyFmt.arrow} {avgWeeklyFmt.text}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">1ヶ月平均変動</p>
          <p className={`text-lg font-bold ${avgMonthlyFmt.color}`}>
            {avgMonthlyFmt.arrow} {avgMonthlyFmt.text}
          </p>
        </div>
      </div>

      {/* テーブル */}
      <div className="p-4">
        <RankingTable stores={stores} />
      </div>

      {/* グラフ */}
      <div className="p-4 pt-0">
        <RankingChart stores={stores} title="ランキング推移（30日間）" />
      </div>
    </div>
  )
}
