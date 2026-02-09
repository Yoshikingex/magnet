import puppeteer, { Browser, Page } from 'puppeteer'

export interface ScrapedRanking {
  storeName: string
  rankings: { date: string; value: number }[]
}

const MAGNET_LOGIN_URL = 'https://admin.magnet.tokyo/login'
const MAGNET_TRENDS_URL = 'https://admin.magnet.tokyo/dashboard/trends'

// マグネットダッシュボードにログイン
async function login(page: Page): Promise<void> {
  const email = process.env.MAGNET_EMAIL
  const password = process.env.MAGNET_PASSWORD

  if (!email || !password) {
    throw new Error('Magnet credentials not configured')
  }

  await page.goto(MAGNET_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // メールアドレス入力 - 複数セレクタを試行
  const emailSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[name="login"]',
    'input[type="text"]',
  ]
  for (const selector of emailSelectors) {
    const el = await page.$(selector)
    if (el) {
      await el.click({ clickCount: 3 }) // 既存テキストを選択
      await el.type(email, { delay: 30 })
      break
    }
  }

  // パスワード入力
  const passwordSelectors = [
    'input[type="password"]',
    'input[name="password"]',
  ]
  for (const selector of passwordSelectors) {
    const el = await page.$(selector)
    if (el) {
      await el.click({ clickCount: 3 })
      await el.type(password, { delay: 30 })
      break
    }
  }

  // ログインボタンクリック - 複数の方法を試行
  const buttonSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button.btn-primary',
    'button.login-btn',
  ]
  let clicked = false
  for (const selector of buttonSelectors) {
    const btn = await page.$(selector)
    if (btn) {
      await btn.click()
      clicked = true
      break
    }
  }

  if (!clicked) {
    // ボタンが見つからない場合はテキストで検索
    const buttons = await page.$$('button')
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent || '', btn)
      if (text.includes('ログイン') || text.includes('Login') || text.includes('サインイン')) {
        await btn.click()
        clicked = true
        break
      }
    }
  }

  if (!clicked) {
    // 最終手段: Enterキー
    await page.keyboard.press('Enter')
  }

  // ページ遷移を待機
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // ログイン状態確認
  const currentUrl = page.url()
  console.log('After login, current URL:', currentUrl)
}

// ランキングデータをスクレイピング
async function scrapeRankings(page: Page): Promise<ScrapedRanking[]> {
  await page.goto(MAGNET_TRENDS_URL, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise((resolve) => setTimeout(resolve, 5000))

  const currentUrl = page.url()
  console.log('Trends page URL:', currentUrl)

  // ページのスクリーンショットをデバッグ用に保存
  const path = require('path')
  const screenshotPath = path.join(process.cwd(), 'data', 'debug-trends.png')
  await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {})

  // テーブルデータを抽出
  const data = await page.evaluate(() => {
    const results: { storeName: string; rankings: { date: string; value: number }[] }[] = []

    const tables = document.querySelectorAll('table')
    if (tables.length === 0) return results

    // 最大のテーブルを使用
    let mainTable = tables[0]
    let maxRows = 0
    tables.forEach((t) => {
      const rowCount = t.querySelectorAll('tr').length
      if (rowCount > maxRows) {
        maxRows = rowCount
        mainTable = t
      }
    })

    const allRows = mainTable.querySelectorAll('tr')
    if (allRows.length < 2) return results

    // ヘッダー行（1行目）から日付を取得
    // 構造: 店舗名 | 推移 | 01-10 | 01-11 | ... | 合計金額
    const headerCells = allRows[0].querySelectorAll('th, td')
    const dates: string[] = []
    const dateColIndices: number[] = []

    for (let i = 0; i < headerCells.length; i++) {
      const text = headerCells[i].textContent?.trim() || ''
      if (/^\d{2}-\d{2}$/.test(text)) {
        const year = new Date().getFullYear()
        const [month, day] = text.split('-')
        // 年をまたぐケースを処理（12月のデータが1月より前にある場合）
        dates.push(`${year}-${month}-${day}`)
        dateColIndices.push(i)
      }
    }

    if (dates.length === 0) return results

    // データ行を処理（2行目以降）
    for (let i = 1; i < allRows.length; i++) {
      const cells = allRows[i].querySelectorAll('td')
      if (cells.length < 3) continue

      // 店舗名（1列目）
      const firstCell = cells[0]
      let storeName = ''

      // まずリンクのテキストを取得
      const link = firstCell.querySelector('a')
      if (link) {
        storeName = link.textContent?.trim() || ''
      }

      // リンクがなければセル全体のテキスト（ボタン等除外）
      if (!storeName) {
        const clone = firstCell.cloneNode(true) as HTMLElement
        clone.querySelectorAll('button, a.btn, span.btn, [class*="btn"]').forEach((el) => el.remove())
        storeName = clone.textContent?.trim() || ''
      }

      // 不要テキスト除去
      storeName = storeName
        .replace(/（退会）/g, '')
        .replace(/\(退会\)/g, '')
        .replace(/レポートダウンロード/g, '')
        .replace(/店舗分析/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (!storeName || storeName.length < 2) continue

      // 日付列に対応するセルからランキング値を取得
      const rankings: { date: string; value: number }[] = []

      for (let j = 0; j < dateColIndices.length; j++) {
        const colIdx = dateColIndices[j]
        if (colIdx < cells.length) {
          const cellText = cells[colIdx].textContent?.trim() || ''
          const numValue = parseFloat(cellText)
          // ランキング値: 0.1 ~ 9999 の範囲
          if (!isNaN(numValue) && numValue > 0 && numValue < 10000) {
            rankings.push({ date: dates[j], value: numValue })
          }
        }
      }

      if (rankings.length > 0) {
        results.push({ storeName, rankings })
      }
    }

    return results
  })

  console.log(`Scraped ${data.length} stores from trends page`)
  if (data.length > 0) {
    console.log('Sample store:', data[0].storeName, '- rankings:', data[0].rankings.length)
  }

  return data
}

// メイン関数: スクレイピング実行
export async function fetchMagnetRankings(): Promise<ScrapedRanking[]> {
  let browser: Browser | null = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    await page.setViewport({ width: 1920, height: 1080 })

    // ログイン
    console.log('Logging in to Magnet...')
    await login(page)

    // ランキングデータ取得
    console.log('Scraping rankings...')
    const rankings = await scrapeRankings(page)

    return rankings
  } catch (error) {
    console.error('Scraping error:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// 店舗名を正規化（マッチング用）
function normalizeStoreName(name: string): string {
  return name
    .replace(/[\s　]/g, '')
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')
    .replace(/[〜～~]/g, '~')
    .toLowerCase()
}

// 括弧内のテキストを除去した簡易名を取得
function simplifyStoreName(name: string): string {
  return name
    .replace(/[\s　]/g, '')
    .replace(/[（(][^）)]*[）)]/g, '') // 括弧とその中身を除去
    .replace(/[〜～~][^〜～~]*[〜～~]/g, '') // 〜で囲まれた読みを除去
    .toLowerCase()
}

// 対象店舗名で部分一致フィルタリング
export function filterRankingsForStores(
  allRankings: ScrapedRanking[],
  targetStoreNames: string[]
): ScrapedRanking[] {
  return allRankings.filter((ranking) => {
    return targetStoreNames.some((target) => {
      if (ranking.storeName === target) return true

      // 通常の正規化でマッチ
      const normalizedRanking = normalizeStoreName(ranking.storeName)
      const normalizedTarget = normalizeStoreName(target)
      if (
        normalizedRanking.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedRanking)
      ) {
        return true
      }

      // 括弧内を除去した簡易名でマッチ
      const simpleRanking = simplifyStoreName(ranking.storeName)
      const simpleTarget = simplifyStoreName(target)
      if (
        simpleRanking.includes(simpleTarget) ||
        simpleTarget.includes(simpleRanking)
      ) {
        return true
      }

      return false
    })
  })
}
