import { google } from 'googleapis'
import { AGENCY_CONFIGS } from './agency-config'

interface SheetStoreData {
  storeName: string
  status: string
}

// Google Sheets API認証
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !privateKey) {
    throw new Error('Google Service Account credentials not configured')
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

// スプレッドシートから最新シートの店舗データを取得
export async function getStoresFromSheet(spreadsheetId: string): Promise<SheetStoreData[]> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // シート一覧を取得（一番左=最新シート）
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
  })

  const sheetList = spreadsheet.data.sheets
  if (!sheetList || sheetList.length === 0) {
    throw new Error(`No sheets found in spreadsheet ${spreadsheetId}`)
  }

  // 一番左（index 0）のシートを使用
  const latestSheet = sheetList[0]
  const sheetName = latestSheet.properties?.title

  if (!sheetName) {
    throw new Error('Could not determine sheet name')
  }

  // A列とG列のデータを取得
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:G`,
  })

  const rows = response.data.values
  if (!rows) {
    return []
  }

  const stores: SheetStoreData[] = []

  // 1行目はヘッダーの可能性があるのでスキップ
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const storeName = row[0]?.toString().trim()
    const status = row[6]?.toString().trim() // G列（0-indexed: 6）

    if (storeName && (status === '継続' || status === '新規')) {
      stores.push({ storeName, status })
    }
  }

  return stores
}

// 全代理店のスプレッドシートからデータ取得
export async function getAllStoresFromSheets(): Promise<
  { agencyName: string; stores: SheetStoreData[] }[]
> {
  const results = []

  for (const config of AGENCY_CONFIGS) {
    try {
      const stores = await getStoresFromSheet(config.spreadsheetId)
      results.push({
        agencyName: config.name,
        stores,
      })
    } catch (error) {
      console.error(`Error fetching sheet for ${config.name}:`, error)
      // エラーでも既知の店舗リストをフォールバックとして使用
      results.push({
        agencyName: config.name,
        stores: config.stores.map((name) => ({ storeName: name, status: '継続' })),
      })
    }
  }

  return results
}
