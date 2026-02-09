-- =====================================================
-- マグネット管理ツール Supabase スキーマ
-- Supabaseダッシュボードの SQL Editor で実行してください
-- =====================================================

-- 代理店テーブル
CREATE TABLE IF NOT EXISTS agencies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 店舗テーブル
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('継続', '新規')),
  spreadsheet_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ランキング履歴テーブル
CREATE TABLE IF NOT EXISTS rankings (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  rank_date DATE NOT NULL,
  rank_value DECIMAL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, rank_date)
);

-- データ取得ログ
CREATE TABLE IF NOT EXISTS fetch_logs (
  id SERIAL PRIMARY KEY,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  stores_updated INTEGER DEFAULT 0,
  error_message TEXT
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_rankings_store_date ON rankings(store_id, rank_date DESC);
CREATE INDEX IF NOT EXISTS idx_stores_agency ON stores(agency_id);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_date ON fetch_logs(fetched_at DESC);

-- RLS (Row Level Security) ポリシー
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fetch_logs ENABLE ROW LEVEL SECURITY;

-- 読み取り許可（anon key用）
CREATE POLICY "Allow read agencies" ON agencies FOR SELECT USING (true);
CREATE POLICY "Allow read stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Allow read rankings" ON rankings FOR SELECT USING (true);
CREATE POLICY "Allow read fetch_logs" ON fetch_logs FOR SELECT USING (true);

-- 書き込み許可（service role key用）
CREATE POLICY "Allow insert agencies" ON agencies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update agencies" ON agencies FOR UPDATE USING (true);
CREATE POLICY "Allow insert stores" ON stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update stores" ON stores FOR UPDATE USING (true);
CREATE POLICY "Allow insert rankings" ON rankings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update rankings" ON rankings FOR UPDATE USING (true);
CREATE POLICY "Allow insert fetch_logs" ON fetch_logs FOR INSERT WITH CHECK (true);

-- =====================================================
-- 初期データ: 代理店
-- =====================================================
INSERT INTO agencies (name) VALUES
  ('関西 株式会社Baddet'),
  ('ネクサス'),
  ('ウーバー'),
  ('東海インターベル'),
  ('KGエンタープライズ')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 初期データ: 店舗（代理店IDはサブクエリで取得）
-- =====================================================

-- 関西 株式会社Baddet の店舗
INSERT INTO stores (agency_id, name, status) VALUES
  ((SELECT id FROM agencies WHERE name = '関西 株式会社Baddet'), 'TORIHADA SPA金山ルーム', '継続'),
  ((SELECT id FROM agencies WHERE name = '関西 株式会社Baddet'), '五反田 Esthe Spa', '継続'),
  ((SELECT id FROM agencies WHERE name = '関西 株式会社Baddet'), 'belle femme', '継続'),
  ((SELECT id FROM agencies WHERE name = '関西 株式会社Baddet'), 'Karen', '継続'),
  ((SELECT id FROM agencies WHERE name = '関西 株式会社Baddet'), 'sirena（シレーナ）', '継続'),
  ((SELECT id FROM agencies WHERE name = '関西 株式会社Baddet'), 'TORIHADA SPA名駅ルーム', '継続'),
  ((SELECT id FROM agencies WHERE name = '関西 株式会社Baddet'), 'PRINCE（プリンス）', '継続')
ON CONFLICT DO NOTHING;

-- ネクサスの店舗
INSERT INTO stores (agency_id, name, status) VALUES
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'Wonder Spa～ワンダースパ～銀座ルーム', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'ALFARD（アルファード）', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'Belle E', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'D-SPA', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'Aroma Levante（アロマレバンテ）新宿店', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'NAOMI SPA（ナオミスパ）恵比寿店', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'Nocturne Spa〜ノクターンスパ〜', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'Gran CoCo', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'AROMA MIREIA', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), '椿～oil～ 下北沢ルーム', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ネクサス'), 'REMIS', '継続')
ON CONFLICT DO NOTHING;

-- ウーバーの店舗
INSERT INTO stores (agency_id, name, status) VALUES
  ((SELECT id FROM agencies WHERE name = 'ウーバー'), '神のエステ 恵比寿店（新宿）', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ウーバー'), '神のエステ 恵比寿店（恵比寿）', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ウーバー'), '神のエステ 日暮里・鶯谷店', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ウーバー'), '神のエステ 五反田', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ウーバー'), '神のエステ 赤羽店', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ウーバー'), '神のエステ 赤坂店', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ウーバー'), '小悪魔Spa Tokyo', '継続'),
  ((SELECT id FROM agencies WHERE name = 'ウーバー'), '小悪魔Spa Tokyo 蒲田ルーム', '継続')
ON CONFLICT DO NOTHING;

-- 東海インターベルの店舗
INSERT INTO stores (agency_id, name, status) VALUES
  ((SELECT id FROM agencies WHERE name = '東海インターベル'), 'Platinum', '継続'),
  ((SELECT id FROM agencies WHERE name = '東海インターベル'), 'アロマダイヤモンド', '継続')
ON CONFLICT DO NOTHING;

-- KGエンタープライズの店舗
INSERT INTO stores (agency_id, name, status) VALUES
  ((SELECT id FROM agencies WHERE name = 'KGエンタープライズ'), 'CREST SPA（クレストスパ）FC赤羽店', '継続'),
  ((SELECT id FROM agencies WHERE name = 'KGエンタープライズ'), 'CREST SPA（クレストスパ）吉祥寺', '継続')
ON CONFLICT DO NOTHING;
