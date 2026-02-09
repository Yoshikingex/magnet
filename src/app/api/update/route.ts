import { NextResponse } from 'next/server'
import { getDb, type StoreRow } from '@/lib/db'
import { fetchMagnetRankings, filterRankingsForStores } from '@/lib/magnet-scraper'
import { AGENCY_CONFIGS } from '@/lib/agency-config'

export const dynamic = 'force-dynamic'

// 店舗名マッチング用のヘルパー関数
function normalize(s: string): string {
  return s.replace(/[\s　]/g, '').replace(/[（(]/g, '(').replace(/[）)]/g, ')').replace(/[〜～~]/g, '~').toLowerCase()
}

// 括弧記号だけ除去（中身は残す）: 神のエステ（赤羽）→ 神のエステ赤羽
function removeBracketChars(s: string): string {
  return s.replace(/[\s　]/g, '').replace(/[（(）)〜～~]/g, '').toLowerCase()
}

// 括弧とその中身を除去: TORIHADA SPA（トリハダスパ）金山ルーム → TORIHADA SPA金山ルーム
function stripBracketContent(s: string): string {
  return s.replace(/[\s　]/g, '').replace(/[（(][^）)]*[）)]/g, '').replace(/[〜～~][^〜～~]*[〜～~]/g, '').toLowerCase()
}

// 最もマッチ度の高い店舗を返す
function findBestMatch(scrapedName: string, dbStores: StoreRow[]): StoreRow | undefined {
  // 1. 完全一致
  const exact = dbStores.find(s => s.name === scrapedName)
  if (exact) return exact

  const nScraped = normalize(scrapedName)

  // 2. 正規化完全一致
  const normExact = dbStores.find(s => normalize(s.name) === nScraped)
  if (normExact) return normExact

  // 3a. 括弧記号除去して完全一致
  const bScraped = removeBracketChars(scrapedName)
  const bracketExact = dbStores.find(s => removeBracketChars(s.name) === bScraped)
  if (bracketExact) return bracketExact

  // 3b. 括弧+中身除去して完全一致
  const sScraped = stripBracketContent(scrapedName)
  const stripExact = dbStores.find(s => stripBracketContent(s.name) === sScraped)
  if (stripExact) return stripExact

  // 4. 正規化includes - 最も文字数差が少ないものを選択
  let bestMatch: StoreRow | undefined
  let bestDiff = Infinity
  for (const store of dbStores) {
    const nStore = normalize(store.name)
    if (nScraped.includes(nStore) || nStore.includes(nScraped)) {
      const diff = Math.abs(nScraped.length - nStore.length)
      if (diff < bestDiff) {
        bestDiff = diff
        bestMatch = store
      }
    }
  }
  if (bestMatch) return bestMatch

  // 5. 括弧記号除去includes - 最も文字数差が少ないものを選択
  bestDiff = Infinity
  for (const store of dbStores) {
    const bStore = removeBracketChars(store.name)
    if (bScraped.includes(bStore) || bStore.includes(bScraped)) {
      const diff = Math.abs(bScraped.length - bStore.length)
      if (diff < bestDiff) {
        bestDiff = diff
        bestMatch = store
      }
    }
  }
  return bestMatch
}

export async function POST() {
  const startTime = Date.now()
  let storesUpdated = 0

  try {
    const db = getDb()

    // 1. マグネットダッシュボードからランキング取得
    console.log('Fetching rankings from Magnet dashboard...')
    const allRankings = await fetchMagnetRankings()
    console.log(`Fetched ${allRankings.length} stores from Magnet`)

    // 2. DB内の全店舗を取得
    const stores = db.prepare('SELECT id, name, agency_id FROM stores').all() as StoreRow[]

    // 3. 各代理店の店舗名リストを作成
    const allStoreNames = AGENCY_CONFIGS.flatMap((config) => config.stores)

    // 4. 対象店舗のランキングのみフィルタ
    const filteredRankings = filterRankingsForStores(allRankings, allStoreNames)
    console.log(`Filtered to ${filteredRankings.length} target stores`)

    // 5. ランキングデータをDBに保存
    const upsertRanking = db.prepare(`
      INSERT INTO rankings (store_id, rank_date, rank_value)
      VALUES (?, ?, ?)
      ON CONFLICT(store_id, rank_date) DO UPDATE SET
        rank_value = excluded.rank_value,
        fetched_at = datetime('now')
    `)

    const transaction = db.transaction(() => {
      for (const ranking of filteredRankings) {
        const matchedStore = findBestMatch(ranking.storeName, stores)

        if (!matchedStore) {
          console.warn(`Store not found in DB: ${ranking.storeName}`)
          continue
        }

        for (const entry of ranking.rankings) {
          upsertRanking.run(matchedStore.id, entry.date, entry.value)
          storesUpdated++
        }
      }
    })

    transaction()

    // 6. 取得ログを記録
    db.prepare(
      'INSERT INTO fetch_logs (status, stores_updated) VALUES (?, ?)'
    ).run('success', storesUpdated)

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      message: `データ更新完了 (${duration}秒)`,
      totalScraped: allRankings.length,
      targetStores: filteredRankings.length,
      rankingsUpdated: storesUpdated,
    })
  } catch (error) {
    console.error('Update error:', error)

    try {
      const db = getDb()
      db.prepare(
        'INSERT INTO fetch_logs (status, stores_updated, error_message) VALUES (?, ?, ?)'
      ).run('error', storesUpdated, error instanceof Error ? error.message : 'Unknown error')
    } catch {
      // ログ記録のエラーは無視
    }

    return NextResponse.json(
      {
        success: false,
        message: 'データ取得に失敗しました',
      },
      { status: 500 }
    )
  }
}
