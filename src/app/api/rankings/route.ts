import { NextRequest, NextResponse } from 'next/server'
import { getDb, type StoreRow, type RankingRow } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    const storeId = searchParams.get('store_id')
    const days = parseInt(searchParams.get('days') || '30')

    // 日付範囲の計算
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    const fromDateStr = fromDate.toISOString().split('T')[0]

    if (storeId) {
      const store = db.prepare(`
        SELECT s.*, a.name as agency_name
        FROM stores s JOIN agencies a ON a.id = s.agency_id
        WHERE s.id = ?
      `).get(parseInt(storeId))

      const rankings = db.prepare(`
        SELECT * FROM rankings
        WHERE store_id = ? AND rank_date >= ?
        ORDER BY rank_date ASC
      `).all(parseInt(storeId), fromDateStr)

      return NextResponse.json({ store, rankings })
    }

    if (agencyId) {
      const agency = db.prepare('SELECT * FROM agencies WHERE id = ?').get(parseInt(agencyId))
      const stores = db.prepare('SELECT * FROM stores WHERE agency_id = ? ORDER BY name').all(parseInt(agencyId)) as StoreRow[]

      const storesWithRankings = stores.map((store) => {
        const rankings = db.prepare(`
          SELECT * FROM rankings
          WHERE store_id = ? AND rank_date >= ?
          ORDER BY rank_date ASC
        `).all(store.id, fromDateStr)
        return { ...store, rankings }
      })

      return NextResponse.json({ agency, stores: storesWithRankings })
    }

    // 全代理店のデータ
    const agencies = db.prepare('SELECT * FROM agencies ORDER BY id').all() as { id: number; name: string }[]

    const allData = agencies.map((agency) => {
      const stores = db.prepare('SELECT * FROM stores WHERE agency_id = ? ORDER BY name').all(agency.id) as StoreRow[]

      const storesWithRankings = stores.map((store) => {
        const rankings = db.prepare(`
          SELECT * FROM rankings
          WHERE store_id = ? AND rank_date >= ?
          ORDER BY rank_date ASC
        `).all(store.id, fromDateStr) as RankingRow[]
        return { ...store, rankings }
      })

      return { ...agency, stores: storesWithRankings }
    })

    // 最終更新日時
    const lastLog = db.prepare(`
      SELECT * FROM fetch_logs
      WHERE status = 'success'
      ORDER BY fetched_at DESC
      LIMIT 1
    `).get() as { fetched_at: string } | undefined

    return NextResponse.json({
      agencies: allData,
      lastUpdated: lastLog?.fetched_at || null,
    })
  } catch (error) {
    console.error('Error fetching rankings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    )
  }
}
