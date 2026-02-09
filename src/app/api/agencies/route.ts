import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()

    const agencies = db.prepare(`
      SELECT a.*, COUNT(s.id) as store_count
      FROM agencies a
      LEFT JOIN stores s ON s.agency_id = a.id
      GROUP BY a.id
      ORDER BY a.id
    `).all()

    return NextResponse.json({ agencies })
  } catch (error) {
    console.error('Error fetching agencies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
