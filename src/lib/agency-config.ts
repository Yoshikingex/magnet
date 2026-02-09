// 代理店と店舗のマスタ設定
export interface AgencyConfig {
  name: string
  spreadsheetId: string
  stores: string[]
}

export const AGENCY_CONFIGS: AgencyConfig[] = [
  {
    name: '関西 株式会社Baddet',
    spreadsheetId: '1wtwD9L21gh31pY2eb6RSClBGreJTLHGOQCvBLVVQGFo',
    stores: [
      'TORIHADA SPA金山ルーム',
      '五反田 Esthe Spa',
      'belle femme',
      'Karen',
      'sirena（シレーナ）',
      'TORIHADA SPA名駅ルーム',
      'PRINCE（プリンス）',
    ],
  },
  {
    name: 'ネクサス',
    spreadsheetId: '1yU9qceWBv1vA66a-hgdTfdi02Wh1pX4lDoXfad5JFQQ',
    stores: [
      'Wonder Spa～ワンダースパ～銀座ルーム',
      'ALFARD（アルファード）',
      'Belle E',
      'D-SPA',
      'Aroma Levante（アロマレバンテ）新宿店',
      'NAOMI SPA（ナオミスパ）恵比寿店',
      'Nocturne Spa〜ノクターンスパ〜',
      'Gran CoCo',
      'AROMA MIREIA',
      '椿～oil～ 下北沢ルーム',
      'REMIS',
    ],
  },
  {
    name: 'ウーバー',
    spreadsheetId: '1NRh5N51RFGW_litOddswm44imL7CJ0oZpjiFvjI9qsc',
    stores: [
      '神のエステ 新宿ルーム',
      '神のエステ 葛西店',
      '神のエステ 日暮里・鶯谷店',
      '神のエステ 五反田店',
      '神のエステ 赤羽・王子・板橋',
      '神のエステ 赤坂店',
      '小悪魔Spa Tokyo',
      '小悪魔Spa Tokyo 蒲田ルーム',
    ],
  },
  {
    name: '東海インターベル',
    spreadsheetId: '1oa4YLEdEzTUVPV6nE-S4JhE9zpqFHC3HDwuijhuq-j0',
    stores: [
      'Platinum',
      'アロマダイヤモンド',
    ],
  },
  {
    name: 'KGエンタープライズ',
    spreadsheetId: '1hrbs97c36XBvlkD17sUvmKKvgBSf6ZwTDz7hL7zhYq4',
    stores: [
      'CREST SPA（クレストスパ）FC赤羽店',
      'CREST SPA（クレストスパ）吉祥寺',
    ],
  },
]
