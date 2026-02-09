'use client'

import { useState, useEffect, useCallback } from 'react'
import AgencyTabs from './AgencyTabs'
import AgencyCard from './AgencyCard'
import UpdateButton from './UpdateButton'

interface RankingEntry {
  id: number
  rank_date: string
  rank_value: number | null
}

interface Store {
  id: number
  name: string
  status: string
  rankings: RankingEntry[]
}

interface Agency {
  id: number
  name: string
  stores: Store[]
}

interface DashboardData {
  agencies: Agency[]
  lastUpdated: string | null
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rankings?days=30')
      if (!response.ok) throw new Error('Failed to fetch data')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('データの読み込みに失敗しました')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未取得'
    const date = new Date(dateStr)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 表示する代理店をフィルタ
  const filteredAgencies = data?.agencies
    ? selectedAgencyId === null
      ? data.agencies
      : data.agencies.filter((a) => a.id === selectedAgencyId)
    : []

  // 全体サマリー計算
  const totalStores = data?.agencies?.reduce((sum, a) => sum + a.stores.length, 0) || 0
  const storesWithData =
    data?.agencies?.reduce(
      (sum, a) => sum + a.stores.filter((s) => s.rankings.length > 0).length,
      0
    ) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                マグネット管理ツール
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                最終更新: {formatDate(data?.lastUpdated ?? null)} |
                {totalStores}店舗中 {storesWithData}店舗のデータあり
              </p>
            </div>
            <UpdateButton onUpdateComplete={fetchData} />
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* タブ */}
        {data?.agencies && (
          <div className="mb-6">
            <AgencyTabs
              agencies={data.agencies.map((a) => ({
                id: a.id,
                name: a.name,
                store_count: a.stores.length,
              }))}
              selectedId={selectedAgencyId}
              onSelect={setSelectedAgencyId}
            />
          </div>
        )}

        {/* ローディング */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* 代理店カード */}
        {!isLoading && !error && (
          <div className="space-y-8">
            {filteredAgencies.map((agency) => (
              <AgencyCard
                key={agency.id}
                agencyName={agency.name}
                stores={agency.stores}
              />
            ))}

            {filteredAgencies.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg mb-2">データがありません</p>
                <p className="text-sm">
                  「データ更新」ボタンを押してマグネットからランキングデータを取得してください
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400">
          マグネット管理ツール - 代理店別店舗ランキング管理
        </div>
      </footer>
    </div>
  )
}
