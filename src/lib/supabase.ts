import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

function createSupabaseClient(url: string, key: string): SupabaseClient {
  if (!url || !key) {
    // ビルド時やenv未設定時はダミーを返す（実行時にエラーになる）
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
  return createClient(url, key)
}

// Client-side用（読み取り専用）
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Server-side用（書き込み可能）
export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey)

// 型定義
export interface Agency {
  id: number
  name: string
  created_at: string
}

export interface Store {
  id: number
  agency_id: number
  name: string
  status: '継続' | '新規'
  spreadsheet_url: string | null
  created_at: string
  updated_at: string
}

export interface Ranking {
  id: number
  store_id: number
  rank_date: string
  rank_value: number | null
  fetched_at: string
}

export interface FetchLog {
  id: number
  fetched_at: string
  status: string
  stores_updated: number
  error_message: string | null
}

// 店舗＋代理店名を含む拡張型
export interface StoreWithAgency extends Store {
  agency_name: string
}

// ランキング＋店舗情報を含む拡張型
export interface RankingWithStore extends Ranking {
  store_name: string
  agency_id: number
  agency_name: string
  status: string
}
